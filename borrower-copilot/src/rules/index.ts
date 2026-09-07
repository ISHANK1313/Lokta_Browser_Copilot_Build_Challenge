// index.ts — computeAll(): the single engine entry point. UI imports ONLY this (+ types).
// Wires affordability → rates → verdict → emi per archetecture.md §5.

import type { Answers, Outputs, O2, O2Route, O3, O4, CardData, Explain } from './types';
import {
  routeAfford,
  routeFoirCap,
  stressedSafeEmi,
  sizingYears,
  emiOf,
  type RouteAfford,
} from './affordability';
import { aprBand, fairBand, fairMid, productLabelFor, type FairBandResult } from './rates';
import { decideVerdict } from './verdict';
import { stressDetailText, tenureTable } from './emi';
import { confidence } from './questions';
import { fmtInr, fmtPct, fmtPctBand, fmtRange } from './format';

export { QUESTIONS, MUST_ORDER, nextQuestions, confidence } from './questions';
export type { QId } from './questions';
export * from './format';

function lapEligible(a: Answers): boolean {
  const collateral = a.collateralValue ?? 0;
  const amount = a.amountWanted ?? 0;
  return collateral >= 2 * amount && amount > 0;
}

/**
 * Pure, synchronous (<5ms), no React. Recomputed on every answer change (FR2).
 */
export function computeAll(a: Answers): Outputs {
  // ---------- O3 — fair bands per route (unsecured uses the asked product; LAP uses LAP band)
  const unsecBand = fairBand(a);
  const lapBand = fairBand(a, 'lap');
  const unsecMid = fairMid(unsecBand);
  const lapMid = fairMid(lapBand);

  // ---------- O2 — routes
  const unsec = routeAfford(a, unsecMid, 'unsecured');
  const lap = lapEligible(a) ? routeAfford(a, lapMid, 'lap') : null;
  const routes: O2Route[] = [];
  if (unsec) routes.push(toRoute(unsec, a, unsecMid));
  if (lap) routes.push(toRoute(lap, a, lapMid));

  // recommended route: LAP wins when it gives a materially larger safe number
  const recommended: RouteAfford | null =
    lap && unsec && lap.safeMax > unsec.safeMax ? lap
    : lap && !unsec ? lap
    : unsec;
  const recommendedBand: FairBandResult =
    recommended?.route === 'lap' ? lapBand : unsecBand;
  const recommendedMid = recommended?.route === 'lap' ? lapMid : unsecMid;

  const o2 = buildO2(routes, recommended);

  // ---------- O4 — ceiling + tenure + stress (on the recommended route)
  const o4 = buildO4(a, recommended, recommendedMid);

  // ---------- O3 — display the RECOMMENDED route's band (with route mention if secured)
  const o3 = buildO3(a, recommendedBand, recommended?.safeYears ?? 5, recommended?.route === 'lap');

  // ---------- O1 — verdict
  const conf = confidence(a);
  const newEmiAtSafe =
    recommended != null && recommended.safeMax > 0
      ? emiOf(recommended.safeMax, recommendedMid, recommended.safeYears)
      : null;
  const o1 = decideVerdict({
    a,
    amountWanted: a.amountWanted ?? 0,
    headroomE: recommended ? recommended.lenderEmiRoom : null,
    safeE: recommended ? recommended.safeEmiRoom : null,
    foirCapPct: routeFoirCap(a, recommended?.route ?? 'unsecured'),
    adjInc: recommended ? recommended.adjIncome : null,
    fairLow: recommendedBand.low,
    fairHigh: recommendedBand.high,
    newEmiAtSafe,
    routes,
    expensesAssumed: recommended?.expensesAssumed ?? false,
    unknownEmi: a.existingEmiUnknown,
    scoreUnknown: a.score === 'unknown',
  });

  // ---------- Card
  const card: CardData = {
    fairBand: fmtPctBand(o3.fairLow, o3.fairHigh),
    aprBand: fmtPctBand(o3.aprLow, o3.aprHigh),
    ceiling: o4.ceiling,
    whys: o1.whys.slice(0, 3),
    route: o1.securedRoute ? 'LAP (secured)' : productLabelFor(a.loanType),
  };

  const explains = buildExplains(o1, o2, o3, o4, recommended);

  return {
    o1,
    o2,
    o3,
    o4,
    card,
    confidence: conf.level,
    confidenceWhy: conf.why,
    explains,
  };
}

