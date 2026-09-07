// Canonical persona fixtures — PRD §3. Used by PersonaButtons + tests.
// These are the three borrowers Lokta judges will run through the app.

import type { Answers } from '../types';
import { emptyAnswers } from '../types';

/** P1 — Priya, 29, Bengaluru, salaried. Wants ₹8L personal for wedding. */
export const PRIYA: Answers = {
  ...emptyAnswers,
  purpose: 'wedding',
  productive: false,
  amountWanted: 800000,
  loanType: 'personal',
  incomeMonthly: 110000,
  incomeUnknown: false,
  incomeType: 'salaried',
  existingEmi: 14000,
  existingEmiUnknown: false,
  expensesMonthly: 45000, // rent 28k + ~17k living
  expensesUnknown: false,
  age: 29,
  score: '750+',
  // ADDITIONAL
  tenureYears: 5, // A1 job years
  variableSharePct: 0, // A2 fixed salary
  loanCount: 1, // A3
  highestRatePct: 9.5, // car loan
  cardUtilPct: 30, // A4
  bounces12m: 0, // A5
  savingsMonths: 4, // A6
  collateralValue: null, // A7 not asked (amount >5L? 8L > 5L so asked; she has none)
  coIncome: null, // A8 unmarried
  upcomingExpense: 0, // A9
  extraIncomeFromLoan: null, // A10 non-productive
  offerRatePct: 14, // A11 lender quote to compare
  offerFeePct: 1.5,
};

/** P2 — Ravi, 42, Mysuru, self-employed kirana. Wants ₹15L for stock+vehicle. */
export const RAVI: Answers = {
  ...emptyAnswers,
  purpose: 'stock-vehicle',
  productive: true,
  amountWanted: 1500000,
  loanType: 'business',
  incomeMonthly: 60000, // stated avg of 40–80k
  incomeRangeLow: 40000,
  incomeRangeHigh: 80000,
  incomeUnknown: false,
  incomeType: 'self-employed',
  existingEmi: 0,
  existingEmiUnknown: false,
  expensesMonthly: 30000, // household + shop upkeep
  expensesUnknown: false,
  age: 42,
  score: 'unknown', // never taken a formal loan
  // ADDITIONAL
  tenureYears: 14, // business vintage
  variableSharePct: 40, // cash share varies
  itrAnnual: 420000, // ITR on record → R-INC-02
  loanCount: 0,
  highestRatePct: null,
  cardUtilPct: null, // skipped — no credit history
  bounces12m: 0,
  savingsMonths: 3,
  collateralValue: 4500000, // shop premises unencumbered
  coIncome: 18000, // wife, teacher
  upcomingExpense: 0,
  extraIncomeFromLoan: 20000, // stock line + vehicle add ~₹20k/mo margin
  offerRatePct: 17,
  offerFeePct: 2,
};

/** P3 — Anita, 35, Hubballi, informal. Wants ₹1.5L e-scooter. */
export const ANITA: Answers = {
  ...emptyAnswers,
  purpose: 'scooter',
  productive: true,
  amountWanted: 150000,
  loanType: 'two-wheeler',
  incomeMonthly: 28000, // mid of 26–30k
  incomeRangeLow: 26000,
  incomeRangeHigh: 30000,
  incomeUnknown: false,
  incomeType: 'informal',
  existingEmi: 6000, // 3 app loans, ₹35k outstanding
  existingEmiUnknown: false,
  expensesMonthly: 22000,
  expensesUnknown: false,
  age: 35,
  score: 'unknown', // don't know + bounced
  // ADDITIONAL
  tenureYears: 2, // delivery rider ~2 years
  variableSharePct: 30,
  loanCount: 3,
  highestRatePct: 30, // app loans at 30%+
  cardUtilPct: null,
  bounces12m: 1,
  savingsMonths: 0,
  collateralValue: null,
  coIncome: 0, // husband unemployed
  upcomingExpense: 10000, // school fees etc next 6m
  extraIncomeFromLoan: 8000, // claims scooter doubles runs → +₹8k/mo
  offerRatePct: 28,
  offerFeePct: 2,
};
