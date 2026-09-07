// verdict.ts — O1: BORROW / BORROW_LESS / DONT_BORROW. Rules R-V-01..08 from rules.md.

import type { Answers, O1, O2Route } from './types';
import { fmtInr, fmtPct } from './format';

// O2Route is used in VerdictInput.routes typing below.

export interface VerdictInput {
  a: Answers;
  amountWanted: number;
  headroomE: number | null; // FOIR headroom EMI (₹/mo)
  safeE: number | null; // safe EMI (₹/mo)
  foirCapPct: number; // cap as fraction e.g. 0.45
  adjInc: number | null;
  fairLow: number; // recommended route fair band low
  fairHigh: number;
  newEmiAtSafe: number | null; // EMI of recommended SafeMax at fairMid over tenure
  routes: O2Route[];
  expensesAssumed: boolean;
  unknownEmi: boolean;
  scoreUnknown: boolean;
}

/** R-V-01..08 — evaluate DONT triggers, then LESS triggers, else BORROW. First match wins, order = severity. */
export function decideVerdict(v: VerdictInput): O1 {
  const whys: string[] = [];
  const a = v.a;

  // ---- R-UNK-04 guard: unknown income blocks affordability
  if (v.adjInc == null) {
    return {
      verdict: 'DONT_BORROW',
      reason: 'We cannot compute affordability without your income — a lender will also ask for proof.',
      whys: ['No income figure = no affordability; anything we said about amounts would be a guess.'],
      securedRoute: false,
    };
  }

  const informal = a.incomeType === 'informal';
  const productive = a.productive === true;
  const bounces = a.bounces12m ?? 0;
  const highestRate = a.highestRatePct ?? 0;

  // ---- R-V-03: toxic stack — bounces≥2 AND existing highest rate ≥24 AND new loan ≥24
  if (bounces >= 2 && highestRate >= 24 && v.fairLow >= 24) {
    return {
      verdict: 'DONT_BORROW',
      reason: `You have ${bounces} bounces and loans already at ${fmtPct(highestRate)} — adding new debt at ${fmtPct(v.fairLow)}+ is a debt trap.`,
      whys: [
        `${bounces} bounced EMIs in the last 12 months show repayment is already breaking.`,
        `Existing loans at ${fmtPct(highestRate)} plus a new ${fmtPct(v.fairLow)}+ loan compounds faster than income can cover.`,
      ],
      securedRoute: false,
    };
  }

  // ---- R-V-04: fragile non-productive — informal AND non-productive AND fairLow > 20
  if (informal && !productive && v.fairLow > 20) {
    return {
      verdict: 'DONT_BORROW',
      reason: `Informal income at ${fmtInr(v.adjInc)}/mo cannot safely carry consumption debt priced at ${fmtPct(v.fairLow)}+.`,
      whys: [
        'Your income is informal and the loan earns nothing back (non-productive).',
        `Fair rates above 20% on a non-productive loan is how debt traps start.`,
      ],
      securedRoute: false,
    };
  }

  // ---- R-V-02: no surplus — safeEmi ≤ 2000 → DONT (Anita trigger)
  if (v.safeE != null && v.safeE <= 2000) {
    const whyBullets: string[] = [
      `After expenses and existing EMIs, only ${fmtInr(Math.max(0, v.safeE))}/mo of safe surplus remains.`,
    ];
    if (productive && (a.extraIncomeFromLoan ?? 0) > 0) {
      whyBullets.push(
        `Even though the scooter may earn ${fmtInr(a.extraIncomeFromLoan ?? 0)}/mo, savings are ${(a.savingsMonths ?? 0)} months — fix the cushion first, then borrow.`,
      );
    }
    return {
      verdict: 'DONT_BORROW',
      reason: 'Your safe surplus after essentials and existing EMIs is too small to carry a new EMI — fix the existing burden first.',
      whys: whyBullets,
      securedRoute: false,
    };
  }

  // ---- R-V-01: FOIR breach — post-new-EMI FOIR > cap + 10pp → DONT
  if (v.newEmiAtSafe != null && v.adjInc != null && v.headroomE != null) {
    const postFoir = (a.existingEmiUnknown || a.existingEmi == null ? 0 : a.existingEmi) + v.newEmiAtSafe;
    const postRatio = postFoir / v.adjInc;
    if (postRatio > v.foirCapPct + 0.1) {
      return {
        verdict: 'DONT_BORROW',
        reason: `Even the recommended amount would take your EMIs to ${Math.round(postRatio * 100)}% of income — beyond any lender's comfort (${Math.round(v.foirCapPct * 100)}%).`,
        whys: [
          `Your existing EMIs plus the new EMI would exceed your income-type cap of ${Math.round(v.foirCapPct * 100)}% by more than 10 points.`,
        ],
        securedRoute: false,
      };
    }
  }

  // Survived DONT triggers — collect whys for BORROW/LESS
  whys.push(`Your income type (${a.incomeType}) gets a lender cap of ${Math.round(v.foirCapPct * 100)}% of income for total EMIs.`);
  if (bounces >= 1) {
    whys.push(`${bounces} bounce${bounces > 1 ? 's' : ''} in the last 12 months will cost you ~1.5pp on the rate.`);
  }

  // ---- R-V-08: secured route — unsecured safeMax < 50% wanted AND collateral ≥ 2× wanted → BORROW-secured
  const unsec = v.routes.find((r) => r.route === 'unsecured');
  const lap = v.routes.find((r) => r.route === 'lap');
  if (unsec && lap) {
    whys.push(
      `Your shop collateral unlocks a loan-against-property route — unsecured lending would cap you near ${fmtInr(unsec.safeMax)}.`,
    );
    return {
      verdict: 'BORROW',
      reason: `Unsecured lending caps you near ${fmtInr(unsec.safeMax)}, far short of ${fmtInr(v.amountWanted)} — pledge the shop as loan-against-property instead.`,
      whys: whys.slice(0, 3),
      securedRoute: true,
    };
  }

  // ---- R-V-05: wanted > safeMax → BORROW_LESS (safeMax already carries consumption
  // tenure discipline + 20% EMI cap from affordability, so a consumption ask exceeding it fires here)
  const recSafe = unsec ? unsec.safeMax : 0;
  if (v.amountWanted > recSafe) {
    if (!productive) {
      whys.unshift(
        `This loan is consumption (earns nothing back), so safe sizing uses a 3-year payback — your ${fmtInr(recSafe)} safe number is below the ${fmtInr(v.amountWanted)} you asked for.`,
      );
    } else {
      whys.unshift(
        `You asked for ${fmtInr(v.amountWanted)} but the safe number is ${fmtInr(recSafe)} — the rest is what gets people stretched past comfort.`,
      );
    }
    return {
      verdict: 'BORROW_LESS',
      reason: `You can likely get ${fmtInr(v.amountWanted)} sanctioned, but you can safely carry only about ${fmtInr(recSafe)} — borrow the lower number.`,
      whys: whys.slice(0, 3),
      securedRoute: false,
    };
  }

  // ---- R-V-06: FOIR caution zone — post-EMI FOIR > cap but ≤ cap+10pp → LESS
  if (v.newEmiAtSafe != null && v.adjInc != null && v.headroomE != null) {
    const postFoir = (a.existingEmiUnknown || a.existingEmi == null ? 0 : a.existingEmi) + v.newEmiAtSafe;
    const postRatio = postFoir / v.adjInc;
    if (postRatio > v.foirCapPct) {
      return {
        verdict: 'BORROW_LESS',
        reason: `The requested amount pushes your EMIs to ${Math.round(postRatio * 100)}% of income — above the ${Math.round(v.foirCapPct * 100)}% comfort zone. Reduce the amount.`,
        whys: whys.slice(0, 3),
        securedRoute: false,
      };
    }
  }

  // ---- R-V-07: productive upgrade note — conditional BORROW
  if (productive && (a.extraIncomeFromLoan ?? 0) > 0 && v.newEmiAtSafe != null) {
    const covers = (a.extraIncomeFromLoan ?? 0) * 12 >= v.newEmiAtSafe * 12 * 1.25;
    if (covers) {
      whys.push(
        `The loan is projected to earn ${fmtInr(a.extraIncomeFromLoan ?? 0)}/mo — more than 1.25× its EMI — which justifies borrowing.`,
      );
    }
  }

  return {
    verdict: 'BORROW',
    reason: `Your surplus and profile support ${fmtInr(recSafe)} comfortably — proceed, and negotiate with the fair band below.`,
    whys: whys.slice(0, 3),
    securedRoute: false,
  };
}
