// affordability.ts — O2 engine: LenderLikelyMax (lender FOIR + product EMI cap) vs
// SafeMax (surplus + 20% policy cap + tenure discipline). Rules R-UNK, R-INC-01..05,
// R-FOIR-01..03, R-PL-20, R-SAFE-01..02, R-TEN-01..02, R-LTV-01. rules.md wins on conflict.

import type { Answers } from './types';

export type Route = 'unsecured' | 'lap';

/** R-TEN-01 — product tenure max (years) */
export function productMaxTenure(loanType: string): number {
  switch (loanType) {
    case 'lap':
      return 15;
    case 'two-wheeler':
      return 4;
    case 'home':
      return 30;
    case 'personal':
      return 5;
    case 'business':
      return 10;
    case 'gold':
      return 3;
    default:
      return 5;
  }
}

/** R-TEN-01 — effective tenure cap: min(retirement-age room, product max) */
export function tenureCap(a: Answers): number {
  const product = productMaxTenure(a.loanType ?? 'personal');
  if (a.age == null) return product;
  const retirementRoom = a.incomeType === 'salaried' ? 60 - a.age : 65 - a.age;
  return Math.max(1, Math.min(product, retirementRoom));
}

/**
 * Tenure used for sizing one route.
 * - LAP: min(cap, 15).
 * - Unsecured business (working capital): ≤3y — market norm for unsecured WC lines.
 * - Safe sizing of NON-productive (consumption) loans: ≤3y — pay a wedding off fast.
 * - Otherwise: product tenure cap.
 */
export function sizingYears(a: Answers, route: Route, forSafe: boolean): number {
  const cap = tenureCap(a);
  let years: number;
  if (route === 'lap') {
    years = Math.min(cap, 15);
  } else if (a.loanType === 'business') {
    years = Math.min(cap, 3); // unsecured business lines are short
  } else {
    years = cap;
  }
  if (forSafe && a.productive === false) years = Math.min(years, 3); // R-TEN-02 consumption discipline
  return years;
}

/**
 * R-INC-03 — safe-side base income.
 * If a range was given AND the variable share (A2) is unanswered, fall to the lower
 * 40th percentile (range is all we know about volatility).
 * If A2 is answered, the variable haircut (R-INC-01) already carries the volatility
 * signal, so start from the midpoint/stated figure (don't double-punish).
 */
export function baseIncome(a: Answers): number | null {
  if (a.incomeUnknown || a.incomeMonthly == null) return null;
  const low = a.incomeRangeLow;
  const high = a.incomeRangeHigh;
  if (low != null && high != null && high > low && a.variableSharePct == null) {
    const mid = (low + high) / 2;
    return low + 0.4 * (mid - low);
  }
  return a.incomeMonthly;
}

/**
 * Route-aware adjusted income.
 * Unsecured route (R-INC-02): self-employed base = min(statedAvg, ITR/12 × 1.2) — a lender
 *   with no collateral trusts documented income. Co-applicant counts 50% (R-INC-04).
 * LAP route (R-INC-05): collateral + co-signer change the risk — ITR-min relaxes
 *   (the shop can be sold), co-applicant counts 100% (they co-sign the pledge).
 * Variable haircut R-INC-01 applies on both routes.
 */
export function routeAdjIncome(a: Answers, route: Route): number | null {
  let base = baseIncome(a);
  if (base == null) return null;
  if (route === 'unsecured' && a.incomeType === 'self-employed' && a.itrAnnual != null && a.itrAnnual > 0) {
    base = Math.min(base, (a.itrAnnual / 12) * 1.2);
  }
  const vs = a.variableSharePct;
  const adj = vs != null ? base * (1 - 0.5 * (vs / 100)) : base;
  const co = a.coIncome ?? 0;
  return route === 'lap' ? adj + co : adj + 0.5 * co;
}

/** R-FOIR-01/02 — lender FOIR cap: 45/40/35, +5pp if income>₹1L AND score 750+ */
export function foirCap(a: Answers): number {
  const it = a.incomeType;
  let cap = it === 'salaried' ? 0.45 : it === 'self-employed' ? 0.4 : 0.35;
  const base = effectiveBaseIncomeForCap(a);
  if (base != null && base > 100000 && a.score === '750+') cap += 0.05;
  return cap;
}

function effectiveBaseIncomeForCap(a: Answers): number | null {
  return baseIncome(a);
}

/** R-FOIR-SEC — secured routes (LAP with co-signed property) get +10pp, capped at 55% */
export function routeFoirCap(a: Answers, route: Route): number {
  const base = foirCap(a);
  return route === 'lap' ? Math.min(base + 0.1, 0.55) : base;
}

/** R-UNK-02 — unknown expenses default to 40% of adj income, flagged */
export function effectiveExpenses(a: Answers, route: Route): { value: number; assumed: boolean } {
  if (a.expensesMonthly != null && !a.expensesUnknown) {
    return { value: a.expensesMonthly, assumed: false };
  }
  const adj = routeAdjIncome(a, route);
  return { value: adj != null ? 0.4 * adj : 0, assumed: true };
}

export function existingEmiSafe(a: Answers): number {
  return a.existingEmiUnknown || a.existingEmi == null ? 0 : a.existingEmi;
}

