# runs/ravi.md — P2 · Ravi, 42, Mysuru, self-employed (kirana, 14 yrs)

> Cash ₹40,000–80,000/mo; ITR ₹4,20,000/yr; shop ₹45,00,000 unencumbered; no formal loan, no score.
> Wife (teacher) ₹18,000/mo as co-applicant.
> **Ask:** ₹15,00,000 for a second stock line + delivery vehicle (productive).
> Fixture: `borrower-copilot/src/fixtures/personas.ts → RAVI`.

## Questions asked

- **MUST:** purpose=stock+vehicle → productive · ₹15,00,000 · business loan · income ₹60,000 (range 40–80k) · self-employed · existing EMIs ₹0 · expenses ₹30,000 · age 42 · score **unknown**
- **ADDITIONAL (adaptive):** A1 business vintage 14y · A2 variable 40% · A5 bounces 0 · A6 savings 3 months · A7 collateral ₹45,00,000 · A8 co-income ₹18,000 · A10 extra income ₹20,000/mo · A11 offer 17% @2%
  (**A4 skipped automatically** — no credit history / unknown score; wording adapts: "business vintage")

## Final outputs (O1–O4) — from `computeAll(RAVI)`

| Output | Value |
|--------|-------|
| **O1 Verdict** | **BORROW** (secured route) — "Unsecured lending caps you near ₹3,11,147, far short of ₹15,00,000 — pledge the shop as loan-against-property instead." |
| **O2 amounts** | **Two routes shown.** Route A unsecured: lender ₹4,95,047 / safe ₹3,11,147 (ITR-min base ₹42,000 → adj ₹42,600, 3y WC line). Route B LAP: lender **₹21,67,142** / safe **₹20,09,532** (co-income counted 100%, 60% LTV ≤ ₹27L, 15y) — LAP recommended |
| **O3 fair rate** | LAP band **11–16%** (10–13 base; unknown score → +2pp, widened ±1pp/side — disclosed). APR 11.3–16.3% |
| **O4 ceiling** | **₹30,500/mo** for the safe LAP amount over 15y. Tenure table: 2y ₹96,009 · 3y ₹68,194 · 5y ₹46,239 |
| O4 stress | **FAIL** — income −20% drops room to ₹19,380/mo; rate +2pp EMI ₹33,039. The UI shows this verbatim with the note: a smaller loan or shorter tenure makes it robust |
| Confidence | **Low** — "Missing or 'don't know' on credit score — ranges are wide on purpose." |

## Negotiation Card

- Route: LAP (secured) · Fair **11–16%** · APR **11.3–16.3%** · Ceiling **₹30,500/mo**
- Comparator: lender quote 17% → **OVERPRICED** vs the unsecured band and far above LAP — the secured route is where the money is.

Matches memory.md §2 direction: `BORROW but SECURED + LESS`, unsecured ~₹3–5L vs LAP ~₹20L+, must use conservative income + co-applicant. ✅
Screenshot: `runs/ravi-results.png`.
