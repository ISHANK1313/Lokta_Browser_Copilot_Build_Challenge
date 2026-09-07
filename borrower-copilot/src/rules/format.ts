// Pure number formatting helpers. No React imports.

export const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function fmtInr(v: number): string {
  return inr.format(Math.round(v));
}

/** "₹5,50,000–6,50,000" style compact range */
export function fmtRange(low: number, high: number): string {
  return `${fmtInr(low)}–${fmtInr(high)}`;
}

/** "11–12.5%" — trims trailing .0 */
export function fmtPct(v: number): string {
  return Number.isInteger(v) ? String(v) : String(Number(v.toFixed(1)));
}

export function fmtPctBand(low: number, high: number): string {
  return `${fmtPct(low)}–${fmtPct(high)}%`;
}
