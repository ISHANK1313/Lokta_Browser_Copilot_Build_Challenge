# runs/priya.md — P1 · Priya, 29, Bengaluru, salaried

> Net ₹1,10,000/mo, car EMI ₹14,000 (2y left), rent ₹28,000, score 780.
> **Ask:** ₹8,00,000 personal loan for a wedding (non-productive).
> Fixture: `borrower-copilot/src/fixtures/personas.ts → PRIYA` (also a one-click demo button).

## Questions asked

- **MUST (M1–M9):** purpose=wedding → productive=false · amount ₹8,00,000 · personal · income ₹1,10,000 · salaried · existing EMIs ₹14,000 · expenses ₹45,000 · age 29 · score 750+
- **ADDITIONAL (adaptive):** A1 job tenure 5y · A2 variable 0% · A3 1 loan @9.5% · A4 card util 30% · A5 bounces 0 · A6 savings 4 months · A9 upcoming ₹0 · A11 offer 14% @1.5% fee
  (A10 skipped — non-productive; A7/A8 answered "none")

## Interim result (MUST-only)

- Verdict **BORROW LESS**, fair band 10–13.5% (wide), confidence **Low** — "Must-questions only — ranges are wide on purpose."

## Final outputs (O1–O4) — from `computeAll(PRIYA)`

| Output | Value |
|--------|-------|
| **O1 Verdict** | **BORROW_LESS** — "You can likely get ₹8,00,000 sanctioned, but you can safely carry only about ₹6,64,752 — borrow the lower number." |
| O1 whys | Consumption loan → safe sizing uses a 3-year payback (₹6,64,752 < ₹8,00,000) · salaried cap = 50% of income for total EMIs |
| **O2 amounts** | LenderLikelyMax **₹9,94,651** vs SafeMax **₹6,64,752** → **Use this: ₹6,64,752**. Lender EMI room ₹22,000/mo (FOIR 50% + 20%-of-income policy cap) over 5y; safe sizing over 3y |
| **O3 fair rate** | **11–12.5%**, APR **11.8–13.3%**. Add-ons: 750+ → −0.5pp; prime profile → band tightened to inner quotes. Fee 1.5% amortised ≈ +0.8pp |
| **O4 ceiling** | **₹22,000/mo** do-not-cross. Tenure table at fair mid 11.75%: 2y ₹31,215 · 3y ₹22,000 (total interest ₹1,27,248) |
| O4 stress | **PASS** — income −20% leaves ₹24,650/mo room; rate +2pp (13.8%) EMI ₹22,639 — both above the committed ₹22,000 |
| Confidence | **High** — 5+ extra answers, score known, savings known (A7/A8 unanswered would tighten further) |

## Negotiation Card

- Route: personal loan (unsecured) · Fair **11–12.5%** · APR **11.8–13.3%** · Ceiling **₹22,000/mo**
- Comparator: lender quote 14% → **OVERPRICED by ~1.5 points** — anchor at 11–12.5% and make them beat the top of the band.

Matches memory.md §2 direction: `BORROW_LESS`, lender ~₹9–10L, safe ~₹6L, fair 11–12.5%, APR 11.8–13.3%, ceiling ~₹22k. ✅
Screenshot: `runs/priya-results.png` (results), `runs/priya-card.png` (card).
