// questions.ts — Question catalogue M1–M9 + A1–A11, adaptive skip (PRD §5.3), confidence model (PRD §5.4).

import type { Answers, Confidence } from './types';

export type QId = 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6' | 'M7' | 'M8' | 'M9' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'A7' | 'A8' | 'A9' | 'A10' | 'A11';

export interface QuestionDef {
  id: QId;
  kind: 'number' | 'choice' | 'range';
  label: string;
  help?: string;
  unit?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  allowUnknown?: boolean;
  unknownLabel?: string;
  /** "Why we ask" — which output this tightens (PRD §5.2 mapping) */
  tightens: string;
  /** multi-part questions rendered by special components */
  composite?: 'A3' | 'A11';
  /** adaptive predicate — must return true to SHOW this question */
  show: (a: Answers) => boolean;
  /** wording adapts to income type */
  labelFor?: (a: Answers) => string;
}

export const MUST_ORDER: QId[] = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9'];

export const QUESTIONS: Record<QId, QuestionDef> = {
  M1: {
    id: 'M1',
    kind: 'choice',
    label: 'What is the loan for?',
    options: [
      { value: 'wedding', label: 'Wedding / family event' },
      { value: 'stock-vehicle', label: 'Stock + delivery vehicle (business)' },
      { value: 'scooter', label: 'Scooter / two-wheeler' },
      { value: 'home', label: 'Home purchase / build' },
      { value: 'other', label: 'Something else' },
    ],
    tightens: 'your verdict (whether this loan earns or just costs)',
    show: () => true,
  },
  M2: {
    id: 'M2',
    kind: 'number',
    label: 'How much do you want to borrow?',
    unit: '₹',
    placeholder: '800000',
    tightens: 'the maximum amount',
    show: () => true,
  },
  M3: {
    id: 'M3',
    kind: 'choice',
    label: 'Which loan type are you considering?',
    options: [
      { value: 'personal', label: 'Personal loan (unsecured)' },
      { value: 'business', label: 'Business loan' },
      { value: 'lap', label: 'Loan against property (LAP)' },
      { value: 'gold', label: 'Gold loan' },
      { value: 'two-wheeler', label: 'Two-wheeler / scooter loan' },
      { value: 'home', label: 'Home loan' },
    ],
    tightens: 'the fair rate band',
    show: () => true,
  },
  M4: {
    id: 'M4',
    kind: 'number',
    label: 'What is your net monthly household income?',
    help: 'Take-home, after taxes and deductions. Household = you + earning family members.',
    unit: '₹/mo',
    placeholder: '110000',
    allowUnknown: true,
    unknownLabel: "I don't know / varies too much",
    tightens: 'the maximum amount and EMI ceiling',
    show: () => true,
  },
  M5: {
    id: 'M5',
    kind: 'choice',
    label: 'What kind of income do you have?',
    options: [
      { value: 'salaried', label: 'Salaried (fixed monthly salary)' },
      { value: 'self-employed', label: 'Self-employed (business owner)' },
      { value: 'informal', label: 'Informal (daily wages, platform work, cash)' },
    ],
    tightens: 'the affordability caps lenders apply to you',
    show: () => true,
  },
  M6: {
    id: 'M6',
    kind: 'number',
    label: 'What are your total existing EMIs per month?',
    help: 'Add up every loan EMI you pay today.',
    unit: '₹/mo',
    placeholder: '0',
    allowUnknown: true,
    unknownLabel: "I don't know exactly",
    tightens: 'the EMI ceiling',
    show: () => true,
  },
  M7: {
    id: 'M7',
    kind: 'number',
    label: 'What are your total household expenses per month?',
    help: 'Rent, food, school fees, utilities — everything you spend to run the house.',
    unit: '₹/mo',
    placeholder: '45000',
    allowUnknown: true,
    unknownLabel: "I don't know exactly",
    tightens: 'the safe maximum (surplus)',
    show: () => true,
  },
  M8: {
    id: 'M8',
    kind: 'number',
    label: 'How old are you?',
    unit: 'years',
    placeholder: '29',
    tightens: 'the loan tenure available to you',
    show: () => true,
  },
  M9: {
    id: 'M9',
    kind: 'choice',
    label: 'What is your credit score?',
    help: 'CIBIL / Experian / CRIF — free on many apps. If you truly never checked, say so.',
    options: [
      { value: '750+', label: '750 or above' },
      { value: '700-749', label: '700–749' },
      { value: '650-699', label: '650–699' },
      { value: '<650', label: 'Below 650' },
      { value: 'unknown', label: "Don't know / no score" },
    ],
    tightens: 'the fair rate band',
    show: () => true,
  },

  A1: {
    id: 'A1',
    kind: 'number',
    label: 'How many years in your current job or business?',
    labelFor: (a) => (a.incomeType === 'self-employed' ? 'How many years have you run this business?' : 'How many years in your current job?'),
    unit: 'years',
    placeholder: '5',
    tightens: 'the rate band (vintage risk)',
    show: () => true,
  },
  A2: {
    id: 'A2',
    kind: 'number',
    label: 'What share of your income is variable?',
    labelFor: (a) =>
      a.incomeType === 'salaried'
        ? 'What % of your pay is incentive/variable?'
        : 'What % of your monthly income swings up or down?',
    help: 'Self-employed: cash that varies. Salaried: bonus/incentive part.',
    unit: '%',
    placeholder: '0',
    tightens: 'the income lenders will actually count',
    show: (a) => a.incomeType !== 'salaried' || true, // asked always; wording adapts
  },
  A3: {
    id: 'A3',
    kind: 'number',
    composite: 'A3',
    label: 'About your existing loans',
    tightens: 'the verdict and the rate band',
    show: (a) => (a.existingEmi ?? 0) > 0,
  },
  A4: {
    id: 'A4',
    kind: 'number',
    label: 'What % of your credit-card limit are you using?',
    unit: '%',
    placeholder: '30',
    allowUnknown: true,
    unknownLabel: 'No credit card',
    tightens: 'the rate band',
    show: (a) => a.score !== 'unknown' && a.score != null,
  },
  A5: {
    id: 'A5',
    kind: 'number',
    label: 'How many EMIs have you missed or bounced in the last 12 months?',
    unit: 'count',
    placeholder: '0',
    tightens: 'the rate band and the verdict',
    show: () => true,
  },
  A6: {
    id: 'A6',
    kind: 'number',
    label: 'How many months of expenses could you cover from savings?',
    unit: 'months',
    placeholder: '3',
    tightens: 'the verdict (shock cushion)',
    show: () => true,
  },
  A7: {
    id: 'A7',
    kind: 'number',
    label: 'What is the value of property / shop / gold you own outright?',
    help: 'Unencumbered (no loan on it). This can unlock a secured route at a much lower rate.',
    unit: '₹',
    placeholder: '4500000',
    tightens: 'unlocks the secured (LAP) route',
    show: (a) => a.incomeType === 'self-employed' || (a.amountWanted ?? 0) > 500000,
  },
  A8: {
    id: 'A8',
    kind: 'number',
    label: 'What is your co-applicant’s net monthly income?',
    help: 'Spouse / parent who would co-sign. Lenders count only half of it.',
    unit: '₹/mo',
    placeholder: '18000',
    allowUnknown: true,
    unknownLabel: 'No co-applicant',
    tightens: 'the maximum amount',
    show: (a) =>
      (a.incomeType === 'self-employed' || (a.amountWanted ?? 0) > 500000) && true,
  },
  A9: {
    id: 'A9',
    kind: 'number',
    label: 'Any large expense coming in the next 6 months?',
    help: 'School admission, medical, family event. Enter total ₹, we spread it monthly.',
    unit: '₹ over 6m',
    placeholder: '0',
    tightens: 'the safe maximum and ceiling',
    show: () => true,
  },
  A10: {
    id: 'A10',
    kind: 'number',
    label: 'If you take this loan, how much EXTRA monthly income will it generate?',
    help: 'Productive loans only — e.g. a scooter enabling more deliveries, stock enabling more sales.',
    unit: '₹/mo',
    placeholder: '8000',
    allowUnknown: true,
    unknownLabel: "It won't earn anything",
    tightens: 'the verdict (productive upgrade)',
    show: (a) => a.productive === true,
  },
  A11: {
    id: 'A11',
    kind: 'number',
    composite: 'A11',
    label: 'Any offer already received?',
    help: 'Optional — powers the comparison on your Negotiation Card.',
    tightens: 'the Negotiation Card comparator',
    show: () => true,
  },
};

