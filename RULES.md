# RULES.md — Every rule, threshold and assumption in one table

> **Submission doc for judges.** Exported from the internal `rules.md` bible. If code and this
> file disagree, this file wins and the code gets fixed. All ₹ monthly unless noted. Rates are
> annual reducing-balance %. `Source` = where the number comes from: industry/RBI norm or
> declared judgement.

---

## 1. Unknown handling — "Unknown is never zero"

| ID | What | Value | Why | Source |
|----|------|-------|-----|--------|
| R-UNK-01 | Unknown credit score | +2pp on fair band, widen ±1pp/side, cap confidence Medium | "Don't know" ≠ 300; penalise + disclose | judgement |
| R-UNK-02 | Unknown expenses | Default 40% of adjusted income, flagged `assumed`, SafeMax widened ±20% | Rent+food floor in urban India | judgement |
| R-UNK-03 | Unknown existing EMI | Default 0 but flagged, confidence capped, stress warns | Can't assume zero burden silently | judgement |
| R-UNK-04 | Unknown income | O2 blocked (`need income`), O1 → DONT | No income = no affordability; refuse to guess | common sense |

## 2. Income adjustment — what lenders will actually count

| ID | What | Formula / Value | Why | Source |
|----|------|-----------------|-----|--------|
| R-INC-01 | Variable haircut | `adj = stated × (1 − 0.5 × variableShare)` | Variable pay isn't guaranteed | industry norm + judgement |
| R-INC-02 | Cash vs ITR (self-employed, unsecured route) | `base = min(statedAvg, ITR/12 × 1.2)` | Lenders trust ITR; cash is overstated | judgement |
| R-INC-03 | Range income | Midpoint for display; lower-40th-percentile for safe calc only when volatility is otherwise uncaptured (A2 unanswered) | Conservatism without double-punishing | judgement |
| R-INC-04 | Co-applicant, unsecured route | +50% of co-income | Co-borrower shares but isn't fully counted | industry norm |
| R-INC-05 | Co-applicant + collateral, LAP route | +100% of co-income; ITR-min relaxed | Co-signer on a pledged asset changes the risk | judgement |

## 3. Affordability caps — LenderMax vs SafeMax (O2)

| ID | What | Value | Why | Source |
|----|------|-------|-----|--------|
| R-FOIR-01 | Lender FOIR cap | salaried 45% / self-employed 40% / informal 35% | Risk by income stability | industry norm (HDFC/SBI 40–50%) |
| R-FOIR-02 | Prime bonus | +5pp (→50%) if income >₹1L AND score 750+ | Prime borrowers get headroom | judgement |
| R-FOIR-SEC | Secured (LAP) cap | base cap +10pp, max 55% | Collateral raises tolerable leverage | judgement |
| R-FOIR-03 | Headroom | `cap × adjIncome − existingEmi` | Max new EMI a lender tolerates | FOIR definition |
| R-PL-20 | Unsecured consumer EMI policy cap | 20% of adjusted income (personal / 2W / gold; not business, LAP, home) | Delinquency clusters above 20% EMI/income on PL-style loans | industry norm + judgement |
| R-SAFE-01 | Safe EMI | `0.85 × (adjIncome − expenses − existingEmi − upcoming/12)`, floor 0 | 15% shock buffer; expenses = survival | judgement |
| R-SAFE-02 | Use-this | `UseThis = SafeMax` — never recommend above the safe number | Borrower number < lender number | product principle |
| R-LTV-01 | LAP LTV cap | 60% of collateral value | Conservative vs 65–75% market | industry norm |
| R-TEN-01 | Tenure caps | personal 5y, LAP 15y, business 10y, 2W 4y, gold 3y; min(retirement room: 60−age salaried, 65−age other) | Retirement + product norms | industry norm |
| R-TEN-02 | Safe-sizing tenure discipline | non-productive loans sized ≤3y; unsecured business ≤3y | Pay consumption off fast; WC lines are short | judgement |

**Formulas (canonical):** `EMI = P×r×(1+r)^n / ((1+r)^n − 1)` with `r = annual/12/100`;
`maxLoan = EMI × ((1+r)^n − 1) / (r(1+r)^n)`.

## 4. Fair rate bands + add-ons (O3)

