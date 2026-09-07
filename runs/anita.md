# runs/anita.md — P3 · Anita, 35, Hubballi, informal

> Delivery rider + tailoring, ₹26,000–30,000/mo, 2 children, husband unemployed 8 months.
> Three app loans ₹35,000 outstanding at 30%+, 1 EMI bounced last month.
> **Ask:** ₹1,50,000 e-scooter to double delivery runs (productive but fragile).
> Fixture: `borrower-copilot/src/fixtures/personas.ts → ANITA`.

## Questions asked

- **MUST:** purpose=scooter → productive · ₹1,50,000 · two-wheeler · income ₹28,000 (range 26–30k) · informal · existing EMIs ₹6,000 · expenses ₹22,000 · age 35 · score **unknown**
- **ADDITIONAL (adaptive):** A1 tenure 2y · A2 variable 30% · A3 3 loans, highest rate 30% · A5 bounces 1 · A6 savings 0 months · A9 upcoming ₹10,000 (school fees) · A10 extra income ₹8,000/mo claimed · A11 offer 28% @2%
  (A7/A8 skipped — small ticket, informal)

## Final outputs (O1–O4) — from `computeAll(ANITA)`

| Output | Value |
|--------|-------|
| **O1 Verdict** | **DONT_BORROW** — "Your safe surplus after essentials and existing EMIs is too small to carry a new EMI — fix the existing burden first." |
| O1 whys | Only ₹0/mo of safe surplus remains after expenses and existing EMIs · even though the scooter may earn ₹8,000/mo, savings are 0 months — fix the cushion first, then borrow |
| **O2 amounts** | LenderLikelyMax **₹66,854** vs SafeMax **₹0** → there is no safe number. (Adj income ₹23,800 after the 30% variable haircut − ₹6,000 EMIs − ₹22,000 expenses − ₹833/mo upcoming = negative surplus) |
| **O3 fair rate** | **24–32%** — distressed channel: "existing loans at 24%+ with informal income → priced at the distressed channel; your bounce and unknown score are why it is not cheaper." APR 24.8–32.8% |
| **O4 ceiling** | **₹0/mo** — no room. Stress test: **FAIL** (income −20% and rate +2pp both break the room) |
| Confidence | **Low** — "Missing or 'don't know' on credit score — ranges are wide on purpose." |

## Negotiation Card

- Route: two-wheeler loan · Fair **24–32%** · APR **24.8–32.8%** · Ceiling **₹0/mo**
- Comparator: lender quote 28% → inside the band, but the ceiling is ₹0 — the fair rate is not the problem; the burden is.

Matches memory.md §2 direction: `DONT_BORROW (fix first)`, lender ~₹30–67k, safe ~₹0, fair 24–32%, ceiling ~₹0, **stress FAIL visibly**. ✅
