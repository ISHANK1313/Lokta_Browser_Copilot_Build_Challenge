# walkthrough.md — 5-minute demo script + what next / what cut

## The 5-minute script

**0:00–0:45 — The problem.** Every lender has a model that decides what a borrower gets; the
borrower has nothing. Borrower Copilot turns lending judgement into deterministic rules a
borrower can see and a machine can run — self-reported data only, no login, no backend,
nothing leaves the browser.

**0:45–1:30 — Priya (salaried, stretched ask).** Open the app → one-click persona **Priya**.
Results: verdict **BORROW_LESS** — a lender would sanction ~₹9.9L, but the safe number is
~₹6.6L because the wedding loan earns nothing and safe sizing uses a 3-year payback. Fair rate
**11–12.5%** (750+ discount and prime tightening are listed as line items), APR **11.8–13.3%**,
EMI ceiling **₹22,000**. Stress test **PASS**. Confidence **High** — and every number has a
"why" (open the audit trail at the bottom).

**1:30–2:15 — The Negotiation Card.** Click **Build my Negotiation Card**. One screen, print-
ready. Her fictional quote of 14% goes into the comparator → **OVERPRICED by ~1.5 points**,
anchored to the fair band.

**2:15–3:15 — Ravi (self-employed, collateral unlocks a route).** Persona **Ravi**. Verdict
**BORROW — secured route**: unsecured lending caps him near ₹3.1L (ITR-min income, 3y line),
but pledging the shop unlocks LAP ~₹20L at 11–16%. Two routes are shown side by side with the
LAP recommended. Note the honesty flags: unknown score widened the band (disclosed), and the
stress test **FAIL**s — the UI says verbatim that a smaller loan or shorter tenure makes it
robust. Confidence **Low**, and it says why.

**3:15–4:00 — Anita (informal, the app says no).** Persona **Anita**. Verdict **DONT_BORROW**:
₹0 safe surplus after ₹22k expenses, ₹6k app-loan EMIs and upcoming school fees. Safe max ₹0,
fair band 24–32% (distressed channel — disclosed), ceiling ₹0, stress **FAIL**. Even a
"productive" scooter doesn't flip it: zero cushion first. This is the O1 "DONT_BORROW must be
reachable" requirement, live.

**4:00–4:40 — The engine underneath.** Everything is `computeAll(answers)` in
`src/rules/index.ts` — pure TypeScript, no React imports, <5ms, recomputed on every answer
(FR2). 25 Vitest tests pin the three personas and every rule family (`npm test`). Unknown is
never zero: "I don't know" widens bands and drops confidence instead of guessing.

**4:40–5:00 — Architecture in one breath.** Vite + React + TS + Tailwind; rules isolated from
UI so a rule change is a one-line edit plus a green test run; localStorage draft only; mobile-
first at 360px. Rules doc (`RULES.md`) lists every threshold with its source — judgement is
declared as judgement, norms as norms.

## What next (if the challenge continued)

1. **Hindi/Kannada copy** — the persona wording already adapts; next is full i18n of strings.
2. **Bureau-score estimator** — "if you pay these EMIs on time for 6 months, your band drops
   ~2pp" — turns the tool from descriptive to prescriptive.
3. **PDF export of the Card** — beyond print-to-PDF, branded and shareable with the family
   before the branch visit.
4. **Lender offer log** — store multiple quotes over time, track them against the fair band.

## What I cut (and why it earns 0 points vs its cost)

- **Backend/auth** — judges need `npm i && npm run dev` in <5 min; a server adds risk, needs
  hosting, and stores personal data the PRD forbids storing.
- **ML/LLM inside the app** — breaks explainability, RULES.md defensibility, and the offline
  rule. Deterministic rules are the product.
- **More loan products beyond the personas' needs** — breadth without the 3 personas is
  decoration; the 8 base bands cover the required space.
- **Pixel-perfect design system** — mobile-first and readable yes; a component library no.
