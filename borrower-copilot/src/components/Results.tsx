// Results — O1 hero + O2 dual routes + O3 fair/APR bands + O4 ceiling/tenure/stress,
// whys everywhere, confidence badge, and the full explain trail (PRD FR3).
import type { Outputs } from '../types';
import { fmtInr, fmtPctBand } from '../rules/format';
import ConfidenceBadge from './ConfidenceBadge';
import RangeBar from './RangeBar';

const VERDICT_STYLE = {
  BORROW: { label: 'BORROW', cls: 'bg-emerald-600', note: 'Your numbers support this loan — negotiate from the fair band below.' },
  BORROW_LESS: { label: 'BORROW LESS', cls: 'bg-amber-500', note: 'A lender may sanction more — borrow the safe number instead.' },
  DONT_BORROW: { label: "DON'T BORROW (yet)", cls: 'bg-red-600', note: 'Fix the underlying problem first; new debt makes this worse.' },
} as const;

export default function Results({
  o,
  onOpenCard,
  onEdit,
}: {
  o: Outputs;
  onOpenCard: () => void;
  onEdit: () => void;
}) {
  const v = VERDICT_STYLE[o.o1.verdict];
  return (
    <div className="space-y-5">
      {/* ---------- O1 verdict hero ---------- */}
      <section aria-label="Verdict" className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-accent/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Step 1 · Verdict</p>
        <div className={`mt-1 inline-block rounded-lg px-3 py-1.5 font-serif text-2xl font-semibold text-white ${v.cls}`}>
          {v.label}
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-ink">{o.o1.reason}</p>
        <ul className="mt-2 space-y-1">
          {o.o1.whys.map((w, i) => (
            <li key={i} className="flex gap-2 text-sm leading-snug text-ink/75">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/50" aria-hidden="true" />
              {w}
            </li>
          ))}
        </ul>
        {o.o1.securedRoute && (
          <p className="mt-2 rounded-lg bg-accent-soft px-3 py-2 text-sm font-medium text-accent">
            Recommended route: loan against property (secured) — see Step 2.
          </p>
        )}
      </section>

      {/* ---------- O2 amounts ---------- */}
      <section aria-label="Maximum amounts" className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-accent/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Step 2 · How much</p>
        {o.o2.blocked ? (
          <p className="mt-2 text-sm text-ink/70">{o.o2.blockedWhy}</p>
        ) : (
          <div className="mt-3 space-y-4">
            {o.o2.routes.map((r) => (
              <div key={r.route} className={o.o2.routes.length > 1 ? 'rounded-lg border border-accent/15 p-3' : ''}>
                {o.o2.routes.length > 1 && (
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                    {r.route === 'lap' ? 'Route B · Secured (LAP)' : 'Route A · Unsecured'}
                  </p>
                )}
                <RangeBar lender={r.lenderMax} safe={r.safeMax} wanted={undefined} />
                <p className="mt-2 text-xs leading-snug text-ink/60">{r.why}</p>
              </div>
            ))}
            <div className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
              <span className="font-semibold">Use this: {fmtInr(o.o2.useThis)}</span> — the safe number, not the sanction letter.
            </div>
            <p className="text-xs leading-snug text-ink/60">{o.o2.why}</p>
          </div>
        )}
      </section>

      {/* ---------- O3 fair rate ---------- */}
      <section aria-label="Fair interest rate" className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-accent/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Step 3 · Fair rate</p>
        <p className="mt-2 font-mono text-3xl font-semibold text-ink">{fmtPctBand(o.o3.fairLow, o.o3.fairHigh)}</p>
        <p className="text-sm text-ink/60">
          all-in APR <span className="font-mono">{fmtPctBand(o.o3.aprLow, o.o3.aprHigh)}</span> (fee included, approximate)
        </p>
        {o.o3.widened && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            You said &quot;don&apos;t know&quot; on something — we widened the band instead of guessing zero.
          </p>
        )}
        {o.o3.addOns.length > 0 && (
          <ul className="mt-2 space-y-1">
            {o.o3.addOns.map((a, i) => (
              <li key={i} className="text-xs leading-snug text-ink/60">• {a}</li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs leading-snug text-ink/60">{o.o3.why}</p>
      </section>


      {/* ---------- O4 EMI ceiling + stress ---------- */}
      <section aria-label="EMI ceiling and stress test" className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-accent/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Step 4 · EMI ceiling</p>
        <p className="mt-2 font-mono text-3xl font-semibold text-ink">
          {fmtInr(o.o4.ceiling)}<span className="text-base font-normal text-ink/50">/mo</span>
        </p>
        <p className="text-xs text-ink/60">Hard do-not-cross number.</p>
        <p className="mt-2 text-xs leading-snug text-ink/60">{o.o4.why}</p>

        {o.o4.tenureTable.length > 0 && (
          <table className="mt-3 w-full text-sm">
            <caption className="sr-only">EMI for the safe amount at the fair mid rate, by tenure</caption>
            <thead>
              <tr className="border-b border-accent/15 text-left text-xs uppercase tracking-wide text-ink/50">
                <th scope="col" className="py-1.5 pr-2 font-semibold">Tenure</th>
                <th scope="col" className="py-1.5 pr-2 font-semibold">EMI/mo</th>
                <th scope="col" className="py-1.5 font-semibold">Total interest</th>
              </tr>
            </thead>
            <tbody>
              {o.o4.tenureTable.map((r) => (
                <tr key={r.years} className="border-b border-accent/5">
                  <td className="py-1.5 pr-2">{r.years} yr</td>
                  <td className="py-1.5 pr-2 font-mono">{fmtInr(r.emi)}</td>
                  <td className="py-1.5 font-mono text-ink/70">{fmtInr(r.totalInterest ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div
          className={`mt-3 rounded-lg px-3 py-2.5 text-sm ${
            o.o4.stress.pass ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'
          }`}
        >
          <span className="font-semibold">Stress test: {o.o4.stress.pass ? 'PASS' : 'FAIL'}</span>
          <span className="mt-1 block text-xs leading-snug opacity-90">{o.o4.stress.detail}</span>
        </div>
        {!o.o4.stress.pass && o.o1.verdict !== 'DONT_BORROW' && (
          <p className="mt-2 text-xs text-amber-700">
            The stress test failing means this plan only survives if income holds. A smaller loan or shorter tenure makes it robust.
          </p>
        )}
      </section>


      {/* ---------- confidence + explains ---------- */}
      <section aria-label="Confidence" className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-accent/10">
        <ConfidenceBadge level={o.confidence} why={o.confidenceWhy} />
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-accent">Every number and why (audit trail)</summary>
          <dl className="mt-2 space-y-2">
            {o.explains.map((e, i) => (
              <div key={i} className="rounded-lg bg-paper px-3 py-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                  {e.label}: <span className="font-mono text-sm normal-case text-ink">{e.value}</span>
                </dt>
                <dd className="mt-0.5 text-xs leading-snug text-ink/60">{e.why}</dd>
              </div>
            ))}
          </dl>
        </details>
      </section>

      {/* ---------- actions ---------- */}
      <div className="no-print sticky bottom-3 space-y-2">
        <button
          type="button"
          onClick={onOpenCard}
          className="w-full rounded-lg bg-accent px-4 py-3 font-semibold text-white shadow-lg transition hover:opacity-90"
        >
          Build my Negotiation Card →
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="w-full rounded-lg border border-accent/25 bg-white px-4 py-2.5 text-sm font-medium text-ink/70 transition hover:border-accent hover:text-accent"
        >
          ← Edit answers
        </button>
      </div>
    </div>
  );
}

