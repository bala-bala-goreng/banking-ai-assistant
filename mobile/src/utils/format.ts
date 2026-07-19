/** "1500000" | 1500000 -> "Rp1.500.000" (Indonesian grouping, no decimals for IDR). */
export function formatIDR(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'Rp0';
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    return 'Rp0';
  }
  const sign = n < 0 ? '-' : '';
  const whole = Math.trunc(Math.abs(n)).toString();
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}Rp${grouped}`;
}

/** ISO timestamp -> "19 Jul 2026 14:05" */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) {
    return '-';
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
  ];
  const pad = (x: number) => x.toString().padStart(2, '0');
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Keep digits only — used for amount / account number / PIN inputs. */
export function digitsOnly(text: string): string {
  return text.replace(/\D/g, '');
}
