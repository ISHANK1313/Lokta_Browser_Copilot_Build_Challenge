// NegotiationCard — one-screen, print-friendly card to carry into the branch (PRD FR4, O-Card).
// Includes the lender-quote comparator: quote vs fair band → BELOW FAIR / FAIR / OVERPRICED.
import { useState } from 'react';
import type { Outputs } from '../types';
import { fmtInr, fmtPct } from '../rules/format';

export default function NegotiationCard({
  o,
  offerRatePct,
  offerFeePct,
  onBack,
}: {
  o: Outputs;
  offerRatePct: number | null;
  offerFeePct: number | null;
  onBack: () => void;
}) {
  const [quoteStr, setQuoteStr] = useState(offerRatePct != null ? String(offerRatePct) : '');
  const quote = quoteStr.trim() === '' ? null : Number(quoteStr);

  let comparator: { verdict: string; cls: string; line: string } | null = null;
  if (quote != null && !Number.isNaN(quote)) {
    if (quote > o.o3.fairHigh) {
      const over = Math.round((quote - o.o3.fairHigh) * 10) / 10;
      comparator = {
        verdict: 'OVERPRICED',
        cls: 'bg-red-50 text-red-900 border-red-200',
        line: `Lender says ${fmtPct(quote)}% → OVERPRICED by ~${fmtPct(over)} points. Walk in anchored at ${o.card.fairBand} and make them beat the top of your band.`,
      };
    } else if (quote < o.o3.fairLow) {
      comparator = {
        verdict: 'BELOW FAIR',
        cls: 'bg-emerald-50 text-emerald-900 border-emerald-200',
        line: `Lender says ${fmtPct(quote)}% → BELOW your fair band. Good rate — check the processing fee${offerFeePct != null ? ` (they quoted ${fmtPct(offerFeePct)}%)` : ''} and prepayment terms before signing.`,
      };
    } else {
      comparator = {
        verdict: 'FAIR',
        cls: 'bg-amber-50 text-amber-900 border-amber-200',
        line: `Lender says ${fmtPct(quote)}% → FAIR for your profile. Negotiate the fee and tenure instead of the rate.`,
      };
    }
  }

  return (
    <div className="space-y-4">
      <div className="print-area rounded-xl bg-white p-4 shadow-sm ring-1 ring-accent/15">
        <div className="flex items-start justify-between gap-3 border-b border-accent/15 pb-3">
          <div>
            <h2 className="font-serif text-xl font-semibold text-ink">Negotiation Card</h2>
            <p className="text-xs text-ink/50">Self-reported numbers · not a lender quote · {new Date().toLocaleDateString('en-IN')}</p>
          </div>
          <span className="rounded-md bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">{o.card.route}</span>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-paper px-3 py-2.5">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink/50">Fair rate</dt>
            <dd className="font-mono text-xl font-semibold text-ink">{o.card.fairBand}</dd>
          </div>
          <div className="rounded-lg bg-paper px-3 py-2.5">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink/50">All-in APR</dt>
            <dd className="font-mono text-xl font-semibold text-ink">{o.card.aprBand}</dd>
          </div>
          <div className="col-span-2 rounded-lg bg-paper px-3 py-2.5">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink/50">EMI ceiling — do not cross</dt>
            <dd className="font-mono text-xl font-semibold text-ink">{fmtInr(o.card.ceiling)}/mo</dd>
          </div>
        </dl>

        <ul className="mt-3 space-y-1.5">
          {o.card.whys.map((w, i) => (
            <li key={i} className="flex gap-2 text-xs leading-snug text-ink/70">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accent/50" aria-hidden="true" />
              {w}
            </li>
          ))}
        </ul>

        <p className="mt-3 border-t border-accent/10 pt-2 text-[10px] leading-snug text-ink/40">
          Bands are judgement + industry norms (Sep 2026), not bureau data. APR approximates the processing fee; GST/insurance
          not included. Confidence this session: {o.confidence}.
        </p>
      </div>

      {/* comparator */}
      <div className="no-print rounded-xl bg-white p-4 shadow-sm ring-1 ring-accent/10">
        <label htmlFor="quote" className="text-sm font-semibold text-ink">
          What rate is the lender offering? (%)
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="quote"
            type="number"
            inputMode="decimal"
            step="0.05"
            value={quoteStr}
            onChange={(e) => setQuoteStr(e.target.value)}
            placeholder="e.g. 14"
            className="w-full rounded-lg border border-accent/25 bg-white px-3 py-2.5 font-mono text-lg text-ink focus:border-accent"
          />
        </div>
        {comparator && (
          <div className={`mt-3 rounded-lg border px-3 py-2.5 text-sm ${comparator.cls}`} role="status">
            <span className="font-semibold">{comparator.verdict}</span>
            <span className="mt-0.5 block text-xs leading-snug opacity-90">{comparator.line}</span>
          </div>
        )}
      </div>

      <div className="no-print space-y-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="w-full rounded-lg bg-accent px-4 py-3 font-semibold text-white transition hover:opacity-90"
        >
          Print / save as PDF
        </button>
        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-lg border border-accent/25 bg-white px-4 py-2.5 text-sm font-medium text-ink/70 transition hover:border-accent hover:text-accent"
        >
          ← Back to results
        </button>
      </div>
    </div>
  );
}
