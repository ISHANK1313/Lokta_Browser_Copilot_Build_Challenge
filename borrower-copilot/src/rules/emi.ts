// emi.ts — O4 helpers: tenure trade-off table + stress detail wording.
// Rules R-C-01/02, R-S-01. All sizing logic lives in affordability.ts.

import { emiOf } from './affordability';
import { fmtInr, fmtPct } from './format';
import type { TenureRow } from './types';

/** R-C-02 — EMI table for a loan across 2/3/5-year tenures (≤ max tenure). */
export function tenureTable(loan: number, ratePct: number, maxYears: number): TenureRow[] {
  const wanted = [2, 3, 5].filter((y) => y <= maxYears);
  const years = wanted.length ? wanted : [Math.max(1, maxYears)];
  return years.map((y) => ({
    years: y,
    emi: Math.round(emiOf(loan, ratePct, y)),
    totalInterest: Math.round(emiOf(loan, ratePct, y) * y * 12 - loan),
  }));
}

export interface StressInput {
  ceiling: number;
  committedEmi: number;
  stressed: number | null;
  rateStressed: number;
  emiAtFair: number;
  emiAtStressedRate: number;
  pass: boolean;
}

/**
 * R-S-01 wording: income −20% cuts safe surplus room; rate +2pp raises the EMI.
 * PASS only if the stressed surplus still covers the committed EMI.
 */
export function stressDetailText(s: StressInput): string {
  if (s.stressed == null) {
    return 'Cannot run the stress test — income figures are missing.';
  }
  const incomePart = `If income drops 20%, your safe EMI room falls to ${fmtInr(Math.max(0, s.stressed))}/mo`;
  const ratePart = `at rate +2pp (${fmtPct(s.rateStressed)}) the same loan costs ${fmtInr(Math.round(s.emiAtStressedRate))}/mo instead of ${fmtInr(Math.round(s.emiAtFair))}/mo`;
  if (s.pass) {
    return `${incomePart}; ${ratePart} — both stay above your committed ${fmtInr(s.committedEmi)}/mo. PASS.`;
  }
  return `${incomePart}; ${ratePart} — one of these breaks the room you have. FAIL — borrow less, extend savings, or drop the plan until income is safer.`;
}