// ------------------------------------------------------------------ builders

function toRoute(r: RouteAfford, a: Answers, rateMid: number): O2Route {
  const loanLabel = r.route === 'lap' ? 'loan against property' : productLabelFor(a.loanType);
  const tenureLine =
    r.lenderYears === r.safeYears
      ? `over ${r.safeYears} years`
      : `over up to ${r.lenderYears} years; safe sizing uses ${r.safeYears} years${a.productive === false ? ' (consumption loans paid off fast)' : ''}`;
  return {
    route: r.route,
    lenderMax: Math.round(r.lenderMax),
    safeMax: Math.round(r.safeMax),
    useThis: Math.round(r.safeMax),
    why:
      `${loanLabel} at ~${fmtPct(rateMid)} ${tenureLine}. ` +
      `Lender EMI room ${fmtInr(r.lenderEmiRoom)}/mo${a.loanType !== 'business' && r.route !== 'lap' ? ' (capped at 20% of income)' : ''} → ${fmtInr(r.lenderMax)}. ` +
      `Your safe EMI room is ${fmtInr(r.safeEmiRoom)}/mo → ${fmtInr(r.safeMax)}.`,
  };
}

function buildO2(routes: O2Route[], recommended: RouteAfford | null): O2 {
  if (routes.length === 0 || recommended == null) {
    return {
      routes,
      lenderMax: 0,
      safeMax: 0,
      useThis: 0,
      why: 'Answer your income (M4) to unlock affordability.',
      blocked: true,
      blockedWhy: 'No income figure — we refuse to guess (R-UNK-04).',
    };
  }
  const u = routes.find((r) => r.route === 'unsecured');
  const l = routes.find((r) => r.route === 'lap');
  if (u && l) {
    return {
      routes,
      lenderMax: l.lenderMax,
      safeMax: l.safeMax,
      useThis: l.safeMax,
      why:
        `Unsecured lending tops out near ${fmtInr(u.lenderMax)} (safe ${fmtInr(u.safeMax)}); ` +
        `pledging collateral lifts you to ${fmtInr(l.lenderMax)} (safe ${fmtInr(l.safeMax)}) at a lower rate. ` +
        `Use the safe number, not the sanction letter.`,
      blocked: false,
    };
  }
  const rec = routes.find((r) => r.route === recommended.route) ?? routes[0];
  const expNote = recommended.expensesAssumed ? ' We assumed expenses at 40% of income, so the safe number is widened ±20%.' : '';
  return {
    routes,
    lenderMax: rec.lenderMax,
    safeMax: rec.safeMax,
    useThis: rec.safeMax,
    why:
      `A lender's FOIR math plus the 20%-of-income EMI cap points to a sanction near ${fmtInr(rec.lenderMax)}; ` +
      `what you can safely carry after expenses and shocks is ${fmtInr(rec.safeMax)}. Use the safe number.${expNote}`,
    blocked: false,
  };
}

function buildO3(a: Answers, band: FairBandResult, years: number, isLap: boolean): O3 {
  const fee = a.offerFeePct != null ? a.offerFeePct : feeFor(isLap ? 'lap' : a.loanType);
  const [aprLow, aprHigh] = aprBand(band.low, band.high, fee, Math.max(1, years));
  const aprAdd = Math.round((aprLow - band.low) * 10) / 10;
  return {
    fairLow: band.low,
    fairHigh: band.high,
    aprLow: Math.round(aprLow * 10) / 10,
    aprHigh: Math.round(aprHigh * 10) / 10,
    why:
      `Fair band is ${fmtPctBand(band.low, band.high)}${band.addOns.length ? ` — ${band.addOns.join('; ')}` : ''}. ` +
      `APR adds ~${aprAdd}pp for a ${fee}% processing fee over ${years} years — the all-in cost, RBI-style.`,
    addOns: band.addOns,
    widened: band.widened,
  };
}

