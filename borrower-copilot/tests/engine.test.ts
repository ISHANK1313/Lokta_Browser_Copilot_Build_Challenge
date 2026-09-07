// engine.test.ts — ≥15 Vitest unit + integration tests covering the 3 canonical personas.
// Canonical values come from rules.md + memory.md §2. If a test disagrees with rules.md, fix code.

import { describe, it, expect } from 'vitest';
import { computeAll } from '../src/rules';
import {
  baseIncome,
  routeAdjIncome,
  foirCap,
  routeFoirCap,
  effectiveExpenses,
  emiOf,
  maxLoanFromEmi,
  ltvMax,
  tenureCap,
  sizingYears,
} from '../src/rules/affordability';
import { baseBand, fairBand, aprBand, fairMid } from '../src/rules/rates';
import { tenureTable } from '../src/rules/emi';
import { nextQuestions, nextQuestionsAll, confidence } from '../src/rules/questions';
import { PRIYA, RAVI, ANITA } from '../src/fixtures/personas';
import { emptyAnswers } from '../src/types';
import type { Answers } from '../src/types';

// ---------------------------------------------------------------- affordability

describe('affordability — income rules', () => {
  it('R-INC-01: Priya fixed salary has no haircut (adj = 110000)', () => {
    expect(routeAdjIncome(PRIYA, 'unsecured')).toBe(110000);
  });

  it("R-INC-02/03: Ravi stated A2, so base keeps the midpoint 60000 (no double-punishment)", () => {
    expect(baseIncome(RAVI)).toBe(60000);
    // unsecured: ITR-min applies on top → min(60000, 42000)=42000, ×0.8 haircut + 50% co → 42600
    expect(routeAdjIncome(RAVI, 'unsecured')).toBe(42600);
  });

  it('R-INC-05: LAP route relaxes ITR-min and counts co-applicant fully → 66000', () => {
    // base 60000 (no ITR-min) × (1 − 0.5×0.40) = 48000 + 100% co-income 18000 = 66000
    expect(routeAdjIncome(RAVI, 'lap')).toBe(66000);
  });

  it('R-INC-01: Anita variable share 30% → 28000 × 0.85 = 23800', () => {
    expect(routeAdjIncome(ANITA, 'unsecured')).toBe(23800);
  });
});

describe('affordability — caps, expenses, EMI math', () => {
  it('R-FOIR-01/02: caps 45/40/35, prime bonus only for Priya (50%)', () => {
    expect(foirCap(PRIYA)).toBe(0.5);
    expect(foirCap(RAVI)).toBe(0.4);
    expect(foirCap(ANITA)).toBe(0.35);
    expect(routeFoirCap(RAVI, 'lap')).toBe(0.5); // R-FOIR-SEC secured +10pp
  });

  it('R-UNK-02: unknown expenses default to 40% of income and are flagged assumed', () => {
    const a: Answers = { ...emptyAnswers, incomeMonthly: 50000, incomeType: 'salaried', variableSharePct: 0 };
    const e = effectiveExpenses(a, 'unsecured');
    expect(e.assumed).toBe(true);
    expect(e.value).toBe(20000);
  });

  it('EMI formula: ₹1L at 12% over 1 year → ₹8,884.88', () => {
    expect(emiOf(100000, 12, 1)).toBeCloseTo(8884.88, 1);
  });

  it('maxLoanFromEmi is the inverse of emiOf (round-trips)', () => {
    const emi = emiOf(100000, 12, 1);
    expect(maxLoanFromEmi(emi, 12, 1)).toBeCloseTo(100000, 0);
  });

  it('R-LTV-01: LAP capped at 60% of collateral', () => {
    expect(ltvMax(RAVI.collateralValue)).toBe(2700000);
    expect(ltvMax(null)).toBeNull();
  });

  it('R-TEN-01: tenure caps — business 10y, LAP 15y, personal 5y, 2W 4y', () => {
    expect(tenureCap(PRIYA)).toBe(5); // personal, min(5, 60−29)
    expect(tenureCap(RAVI)).toBe(10); // business product max, min(10, 65−42)
    expect(tenureCap({ ...RAVI, loanType: 'lap' })).toBe(15); // LAP max
    expect(tenureCap(ANITA)).toBe(4); // two-wheeler max
  });

  it('R-TEN-02: safe sizing of non-productive loans is capped at 3 years (Priya consumption discipline)', () => {
    expect(sizingYears(PRIYA, 'unsecured', false)).toBe(5);
    expect(sizingYears(PRIYA, 'unsecured', true)).toBe(3);
  });
});


