// RangeBar — LenderLikelyMax vs SafeMax, side by side, proportionally scaled (O2 visual).
import { fmtInr } from '../rules/format';

export default function RangeBar({
  lender,
  safe,
  wanted,
}: {
  lender: number;
  safe: number;
  wanted?: number;
}) {
  const max = Math.max(lender, safe, wanted ?? 0, 1);
  const bar = (v: number, label: string, sub: string, cls: string) => (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-ink/70">{label}</span>
        <span className="font-mono text-sm font-semibold text-ink">{fmtInr(v)}</span>
      </div>
      <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-stone-200/70" aria-hidden="true">
        <div className={`h-full rounded-full ${cls}`} style={{ width: `${Math.max(2, (v / max) * 100)}%` }} />
      </div>
      <div className="mt-0.5 text-[11px] text-ink/50">{sub}</div>
    </div>
  );
  return (
    <div className="space-y-3">
      {bar(lender, 'Lender will likely sanction', 'FOIR math + longest tenure — what the letter says', 'bg-accent/60')}
      {bar(safe, 'You can safely carry', 'Surplus after expenses + shock buffer — what you should ask for', 'bg-emerald-600')}
      {wanted != null && wanted > 0 && (
        <div className="text-xs text-ink/60">
          You asked for <span className="font-mono font-semibold text-ink">{fmtInr(wanted)}</span>
        </div>
      )}
    </div>
  );
}
