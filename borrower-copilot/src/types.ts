// Canonical types — mirrors archetecture.md §4. Single source of truth.
// src/rules/* may import this file but NEVER from components/ or *.tsx.

export type IncomeType = 'salaried' | 'self-employed' | 'informal';
export type ScoreBucket = '750+' | '700-749' | '650-699' | '<650' | 'unknown';
export type Verdict = 'BORROW' | 'BORROW_LESS' | 'DONT_BORROW';
export type Confidence = 'Low' | 'Medium' | 'High';

export type LoanType =
  | 'personal'
  | 'business'
  | 'lap'
  | 'gold'
  | 'two-wheeler'
  | 'home';

export type Purpose =
  | 'wedding'
  | 'stock-vehicle'
  | 'scooter'
  | 'home'
  | 'other';

/** Answers collected from the wizard. MUST fields M1–M9; ADDITIONAL A1–A11 nullable = unasked/unanswered. */
export interface Answers {
  // M1 — purpose + auto productive tag
  purpose: Purpose | null;
  productive: boolean | null;
  // M2
  amountWanted: number | null;
  // M3
  loanType: LoanType | null;
  // M4 — income; null or incomeUnknown => unknown (R-UNK-04)
  incomeMonthly: number | null;
  incomeUnknown: boolean;
  // A2 companion for Ravi-type range income: store stated range width
  incomeRangeLow?: number | null;
  incomeRangeHigh?: number | null;
  // A2 companion: declared annual income on record (ITR), for self-employed
  itrAnnual?: number | null;
  // M5
  incomeType: IncomeType | null;
  // M6 — existing EMIs; null+unknown flag => unknown (R-UNK-03)
  existingEmi: number | null;
  existingEmiUnknown: boolean;
  // M7 — household expenses incl rent; null+unknown flag => default 40% (R-UNK-02)
  expensesMonthly: number | null;
  expensesUnknown: boolean;
  // M8
  age: number | null;
  // M9
  score: ScoreBucket | null;

  // ADDITIONAL A1–A11 (all nullable = unasked/unanswered)
  tenureYears?: number | null; // A1 job/business vintage years
  variableSharePct?: number | null; // A2
  loanCount?: number | null; // A3
  highestRatePct?: number | null; // A3
  cardUtilPct?: number | null; // A4
  bounces12m?: number | null; // A5
  savingsMonths?: number | null; // A6
  collateralValue?: number | null; // A7
  coIncome?: number | null; // A8
  upcomingExpense?: number | null; // A9 (total ₹ over next 6 months)
  extraIncomeFromLoan?: number | null; // A10 ₹/mo
  offerRatePct?: number | null; // A11
  offerFeePct?: number | null; // A11

  // Flags that an ADDITIONAL question was explicitly answered "don't know"
  scoreUnknownChosen?: boolean;
}

export interface Explain {
  label: string; // e.g. "Fair rate band", "EMI ceiling"
  value: string; // human readable value
  why: string; // one sentence traceable to answers
}

export interface O1 {
  verdict: Verdict;
  reason: string; // 1 sentence
  whys: string[]; // 2–3 bullets
  securedRoute?: boolean; // R-V-08: recommended secured (LAP) route
}

export interface O2Route {
  route: 'unsecured' | 'lap';
  lenderMax: number;
  safeMax: number;
  useThis: number;
  why: string;
}

export interface O2 {
  routes: O2Route[]; // 1 or 2 routes (unsecured always; lap when collateral unlocks)
  lenderMax: number; // recommended route's lenderMax (primary display)
  safeMax: number; // recommended route's safeMax
  useThis: number; // SafeMax
  why: string;
  blocked?: boolean; // R-UNK-04: income unknown -> cannot compute
  blockedWhy?: string;
}

export interface O3 {
  fairLow: number;
  fairHigh: number;
  aprLow: number;
  aprHigh: number;
  why: string;
  addOns: string[]; // human-readable list of add-on adjustments applied
  widened?: boolean; // unknown-score widening disclosure
}

export interface TenureRow {
  years: number;
  emi: number;
  totalInterest?: number;
}

export interface O4 {
  ceiling: number; // ₹/mo do-not-cross (R-C-01)
  why: string;
  tenureTable: TenureRow[]; // 2/3/5yr (or product max) EMI for safeMax at fairMid
  stress: {
    desc: string;
    pass: boolean;
    detail: string;
  };
}

export interface CardData {
  fairBand: string; // "11–12.5%"
  aprBand: string;
  ceiling: number;
  whys: string[];
  route: string; // e.g. "Unsecured personal" | "LAP (secured)"
}

export interface Outputs {
  o1: O1;
  o2: O2;
  o3: O3;
  o4: O4;
  card: CardData;
  confidence: Confidence;
  confidenceWhy: string;
  explains: Explain[];
}

export const emptyAnswers: Answers = {
  purpose: null,
  productive: null,
  amountWanted: null,
  loanType: null,
  incomeMonthly: null,
  incomeUnknown: false,
  incomeType: null,
  existingEmi: null,
  existingEmiUnknown: false,
  expensesMonthly: null,
  expensesUnknown: false,
  age: null,
  score: null,
};