// ---------------------------------------------------------------- rates (O3)

describe('rates — base bands, add-ons, APR', () => {
  it('R-BASE: product bands match rules.md table', () => {
    expect(baseBand('personal', 'salaried')).toEqual([10.5, 14]);
    expect(baseBand('personal', 'self-employed')).toEqual([14, 19]);
    expect(baseBand('two-wheeler', null)).toEqual([12, 18]);
    expect(baseBand(null, null)).toEqual([24, 36]); // app/informal fallback
  });

  it('Priya: 750+ (−0.5) then prime tightening → fair band exactly 11–12.5%', () => {
    const fb = fairBand(PRIYA);
    expect([fb.low, fb.high]).toEqual([11, 12.5]);
    expect(fb.widened).toBe(false);
    expect(fairMid(fb)).toBe(11.75);
  });

  it('R-UNK-01: Ravi unknown score → +2pp and band widened ±1pp/side (LAP 10–13 → 11–16)', () => {
    const fb = fairBand(RAVI, 'lap');
    expect([fb.low, fb.high]).toEqual([11, 16]);
    expect(fb.widened).toBe(true);
  });

  it('R-CH-01: Anita (informal, existing 30% loans) prices at the distressed channel 24–32', () => {
    const fb = fairBand(ANITA);
    expect([fb.low, fb.high]).toEqual([24, 32]);
  });

  it('R-APR-01: APR adds amortised fee — Priya 1.5% fee over 3y → +0.75pp', () => {
    expect(aprBand(11, 12.5, 1.5, 3)).toEqual([11.75, 13.25]);
  });
});


// ---------------------------------------------------------------- questions + confidence