/** Adaptive EXTRA path order (PRD §5.2). Kirana-style owners skip card-util automatically (A4 gated). */
export const EXTRA_ORDER: QId[] = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11'];

/** nextQuestions — adaptive skip: only questions whose predicate passes and that haven't been answered. */
export function nextQuestions(a: Answers): QId[] {
  return EXTRA_ORDER.filter((id) => {
    const q = QUESTIONS[id];
    if (!q.show(a)) return false;
    // skip if answered (non-null for its slot)
    switch (id) {
      case 'A1':
        return a.tenureYears == null;
      case 'A2':
        return a.variableSharePct == null;
      case 'A3':
        return a.loanCount == null;
      case 'A4':
        return a.cardUtilPct == null;
      case 'A5':
        return a.bounces12m == null;
      case 'A6':
        return a.savingsMonths == null;
      case 'A7':
        return a.collateralValue == null;
      case 'A8':
        return a.coIncome == null;
      case 'A9':
        return a.upcomingExpense == null;
      case 'A10':
        return a.extraIncomeFromLoan == null;
      case 'A11':
        return a.offerRatePct == null;
      default:
        return false;
    }
  });
}

/** answered A-question count (non-null) */
export function answeredACount(a: Answers): number {
  return nextQuestionsAll(a).length;
}

