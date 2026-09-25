/**
 * Format number to Indonesian Rupiah currency string
 * Example: 150000 -> "Rp 150.000"
 */
export function formatRupiah(amount: number, includePrefix = true): string {
  if (isNaN(amount)) amount = 0;
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));

  return includePrefix ? `Rp ${formatted}` : formatted;
}

/**
 * Format number to concise Indonesian short currency
 * Example: 15000000 -> "Rp 15 Jt", 750000 -> "Rp 750 Rb"
 */
export function formatShortRupiah(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1).replace('.0', '')} M`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1).replace('.0', '')} Jt`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)} Rb`;
  }
  return formatRupiah(amount);
}

/**
 * Parses raw input string into valid number
 * Example: "Rp 150.000" -> 150000
 */
export function parseRupiahInput(value: string): number {
  const clean = value.replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
}

/**
 * Standard Indonesian date format: DD/MM/YYYY
 * Example: "2026-09-25" -> "25/09/2026"
 */
export function formatIndoDate(dateStr: string | Date): string {
  try {
    if (!dateStr) return '';
    // Handle YYYY-MM-DD string cleanly without timezone drift
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const parts = dateStr.slice(0, 10).split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return typeof dateStr === 'string' ? dateStr : '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return typeof dateStr === 'string' ? dateStr : '';
  }
}

export const formatDateIndonesian = formatIndoDate;
export const formatDateDDMMYYYY = formatIndoDate;

/**
 * Relative date group title for transaction history using DD/MM/YYYY
 * Example: Today -> "Hari Ini (25/09/2026)"
 * Yesterday -> "Kemarin (24/09/2026)"
 * Other -> "23/09/2026"
 */
export function getRelativeDateTitle(dateStr: string): string {
  try {
    const formatted = formatIndoDate(dateStr);
    const target = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday =
      target.getFullYear() === today.getFullYear() &&
      target.getMonth() === today.getMonth() &&
      target.getDate() === today.getDate();

    const isYesterday =
      target.getFullYear() === yesterday.getFullYear() &&
      target.getMonth() === yesterday.getMonth() &&
      target.getDate() === yesterday.getDate();

    if (isToday) return `Hari Ini (${formatted})`;
    if (isYesterday) return `Kemarin (${formatted})`;

    return formatted;
  } catch {
    return dateStr;
  }
}
