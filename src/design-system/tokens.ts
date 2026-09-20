/**
 * LEGAKU Centralized Design System Tokens
 * Brand: LEGAKU
 * Tagline: "Atur uang. Hidup lebih lega."
 * Supporting: "Teman keluarga untuk memahami uang, merencanakan masa depan, dan mengambil keputusan finansial dengan lebih tenang."
 */

export const COLORS = {
  // Primary Greens
  primary: {
    900: '#144D3A', // Warna utama, tombol utama, heading, ikon aktif, FAB, saldo card
    700: '#2E7D61', // Aksen, tombol hover, progress indicators
    500: '#4CAF8A', // Aksen sekunder, ilustrasi
    100: '#E8F2EC', // Background lembut, container ikon, kartu terpilih
    50: '#F9FAF7',  // Background halaman utama
  },
  // Secondary / Warm Sage
  secondary: {
    DEFAULT: '#D6C6AC', // Aksen hangat, elemen dekoratif
    sage: '#D6C6AC',
  },
  // Neutral Typography
  text: {
    primary: '#1F2937',   // Teks utama
    secondary: '#6B7280', // Teks sekunder, deskripsi
    tertiary: '#9CA3AF',  // Teks tersier, placeholder
  },
  // Surfaces & Borders
  surface: '#FFFFFF',     // Kartu, modal, input, surfaces
  background: '#F9FAF7',  // Latar belakang halaman
  border: '#E5E7EB',      // Garis, divider, border
  // Functional Statuses
  status: {
    success: '#22C55E',   // Notifikasi sukses, status positif
    warning: '#F59E0B',   // Peringatan, pengingat
    error: '#EF4444',     // Error, status negatif
  },
} as const;

export const TYPOGRAPHY = {
  fontFamily: 'Poppins, sans-serif',
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
  },
  scale: {
    h1: { fontSize: '28px', lineHeight: '36px', fontWeight: 700 },
    h2: { fontSize: '22px', lineHeight: '28px', fontWeight: 600 },
    h3: { fontSize: '18px', lineHeight: '24px', fontWeight: 600 },
    bodyLarge: { fontSize: '16px', lineHeight: '24px', fontWeight: 400 },
    body: { fontSize: '14px', lineHeight: '20px', fontWeight: 400 },
    caption: { fontSize: '12px', lineHeight: '16px', fontWeight: 400 },
    small: { fontSize: '11px', lineHeight: '14px', fontWeight: 500 },
  },
} as const;

export const RADIUS = {
  button: '14px',
  input: '14px',
  card: '20px',
  modal: '24px',
  fab: '9999px',
} as const;

export const SHADOWS = {
  soft: '0 4px 20px rgba(20, 77, 58, 0.08)',
  subtle: '0 2px 10px rgba(20, 77, 58, 0.04)',
  elevated: '0 10px 30px rgba(20, 77, 58, 0.12)',
} as const;