describe('questions — adaptive path (PRD §5.3)', () => {
  const partialSalaried: Answers = {
    ...emptyAnswers,
    incomeType: 'salaried',
    score: '750+',
    existingEmi: 14000,
    amountWanted: 800000,
    productive: false,
  };

  it('salaried borrower with existing EMI gets A3, A4, A7, A8 but not A10 (non-productive)', () => {
    const q = nextQuestions(partialSalaried);
    expect(q).toContain('A3');
    expect(q).toContain('A4');
    expect(q).toContain('A7'); // amount > ₹5L
    expect(q).not.toContain('A10');
  });

  it('A4 is skipped entirely when score is unknown (Ravi / no history)', () => {
    const a: Answers = { ...partialSalaried, score: 'unknown' };
    expect(nextQuestions(a)).not.toContain('A4');
  });

  it('informal productive borrower (Anita-like) is asked A3 + A10 but not A7/A8 (small ticket)', () => {
    const a: Answers = {
      ...emptyAnswers,
      incomeType: 'informal',
      productive: true,
      score: 'unknown',
      existingEmi: 6000,
      amountWanted: 150000,
    };

// ---------------------------------------------------------------- emi.ts (O4 helpers)

describe('emi helpers', () => {
  it('R-C-02: tenure table shows 2/3/5y filtered by product max', () => {
    const rows = tenureTable(600000, 11.75, 5);
    expect(rows.map((r) => r.years)).toEqual([2, 3, 5]);
    expect(rows[0].emi).toBeGreaterThan(rows[2].emi);
  });

  it('tenure table falls back to tenures that fit when product max is 4y', () => {
    const rows = tenureTable(150000, 14, 4); // two-wheeler max 4y → [2,3]
    expect(rows.map((r) => r.years)).toEqual([2, 3]);
  });
});

// ---------------------------------------------------------------- integration via computeAll

describe('computeAll — persona integration (memory.md §2 freeze check)', () => {
  it('Priya → BORROW_LESS; lender ~₹9–10L, safe ~₹6–7L, fair 11–12.5, APR 11.8–13.3, ceiling ₹22,000, stress PASS', () => {
    const o = computeAll(PRIYA);
    expect(o.o1.verdict).toBe('BORROW_LESS');
    expect(o.o1.whys.length).toBeGreaterThanOrEqual(2);
    expect(o.o2.lenderMax).toBeGreaterThan(900000);
    expect(o.o2.lenderMax).toBeLessThan(1050000);
    expect(o.o2.safeMax).toBeGreaterThan(600000);
    expect(o.o2.safeMax).toBeLessThan(700000);
    expect(o.o2.useThis).toBe(o.o2.safeMax); // UseThis = SafeMax
    expect([o.o3.fairLow, o.o3.fairHigh]).toEqual([11, 12.5]);
    expect([o.o3.aprLow, o.o3.aprHigh]).toEqual([11.8, 13.3]);
    expect(o.o4.ceiling).toBe(22000);
    expect(o.o4.stress.pass).toBe(true);
    expect(o.confidence).toBe('High');
  });

  it('Ravi → BORROW via secured LAP route; unsecured caps near ₹3–6L, LAP far larger; confidence Low', () => {
    const o = computeAll(RAVI);
    expect(o.o1.verdict).toBe('BORROW');
    expect(o.o1.securedRoute).toBe(true);
    expect(o.o2.routes.map((r) => r.route)).toEqual(['unsecured', 'lap']);
    const unsec = o.o2.routes[0];
    const lap = o.o2.routes[1];
    expect(unsec.lenderMax).toBeGreaterThan(300000);
    expect(unsec.lenderMax).toBeLessThan(600000);
    expect(lap.lenderMax).toBeGreaterThan(unsec.lenderMax * 3);
    expect(o.o2.lenderMax).toBe(lap.lenderMax); // LAP is the recommended route
    expect(o.confidence).toBe('Low');
  });

  it('Anita → DONT_BORROW; safe ₹0, fair 24–32, ceiling 0, stress FAIL (brief requirement)', () => {
    const o = computeAll(ANITA);
    expect(o.o1.verdict).toBe('DONT_BORROW');
    expect(o.o2.safeMax).toBe(0);
    expect([o.o3.fairLow, o.o3.fairHigh]).toEqual([24, 32]);
    expect(o.o4.ceiling).toBe(0);
    expect(o.o4.stress.pass).toBe(false);
    expect(o.confidence).toBe('Low');
  });

  it('R-UNK-04: unknown income blocks O2 and forces DONT (never guessed as zero)', () => {
    const a: Answers = {
      ...emptyAnswers,
      incomeUnknown: true,
      incomeMonthly: null,
      incomeType: 'salaried',
      loanType: 'personal',
      amountWanted: 500000,
    };
    const o = computeAll(a);
    expect(o.o2.blocked).toBe(true);
    expect(o.o1.verdict).toBe('DONT_BORROW');
  });

  it('explains are always produced and every output carries a why', () => {
    for (const p of [PRIYA, RAVI, ANITA]) {
      const o = computeAll(p);
      expect(o.explains.length).toBeGreaterThanOrEqual(3);
      expect(o.o1.reason.length).toBeGreaterThan(10);
      expect(o.o3.why.length).toBeGreaterThan(10);
      expect(o.o4.why.length).toBeGreaterThan(10);
    }
  });
});

    const q = nextQuestions(a);
    expect(q).toContain('A3');
    expect(q).toContain('A10');
    expect(q).not.toContain('A7');
    expect(q).not.toContain('A8');
  });

  it('fully-answered personas only have their genuinely-unanswered extras left', () => {
    // Priya answered everything except A7 (no collateral) and A8 (no co-applicant)
    expect(nextQuestions(PRIYA)).toEqual(['A7', 'A8']);
    expect(nextQuestionsAll(RAVI)).not.toContain('A4'); // Ravi skipped A4 by rule
  });
});

describe('confidence (PRD §5.4)', () => {
  it('Priya: full data + known score + savings → High', () => {
    expect(confidence(PRIYA).level).toBe('High');
  });

  it('Ravi: unknown score caps at Low with a because-reason', () => {
    const c = confidence(RAVI);
    expect(c.level).toBe('Low');
    expect(c.why).toMatch(/credit score/i);
  });

  it('Anita: unknown score → Low', () => {
    expect(confidence(ANITA).level).toBe('Low');
  });

  it('MUST-only answers → Low', () => {
    expect(confidence({ ...emptyAnswers }).level).toBe('Low');
  });
});