/** all A-questions that apply to this profile (regardless of answered state) */
export function nextQuestionsAll(a: Answers): QId[] {
  return EXTRA_ORDER.filter((id) => QUESTIONS[id].show(a));
}

/**
 * PRD §5.4 — confidence model (canonical).
 * Start Low with MUST-only. Each answered A-Q adds weight: Medium ≥3, High ≥5 + known score + savings + no unknowns.
 * Any unknown in M4/M6/M7/M9 → cap Medium, widen O2 ±20% / O3 +1pp each side.
 */
export function confidence(a: Answers): { level: Confidence; why: string; missing: string[] } {
  const missing: string[] = [];
  const unknownM = hasUnknownM(a);

  // count answered A-Qs among applicable
  const applicable = nextQuestionsAll(a);
  const answered = applicable.filter((id) => isAnswered(a, id));
  const nA = answered.length;

  if (unknownM) {
    const u = unknownWhich(a);
    missing.push(...u);
    if (nA >= 5 && a.score !== 'unknown' && (a.savingsMonths ?? 0) >= 1) {
      return {
        level: 'Medium',
        why: `You left ${u.join(', ')} as "don't know" — we widened the bands instead of guessing. Confidence capped at Medium.`,
        missing,
      };
    }
    return {
      level: 'Low',
      why: `Missing or "don't know" on ${u.join(', ')} — ranges are wide on purpose.`,
      missing,
    };
  }

  if (nA >= 5 && a.score !== 'unknown' && (a.savingsMonths ?? 0) >= 1 && !unknownM) {
    const gaps = applicable.filter((id) => !isAnswered(a, id));
    return {
      level: 'High',
      why: gaps.length
        ? `Strong data — 5+ extra answers, score known, savings known. Unanswered: ${gaps.join(', ')} — answering them tightens it further.`
        : 'Strong data — 5+ extra answers, score known, savings known, no unknowns.',
      missing: gaps,
    };
  }

  if (nA >= 3) {
    const gaps = applicable.filter((id) => !isAnswered(a, id));
    missing.push(...gaps);
    return {
      level: 'Medium',
      why: `${nA} extra answers given — bands tightened. Answer ${gaps.slice(0, 2).join(', ') || 'more'} to reach High.`,
      missing,
    };
  }

  const gaps = applicable.filter((id) => !isAnswered(a, id));
  missing.push(...gaps);
  return {
    level: 'Low',
    why: `Must-questions only — ranges are wide on purpose. Answer ${gaps.slice(0, 2).join(', ') || 'the extra questions'} to tighten.`,
    missing,
  };
}

function isAnswered(a: Answers, id: QId): boolean {
  switch (id) {
    case 'A1':
      return a.tenureYears != null;
    case 'A2':
      return a.variableSharePct != null;
    case 'A3':
      return a.loanCount != null;
    case 'A4':
      return a.cardUtilPct != null;
    case 'A5':
      return a.bounces12m != null;
    case 'A6':
      return a.savingsMonths != null;
    case 'A7':
      return a.collateralValue != null;
    case 'A8':
      return a.coIncome != null;
    case 'A9':
      return a.upcomingExpense != null;
    case 'A10':
      return a.extraIncomeFromLoan != null;
    case 'A11':
      return a.offerRatePct != null;
    default:
      return false;
  }
}

function hasUnknownM(a: Answers): boolean {
  return (
    a.incomeUnknown ||
    a.incomeMonthly == null ||
    a.existingEmiUnknown ||
    a.expensesUnknown ||
    a.expensesMonthly == null ||
    a.score === 'unknown' ||
    a.score == null
  );
}

function unknownWhich(a: Answers): string[] {
  const u: string[] = [];
  if (a.incomeUnknown || a.incomeMonthly == null) u.push('income');
  if (a.existingEmiUnknown || a.existingEmi == null) u.push('existing EMIs');
  if (a.expensesUnknown || a.expensesMonthly == null) u.push('expenses');
  if (a.score == null || a.score === 'unknown') u.push('credit score');
  return u;
}
