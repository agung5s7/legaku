# DOKUMENTASI PRODUKSI & DEPLOYMENT — LEGAKU

Dokumen ini memuat panduan komprehensif arsitektur produksi, konfigurasi lingkungan (*environment*), kebijakan keamanan (*security policies*), alur peluncuran (*deployment flow*), dan strategi mitigasi/rollback untuk aplikasi **LEGAKU**.

---

## 1. Arsitektur Lingkungan (*Environment Architecture*)

LEGAKU memisahkan konfigurasi menjadi dua tingkat keamanan ketat:

### A. Client-Safe Variables (Frontend / Vite)
Variabel berikut diinjeksi ke dalam bundel klien saat proses `vite build` menggunakan awalan `VITE_`. Variabel ini aman untuk dibaca oleh browser pengguna:

```bash
# Supabase URL & Anon Public Key (Dilindungi oleh Supabase Row Level Security)
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi... (anon key)
```

> [!IMPORTANT]
> **Zero Secrets in Client Bundle:**
> - `SUPABASE_SERVICE_ROLE_KEY` **TIDAK PERNAH** dimasukkan ke frontend.
> - Kunci API AI (Gemini / OpenAI / Vision OCR) **TIDAK PERNAH** dimasukkan ke frontend.
> - Kode voucher founder (`LEGAKUFOUNDER`) diverifikasi server-side melalui cryptographic SHA-256 hash dan database RPC.

### B. Server-Side / Edge Function Variables (Secure Secrets)
Variabel berikut hanya dikonfigurasi di dashboard Supabase / Vercel Environment Secrets dan tidak pernah terekspos ke klien:

```bash
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... (service_role secret)
AI_PROVIDER_API_KEY=AIzaSy... (Google Gemini / LLM key)
PAYMENT_WEBHOOK_SECRET=whsec_... (HMAC Webhook Secret)
```

---

## 2. Alur Deployment (*Deployment Flow*)

### Alur Vercel (Frontend PWA)
1. **Repository Push**: Push branch `main` ke GitHub/GitLab.
2. **Build Settings Vercel**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build` (`tsc -b && vite build`)
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`
3. **PWA Pre-caching**: `vite-plugin-pwa` mengompilasi Service Worker dengan cache assets statis (HTML, JS, CSS, SVG logo, Web Fonts).
4. **Header Keamanan**: Dikonfigurasi header HTTP di Vercel:
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Content-Security-Policy`: membatasi koneksi hanya ke Supabase domain dan CDN Google Fonts.

---

## 3. Konfigurasi Database Supabase & Migrasi

Seluruh skema database dikelola melalui migrasi terstruktur di `supabase/migrations/`:
- `20260920000000_legaku_schema.sql` (Pondasi profil, keluarga, rekening, transaksi)
- `20260920000001_legaku_phase2.sql` (Pusat analitik AI, receipt metadata)
- `20260920000002_legaku_phase3.sql` (Transfer antar rekening, recurring, notifications)
- `20260920000003_legaku_phase4.sql` (Plans, subscriptions, ai_usage, financial profiles)
- `20260920000004_legaku_phase5.sql` (Beta invites, feedback, secure founder RPC, delete account)

### Menjalankan Migrasi ke Lingkungan Produksi:
```bash
# Login Supabase CLI
supabase login

# Tautkan proyek produksi
supabase link --project-ref <your-production-project-id>

# Terapkan seluruh migrasi
supabase db push
```

---

## 4. Keamanan & Row Level Security (RLS)

Setiap tabel di Supabase diwajibkan mengaktifkan RLS:
1. **Isolasi Keluarga**: Data transaksi, rekening, anggaran, dan target impian hanya dapat dibaca dan dimodifikasi oleh pengguna yang terdaftar di tabel `family_members` pada `family_id` yang sama via fungsi `public.is_family_member(family_id)`.
2. **Founder Codes**: Tabel `founder_codes` memiliki kebijakan `USING (false)` untuk akses langsung klien, dan hanya dapat dipanggil melalui RPC `redeem_founder_code(input_code_hash)` berstatus `SECURITY DEFINER`.
3. **Data Export & Deletion**: Seluruh pembersihan data personal dilakukan berjenjang melalui fungsi `delete_user_account()`.

---

## 5. Strategi Rollback (*Rollback Strategy*)

Jika terjadi kendala kritis pada rilis produksi:

### Frontend Rollback (Vercel):
1. Buka dashboard Vercel → tab **Deployments**.
2. Cari deployment stabil sebelumnya yang telah terverifikasi.
3. Klik titik tiga (⋮) → pilih **Promote to Production** (instan dalam < 15 detik).
4. Service Worker PWA akan secara otomatis mendeteksi update dan mengunduh versi stabil baru pada reload berikutnya.

### Database Rollback:
- Semua migrasi LEGAKU dirancang bersifat non-destruktif (*additive*).
- Sebelum menjalankan migrasi skema mayor, lakukan snapshot database manual di dashboard Supabase: **Database → Backups → Create Backup**.

---

## 6. Observabilitas & Telemetri Nir-Data Sensitif

LEGAKU menggunakan prinsip telemetri privasi:
- **TIDAK PERNAH** mencatat nominal angka transaksi, nomor rekening bank, teks transkrip percakapan finansial, atau foto struk.
- Event yang dicatat mencakup tindakan operasional tingkat tinggi: `onboarding_completed`, `first_transaction`, `partner_invited`, `feedback_submitted`, `monthly_review_opened`.
- **North Star Metric**: *Active Financial Families (AFF)* dihitung berdasarkan keluarga yang aktif melakukan minimal 2 engagement bermakna dalam periode 30 hari berjalan.
