// ConfidenceBadge — Low/Medium/High pill + "because …" reason (PRD §5.4).
import type { Confidence } from '../types';

const STYLES: Record<Confidence, { cls: string; dot: string }> = {
  High: { cls: 'bg-emerald-50 text-emerald-800 border-emerald-300', dot: 'bg-emerald-600' },
  Medium: { cls: 'bg-amber-50 text-amber-800 border-amber-300', dot: 'bg-amber-500' },
  Low: { cls: 'bg-stone-100 text-stone-700 border-stone-300', dot: 'bg-stone-500' },
};

export default function ConfidenceBadge({ level, why }: { level: Confidence; why: string }) {
  const s = STYLES[level];
  return (
    <div className={`inline-flex max-w-full items-start gap-2 rounded-lg border px-3 py-2 text-sm ${s.cls}`}>
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${s.dot}`} aria-hidden="true" />
      <span>
        <span className="font-semibold">Confidence: {level}</span>
        <span className="block text-xs leading-snug opacity-90">{why}</span>
      </span>
    </div>
  );
}
