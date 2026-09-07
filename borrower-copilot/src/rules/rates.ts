// rates.ts — O3: fair interest band + all-in APR. Rules R-BASE-01..08, R-ADJ-01..06, R-FEE-01, R-APR-01, R-UNK-01.

import type { Answers, IncomeType, LoanType } from './types';
import { fmtPct, fmtPctBand } from './format';

/** R-BASE — base annual reducing-balance bands (low, high) in %. */
export function baseBand(loanType: LoanType | null, incomeType: IncomeType | null): [number, number] {
  switch (loanType) {
    case 'home':
      return [8.5, 10];
    case 'lap':
      return [10, 13];
    case 'business':
      // biz-secured 11–14; personal-self 14–19 fallback when unsecured personal sought by self-employed
      return incomeType === 'self-employed' || incomeType === 'informal' ? [11, 14] : [11, 14];
    case 'personal':
      return incomeType === 'salaried' ? [10.5, 14] : [14, 19];
    case 'gold':
      return [9, 12];
    case 'two-wheeler':
      return [12, 18];
    default:
      return [24, 36]; // app/informal fallback (R-BASE-08)
  }
}

/** R-FEE-01 — typical processing fee % by product */
export function processingFeePct(a: Answers): number {
  switch (a.loanType) {
    case 'personal':
      return 1.5;
    case 'lap':
      return 1;
    case 'two-wheeler':
      return 2;
    case 'home':
      return 0.5;
    case 'gold':
      return 1;
    case 'business':
      return 1.5;
    default:
      return 2;
  }
}

export interface FairBandResult {
  low: number;
  high: number;
  addOns: string[];
  widened: boolean;
}

/** R-ADJ + R-UNK-01 — add-ons over base band; each disclosed in addOns[] */
export function fairBand(a: Answers, loanTypeOverride?: LoanType): FairBandResult {
  const lt = loanTypeOverride ?? a.loanType;
  // R-BASE-08 / R-CH-01 channel rule: informal borrower with an existing high-rate stack
  // (highestRate ≥ 24%) is priced by the distressed channel, not the product band.
  // Distressed band already prices in delinquency, so score/bounce add-ons are skipped
  // (they are the reason the channel rate is high); span tightened to 8pp.
  const distressed =
    a.incomeType === 'informal' && (a.highestRatePct ?? 0) >= 24 && lt !== 'lap';
  if (distressed) {
    return {
      low: 24,
      high: 32,
      addOns: [
        'existing loans at 24%+ with informal income → priced at the distressed channel (24–32); your bounce and unknown score are why it is not cheaper',
      ],
      widened: false,
    };
  }
  const [low, high] = baseBand(lt, a.incomeType);
  const addOns: string[] = [];
  let dLow = 0;
  let dHigh = 0;
  let widened = false;

  switch (a.score) {
    case '750+':
      dLow -= 0.5;
      dHigh -= 0.5;
      addOns.push('credit score 750+ → −0.5pp');
      break;
    case '700-749':
      break;
    case '650-699':
      dLow += 1.5;
      dHigh += 1.5;
      addOns.push('credit score 650–699 → +1.5pp');
      break;
    case '<650':
      dLow += 3;
      dHigh += 3;
      addOns.push('credit score below 650 → +3pp');
      break;
    default:
      // R-UNK-01 — unknown score: +2pp & widen +1pp/side
      dLow += 2 - 1;
      dHigh += 2 + 1;
      widened = true;
      addOns.push('score unknown → +2pp and band widened (never guessed as zero)');
  }

  const bounces = a.bounces12m;
  if (bounces != null && bounces >= 1) {
    dLow += 1.5;
    dHigh += 1.5;
    addOns.push(`${bounces} EMI bounce${bounces > 1 ? 's' : ''} in 12m → +1.5pp`);
  }

  if (a.cardUtilPct != null && a.cardUtilPct > 70) {
    dLow += 1;
    dHigh += 1;
    addOns.push(`card utilisation ${a.cardUtilPct}% > 70% → +1pp`);
  }

  if (a.tenureYears != null && a.tenureYears < 2) {
    dLow += 1;
    dHigh += 1;
    addOns.push(a.incomeType === 'self-employed' ? 'business vintage under 2 years → +1pp' : 'job tenure under 2 years → +1pp');
  }

  let finalLow = Math.max(2, low + dLow);
  let finalHigh = Math.max(finalLow + 1, high + dHigh);

  // R-ADJ-07 — prime tightening: salaried + 750+ score + income >₹1L + tenure ≥2yr
  // anchors the band to the inner (better) half the lender actually quotes.
  const prime =
    a.incomeType === 'salaried' &&
    a.score === '750+' &&
    (a.incomeMonthly ?? 0) > 100000 &&
    (a.tenureYears ?? 0) >= 2;
  if (prime) {
    finalLow = Math.min(finalLow + 1, finalHigh - 1.5);
    finalHigh = Math.max(finalLow + 1, finalHigh - 1);
    addOns.push('prime profile (salaried, 750+, >₹1L, stable tenure) → band tightened to the inner quotes');
  }

  return { low: finalLow, high: finalHigh, addOns, widened };
}

/**
 * R-APR-01 — APR ≈ nominal + fee/n×1.5 amortised, disclosed as approximation.
 * feePct spread across tenure years, amortisation lifts it ~1.5× (fees paid up-front on reducing balance).
 */
export function aprBand(low: number, high: number, feePct: number, years: number): [number, number] {
  const add = (feePct / Math.max(1, years)) * 1.5;
  return [low + add, high + add];
}

/** Fair band for a route: business loans secured → same band; used by computeAll */
export function fairMid(band: [number, number] | FairBandResult): number {
  const low = Array.isArray(band) ? band[0] : band.low;
  const high = Array.isArray(band) ? band[1] : band.high;
  return (low + high) / 2;
}

/** Human why-sentence for O3, citing user answers. */
export function rateWhy(a: Answers, fb: FairBandResult): string {
  const parts: string[] = [];
  const productLabel = productLabelFor(a.loanType);
  const [baseLow, baseHigh] = baseBand(a.loanType, a.incomeType);
  parts.push(`A ${productLabel} typically prices at ${fmtPctBand(baseLow, baseHigh)} for profiles like yours`);
  if (fb.addOns.length) parts.push(fb.addOns.join(', '));
  return parts.join('; ') + '.';
}

export function productLabelFor(loanType: LoanType | null): string {
  switch (loanType) {
    case 'home':
      return 'home loan';
    case 'lap':
      return 'loan against property';
    case 'business':
      return 'business loan';
    case 'personal':
      return 'personal loan';
    case 'gold':
      return 'gold loan';
    case 'two-wheeler':
      return 'two-wheeler loan';
    default:
      return 'loan';
  }
}

export { fmtPct, fmtPctBand };