| ID | What | Value | Why | Source |
|----|------|-------|-----|--------|
| R-BASE-01 | Home | 8.5–10% | Secured, prime | industry norm Sep 2026 |
| R-BASE-02 | LAP | 10–13% | Secured property | industry norm |
| R-BASE-03 | Business (self-emp/informal) | 11–14% | Secured stock/vehicle | industry norm |
| R-BASE-04 | Personal, salaried | 10.5–14% | Unsecured prime | industry norm |
| R-BASE-05 | Personal, self-employed | 14–19% | Unsecured variable | industry norm |
| R-BASE-06 | Gold | 9–12% | Secured gold | industry norm |
| R-BASE-07 | Two-wheeler | 12–18% | Depreciating asset | industry norm |
| R-BASE-08 | App/informal fallback | 24–36% | Small-ticket high-risk | observed (KreditBee etc.) |
| R-ADJ-01 | Score 750+ | −0.5pp | Prime discount | judgement |
| R-ADJ-02 | Score 650–699 / <650 | +1.5pp / +3pp | Risk pricing | judgement |
| R-ADJ-03 | Unknown score | +2pp, widen ±1pp/side | Uncertainty premium | R-UNK-01 |
| R-ADJ-04 | Bounce ≥1 in 12m | +1.5pp (≥2 also downgrades O1) | Delinquency signal | judgement |
| R-ADJ-05 | Card utilisation >70% | +1pp | Stress signal | judgement |
| R-ADJ-06 | Job/business vintage <2y | +1pp | Instability | judgement |
| R-ADJ-07 | Prime tightening | salaried + 750+ + >₹1L + tenure ≥2y → band anchored to the inner (better) half of quotes | Lenders quote prime borrowers inside the base band | judgement |
| R-CH-01 | Distressed channel | informal + existing loan ≥24% → priced 24–32, score/bounce add-ons skipped (already priced in) | The channel, not the product, sets the price | judgement |
| R-FEE-01 | Processing fee | personal 1.5%, LAP 1%, 2W 2%, app 2%, home 0.5%, gold/business 1% (editable) | APR honesty | industry norm |
| R-APR-01 | APR approximation | `APR ≈ nominal + fee/years × 1.5` (fee amortised on reducing balance), shown as a band; GST/insurance excluded — disclosed | RBI all-in disclosure norm | RBI norm (approximation declared) |


## 5. Verdict triggers (O1) — first match wins, ordered by severity

| ID | Trigger | Outcome | Why |
|----|---------|---------|-----|
| R-UNK-04g | Income unknown | DONT_BORROW | No affordability without income |
| R-V-03 | bounces ≥2 AND existing highest rate ≥24% AND new rate ≥24% | DONT_BORROW | Toxic stack — debt trap |
| R-V-04 | informal AND non-productive AND fairLow >20% | DONT_BORROW | Consumption at 30% = trap |
| R-V-02 | safeEmi ≤ ₹2,000 | DONT_BORROW | No room after survival (Anita) |
| R-V-01 | post-new-EMI FOIR > cap+10pp | DONT_BORROW | Can't carry even by lender standards |
| R-V-08 | unsecured safeMax < 50% of wanted AND collateral ≥ 2× wanted | BORROW + secured route (LAP) | Collateral unlocks (Ravi) |
| R-V-05 | wanted > safeMax | BORROW_LESS | Right-size (Priya: ₹8L asked vs ~₹6.6L safe) |
| R-V-06 | post-EMI FOIR > cap, ≤ cap+10pp | BORROW_LESS | Caution zone |
| R-V-07 | productive AND extraIncome ≥ 1.25× EMI | BORROW + upgrade note | ROI covers cost — conditional |

## 6. EMI ceiling + stress (O4)

| ID | What | Value | Why |
|----|------|-------|-----|
| R-C-01 | Ceiling | `min(FOIR headroom, safe surplus, 20% policy cap)` rounded down to ₹500 | Hard do-not-cross |
| R-C-02 | Tenure table | 2/3/5-year EMI for SafeMax at fair mid (+ total interest) | Trade-off visible |
| R-S-01 | Stress test | income −20% recalc of safe room AND rate +2pp recalc of EMI; PASS only if both hold; FAIL shown verbatim | One shock case required by brief (Anita must FAIL) |

## 7. Confidence model

- **Low** — MUST-questions only, or any unknown among income / existing EMIs / expenses / score.
- **Medium** — ≥3 answered extra questions, no MUST unknowns in income/expenses.
- **High** — ≥5 extra answers + score known + savings ≥1 month + no unknowns.
- Always displayed with a `because …` sentence naming what is missing.

## 8. Honesty about limits (read before trusting the numbers)

- We don't know any lender's exact FOIR cap or rate card — bands are judgement + Sep-2026
  industry norms, not bureau data.
- The APR approximation ignores GST and insurance.
- The ITR-vs-cash haircut, the 40% expense default, 60% LAP LTV and the 20% policy cap are
  conservative guesses — each is flagged `assumed` in the UI when it fires.
- This app is a self-assessment aid — not financial advice, not a credit decision.

