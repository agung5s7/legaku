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
 * Human-friendly Indonesian date format
 * Example: "2026-09-20" -> "20 September 2026"
 */
export function formatIndoDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export const formatDateIndonesian = formatIndoDate;

/**
 * Relative date group title for transaction history
 * Example: Today -> "Hari Ini, 20 September"
 * Yesterday -> "Kemarin, 19 September"
 */
export function getRelativeDateTitle(dateStr: string): string {
  try {
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

    const dayMonth = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
    }).format(target);

    if (isToday) return `Hari Ini, ${dayMonth}`;
    if (isYesterday) return `Kemarin, ${dayMonth}`;

    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: target.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    }).format(target);
  } catch {
    return dateStr;
  }
}
