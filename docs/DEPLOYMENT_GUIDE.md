# PANDUAN DEPLOYMENT PRODUKSI & STAGING — LEGAKU

Dokumen ini memandu proses deployment aplikasi **LEGAKU (v0.5.0+)** ke lingkungan produksi dan staging agar dapat diakses oleh keluarga penguji beta secara langsung di ponsel (*smartphone*) maupun komputer.

---

## 1. Persiapan Database Supabase Production

### A. Buat Project Baru di Supabase
1. Kunjungi [supabase.com](https://supabase.com) dan buat project baru (misal: `legaku-production`).
2. Pilih region terdekat dengan pengguna Indonesia: **Singapore (`ap-southeast-1`)**.
3. Simpan **Database Password** di tempat yang aman.

### B. Jalankan Skrip Migrasi Skema
Buka menu **SQL Editor** pada dashboard Supabase Anda, lalu jalankan file-file migrasi berikut secara berurutan:
1. [`supabase/migrations/20260920000001_initial_schema.sql`](file:///Users/agung5s7/Desktop/LEGAKU/supabase/migrations/20260920000001_initial_schema.sql) (Tabel profiles, families, accounts, transactions, goals, budgets & RLS)
2. [`supabase/migrations/20260920000002_legaku_phase3.sql`](file:///Users/agung5s7/Desktop/LEGAKU/supabase/migrations/20260920000002_legaku_phase3.sql) (Transfer engine, templates, recurring rules, family activity logs)
3. [`supabase/migrations/20260920000003_legaku_phase4.sql`](file:///Users/agung5s7/Desktop/LEGAKU/supabase/migrations/20260920000003_legaku_phase4.sql) (Subscriptions, billing events, webhook idempotency)
4. [`supabase/migrations/20260920000004_legaku_phase5.sql`](file:///Users/agung5s7/Desktop/LEGAKU/supabase/migrations/20260920000004_legaku_phase5.sql) (Security audit logs, rate limits, beta feedback & invite tokens)

### C. Konfigurasi Authentication & Redirect URLs
1. Di dashboard Supabase, buka menu **Authentication ➔ URL Configuration**.
2. Masukkan **Site URL**: `https://<your-project>.vercel.app` (atau domain kustom Anda bila DNS sudah di-pointing).
3. Tambahkan ke **Redirect URLs**:
   - `https://*.vercel.app/**`
   - `http://localhost:5173/**` (untuk pengujian lokal)
   - `https://app.legaku.com/**` *(Hanya jika domain kustom `legaku.com` telah dikonfigurasi DNS-nya)*

---

## 2. Deployment Frontend ke Vercel (Rekomendasi Utama)

### A. Sambungkan Repositori Git
1. Buka [vercel.com](https://vercel.com) dan klik **Add New Project**.
2. Hubungkan repositori GitHub/GitLab LEGAKU Anda.

### B. Pengaturan Build & Output
Vercel akan otomatis mengenali framework Vite berkat file [`vercel.json`](file:///Users/agung5s7/Desktop/LEGAKU/vercel.json):
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### C. Isi Environment Variables di Vercel
Pada bagian **Environment Variables**, tambahkan:
| Key | Value Contoh | Deskripsi |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://xyzproject.supabase.co` | URL API Supabase Anda |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Anon/Public API Key |
| `VITE_APP_URL` | `https://your-app.vercel.app` | Domain publik aktif (Gunakan URL Vercel atau domain kustom aktif) |

*Catatan: Domain `app.legaku.com` pada panduan ini adalah contoh placeholder. Jangan jadikan domain tersebut sebagai default sebelum DNS dan sertifikat SSL domain kustom resmi dikonfigurasi.*
*Jika variabel Supabase belum diisi, aplikasi akan tetap berjalan mulus dalam mode Demo Interaktif yang aman digunakan untuk evaluasi visual dan pengujian awal.*

### D. Deploy!
Klik tombol **Deploy**. Dalam waktu ~1-2 menit, aplikasi LEGAKU akan live dengan sertifikat SSL HTTPS otomatis.

---

## 3. Deployment Alternatif (Cloudflare Pages / Netlify)
File [`public/_redirects`](file:///Users/agung5s7/Desktop/LEGAKU/public/_redirects) telah disediakan dengan konfigurasi:
```
/* /index.html 200
```
Hal ini memastikan Single-Page Application (SPA) routing tidak mengalami error 404 saat pengguna melakukan refresh halaman atau mengakses URL dalam aplikasi.

---

## 4. Setup Custom Domain (Contoh: `app.legaku.com`)
1. Di Vercel Dashboard, buka **Project Settings ➔ Domains**.
2. Masukkan domain/subdomain pilihan (misal: `app.legaku.com`).
3. Tambahkan record DNS di penyedia domain Anda:
   - **Type**: `CNAME`
   - **Name**: `app`
   - **Value**: `cname.vercel-dns.com`
4. Tunggu propagasi DNS (biasanya 5–15 menit). Vercel akan otomatis menerbitkan sertifikat SSL Let's Encrypt secara gratis.

---

## 5. Verifikasi Instalasi PWA (Progressive Web App)
Setelah live di domain HTTPS:
1. Buka URL aplikasi di **Safari iOS** atau **Chrome Android**.
2. Pastikan prompt banner instalasi muncul atau dapat ditambahkan ke Home Screen.
3. Buka ikon aplikasi di Home Screen: aplikasi akan terbuka dalam mode **Standalone Fullscreen** (tanpa browser address bar), persis seperti aplikasi native iOS/Android!
