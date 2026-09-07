// fields.ts — mapping between question ids and Answers fields. Pure helpers, no React.
// Keeps QuestionCard dumb: read value → render → commit patch.

import type { Answers, LoanType, Purpose, ScoreBucket } from '../types';
import type { QId } from '../rules/questions';

/** Current string value of a question's primary field (for controlled inputs). */
export function readValue(a: Answers, id: QId): string {
  switch (id) {
    case 'M2':
      return a.amountWanted?.toString() ?? '';
    case 'M4':
      return a.incomeMonthly?.toString() ?? '';
    case 'M6':
      return a.existingEmi?.toString() ?? '';
    case 'M7':
      return a.expensesMonthly?.toString() ?? '';
    case 'M8':
      return a.age?.toString() ?? '';
    case 'A1':
      return a.tenureYears?.toString() ?? '';
    case 'A2':
      return a.variableSharePct?.toString() ?? '';
    case 'A4':
      return a.cardUtilPct?.toString() ?? '';
    case 'A5':
      return a.bounces12m?.toString() ?? '';
    case 'A6':
      return a.savingsMonths?.toString() ?? '';
    case 'A7':
      return a.collateralValue?.toString() ?? '';
    case 'A8':
      return a.coIncome?.toString() ?? '';
    case 'A9':
      return a.upcomingExpense?.toString() ?? '';
    case 'A10':
      return a.extraIncomeFromLoan?.toString() ?? '';
    case 'M1':
      return a.purpose ?? '';
    case 'M3':
      return a.loanType ?? '';
    case 'M5':
      return a.incomeType ?? '';
    case 'M9':
      return a.score ?? '';
    case 'A3':
      return a.loanCount?.toString() ?? '';
    case 'A11':
      return a.offerRatePct?.toString() ?? '';
    default:
      return '';
  }
}

const PRODUCTIVE_BY_PURPOSE: Record<Purpose, boolean> = {
  wedding: false,
  other: false,
  'stock-vehicle': true,
  scooter: true,
  home: true,
};

/** Patch produced when the user answers a question with `value` (numbers parsed by caller). */
export function patchFor(id: QId, value: string): Partial<Answers> {
  const num = value.trim() === '' ? null : Number(value);
  switch (id) {
    case 'M1': {
      const purpose = value as Purpose;
      return { purpose, productive: PRODUCTIVE_BY_PURPOSE[purpose] ?? false };
    }
    case 'M2':
      return { amountWanted: num };
    case 'M3':
      return { loanType: value as LoanType };
    case 'M4':
      return { incomeMonthly: num, incomeUnknown: false };
    case 'M5':
      return { incomeType: value as Answers['incomeType'] };
    case 'M6':
      return { existingEmi: num, existingEmiUnknown: false };
    case 'M7':
      return { expensesMonthly: num, expensesUnknown: false };
    case 'M8':
      return { age: num };
    case 'M9':
      return { score: value as ScoreBucket };
    case 'A1':
      return { tenureYears: num };
    case 'A2':
      return { variableSharePct: num };
    case 'A4':
      return { cardUtilPct: num };
    case 'A5':
      return { bounces12m: num };
    case 'A6':
      return { savingsMonths: num };
    case 'A7':
      return { collateralValue: num };
    case 'A8':
      return { coIncome: num };
    case 'A9':
      return { upcomingExpense: num };
    case 'A10':
      return { extraIncomeFromLoan: num };
    case 'A11':
      return { offerRatePct: num };
    default:
      return {};
  }
}

/** Composite second-field patches (A3 detail, A11 fee). */
export function patchForSecondary(id: QId, value: string): Partial<Answers> {
  const num = value.trim() === '' ? null : Number(value);
  switch (id) {
    case 'A3':
      return { highestRatePct: num };
    case 'A11':
      return { offerFeePct: num };
    default:
      return {};
  }
}

export function readSecondary(a: Answers, id: QId): string {
  switch (id) {
    case 'A3':
      return a.highestRatePct?.toString() ?? '';
    case 'A11':
      return a.offerFeePct?.toString() ?? '';
    default:
      return '';
  }
}

export function secondaryLabel(id: QId): string | null {
  switch (id) {
    case 'A3':
      return 'Highest interest rate you pay on any of them (%)';
    case 'A11':
      return 'Processing fee quoted (%)';
    default:
      return null;
  }
}

/** "I don't know" semantics per question — never zero unless zero IS the honest answer. */
export function unknownPatch(id: QId): { patch: Partial<Answers>; label: string } | null {
  switch (id) {
    case 'M4':
      return { patch: { incomeMonthly: null, incomeUnknown: true }, label: "I don't know / varies too much" };
    case 'M6':
      return { patch: { existingEmi: null, existingEmiUnknown: true }, label: "I don't know exactly" };
    case 'M7':
      return { patch: { expensesMonthly: null, expensesUnknown: true }, label: "I don't know exactly" };
    case 'A4':
      return { patch: { cardUtilPct: 0 }, label: 'No credit card' };
    case 'A8':
      return { patch: { coIncome: 0 }, label: 'No co-applicant' };
    case 'A10':
      return { patch: { extraIncomeFromLoan: 0 }, label: "It won't earn anything" };
    default:
      return null;
  }
}