function feeFor(loanType: string | null): number {
  switch (loanType) {
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

function buildO4(a: Answers, rec: RouteAfford | null, mid: number): O4 {
  if (rec == null) {
    return {
      ceiling: 0,
      why: 'Answer your income (M4) to compute a ceiling.',
      tenureTable: [],
      stress: {
        desc: 'Income drops 20% (or rate rises 2pp)',
        pass: false,
        detail: 'Cannot run the stress test without income figures.',
      },
    };
  }
  const ceiling = Math.max(0, Math.floor(rec.useThisEmi / 500) * 500);
  const committedEmi = ceiling;
  const stressed = stressedSafeEmi(a, rec.route);
  const safeMaxLoan = rec.safeMax;
  const pass =
    ceiling > 0 &&
    safeMaxLoan > 0 &&
    stressed != null &&
    stressed >= committedEmi;
  const years = rec.safeYears;

  const detail = stressDetailText({
    ceiling,
    committedEmi,
    stressed,
    rateStressed: mid + 2,
    emiAtFair: emiOf(safeMaxLoan, mid, years),
    emiAtStressedRate: emiOf(safeMaxLoan, mid + 2, years),
    pass,
  });

  const binding =
    rec.useThisEmi === rec.lenderEmiRoom
      ? 'your policy-level EMI cap (20% of income)'
      : 'your safe surplus after expenses';
  const tenureRows = tenureTable(safeMaxLoan, mid, Math.min(5, years));
  return {
    ceiling,
    why:
      `Do not cross ${fmtInr(ceiling)}/mo. It is set by ${binding}: ` +
      `${fmtInr(rec.useThisEmi)}/mo of room after EMIs and expenses leaves your shock buffer intact — rounded down to ₹500.`,
    tenureTable: tenureRows,
    stress: {
      desc: 'Income drops 20% (or rate rises 2pp)',
      pass,
      detail,
    },
  };
}

function buildExplains(
  o1: Outputs['o1'],
  o2: O2,
  o3: O3,
  o4: O4,
  rec: RouteAfford | null,
): Explain[] {
  const ex: Explain[] = [];
  ex.push({ label: 'Verdict', value: o1.verdict.replace('_', ' '), why: o1.reason });
  if (!o2.blocked) {
    ex.push({
      label: 'Lender-likely max',
      value: fmtInr(o2.lenderMax),
      why: 'Sized on the EMI a lender will allow (FOIR cap + product EMI cap) over the longest tenure.',
    });
    ex.push({
      label: 'Safe max',
      value: fmtInr(o2.safeMax),
      why: 'Sized on your surplus EMI (0.85× what remains after expenses) over the disciplined tenure.',
    });
  }
  ex.push({
    label: 'Fair rate band',
    value: fmtPctBand(o3.fairLow, o3.fairHigh),
    why: o3.addOns.length ? o3.addOns.join('; ') : 'Base band for your product and income type.',
  });
  ex.push({
    label: 'All-in APR',
    value: fmtPctBand(o3.aprLow, o3.aprHigh),
    why: 'Processing fee amortised over tenure. Approximation — ignores GST/insurance.',
  });
  ex.push({
    label: 'EMI ceiling',
    value: fmtInr(o4.ceiling),
    why:
      rec != null
        ? `min(FOIR room ${fmtInr(rec.lenderEmiRoom)}, safe surplus, 20% income cap) rounded down to ₹500.`
        : 'Needs income.',
  });
  return ex;
}

export { emiOf, sizingYears, tenureTable, fmtRange };