/** R-FOIR-03 — lender headroom EMI on this route */
export function routeHeadroom(a: Answers, route: Route): number | null {
  const adj = routeAdjIncome(a, route);
  if (adj == null) return null;
  return routeFoirCap(a, route) * adj - existingEmiSafe(a);
}

/** R-SAFE-01 — safe surplus EMI on this route, floor 0 */
export function routeSafeEmi(a: Answers, route: Route): number | null {
  const adj = routeAdjIncome(a, route);
  if (adj == null) return null;
  const exp = effectiveExpenses(a, route).value;
  const upcoming = a.upcomingExpense ?? 0;
  return Math.max(0, 0.85 * (adj - exp - existingEmiSafe(a) - upcoming / 12));
}

/**
 * R-PL-20 — the 20%-of-income EMI policy cap. Applies to unsecured consumer products
 * (personal, two-wheeler, gold): lenders cap PL-style EMIs near 20% of net income
 * because delinquency clusters above it. Does NOT apply to secured/business routes.
 */
export function policyEmiCap(a: Answers, route: Route): number | null {
  if (route === 'lap' || a.loanType === 'business' || a.loanType === 'home' || a.loanType === 'lap') {
    return null; // no policy cap
  }
  const adj = routeAdjIncome(a, route);
  if (adj == null) return null;
  return 0.2 * adj;
}

/** EMI = P×r×(1+r)^n / ((1+r)^n −1); r=0 => P/n */
export function emiOf(principal: number, annualRatePct: number, years: number): number {
  const n = Math.max(1, Math.round(years * 12));
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / n;
  const f = Math.pow(1 + r, n);
  return (principal * r * f) / (f - 1);
}

/** maxLoan = EMI × ((1+r)^n −1)/(r(1+r)^n) */
export function maxLoanFromEmi(emi: number, annualRatePct: number, years: number): number {
  const n = Math.max(1, Math.round(years * 12));
  const r = annualRatePct / 12 / 100;
  if (r === 0) return emi * n;
  const f = Math.pow(1 + r, n);
  return (emi * (f - 1)) / (r * f);
}

/** R-LTV-01 — 60% LTV on collateral for LAP routes, conservative */
export function ltvMax(collateralValue: number | null | undefined): number | null {
  if (collateralValue == null || collateralValue <= 0) return null;
  return 0.6 * collateralValue;
}

export function round500(v: number): number {
  return Math.max(0, Math.floor(v / 500) * 500);
}

export interface RouteAfford {
  route: Route;
  adjIncome: number;
  lenderEmiRoom: number;
  safeEmiRoom: number;
  useThisEmi: number;
  lenderMax: number;
  safeMax: number;
  expensesAssumed: boolean;
  lenderYears: number;
  safeYears: number;
}

/**
 * Route affordability.
 * LenderMax = loan sized on min(FOIR headroom, product policy cap) over the FULL product tenure
 *             — what the sanction letter will say.
 * SafeMax   = loan sized on min(FOIR headroom, safe surplus EMI, policy cap) over the SAFE tenure
 *             — what the borrower can carry with shock buffer left over.
 * LAP additionally capped at 60% LTV (R-LTV-01). Safe widened ±20% when expenses assumed (R-UNK-02).
 */
export function routeAfford(a: Answers, rateMidPct: number, route: Route): RouteAfford | null {
  const adj = routeAdjIncome(a, route);
  const hr = routeHeadroom(a, route);
  const se = routeSafeEmi(a, route);
  if (adj == null || hr == null || se == null) return null;

  const cap = policyEmiCap(a, route);
  const lenderEmiRoom = cap != null ? Math.min(hr, cap) : hr;
  const safeEmiRoom = Math.max(0, Math.min(lenderEmiRoom, se));

  const lenderYears = sizingYears(a, route, false);
  const safeYears = sizingYears(a, route, true);

  const ltv = route === 'lap' ? ltvMax(a.collateralValue) : null;
  const lenderRaw = maxLoanFromEmi(Math.max(0, lenderEmiRoom), rateMidPct, lenderYears);
  const safeRaw = maxLoanFromEmi(safeEmiRoom, rateMidPct, safeYears);
  const expensesAssumed = effectiveExpenses(a, route).assumed;
  const widen = expensesAssumed ? (v: number) => v * 1.2 : (v: number) => v;

  return {
    route,
    adjIncome: adj,
    lenderEmiRoom: Math.max(0, lenderEmiRoom),
    safeEmiRoom,
    useThisEmi: safeEmiRoom,
    lenderMax: ltv != null ? Math.min(lenderRaw, ltv) : lenderRaw,
    safeMax: widen(ltv != null ? Math.min(safeRaw, ltv) : safeRaw),
    expensesAssumed,
    lenderYears,
    safeYears,
  };
}

/** Stressed surplus EMI (income −20%, expenses/EMIs fixed) — R-S-01. */
export function stressedSafeEmi(a: Answers, route: Route): number | null {
  const adj = routeAdjIncome(a, route);
  if (adj == null) return null;
  const exp = effectiveExpenses(a, route).value;
  const upcoming = a.upcomingExpense ?? 0;
  return Math.max(0, 0.85 * (adj * 0.8 - exp - existingEmiSafe(a) - upcoming / 12));
}
