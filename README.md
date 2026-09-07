# Borrower Copilot

**Know your verdict, max amount, fair rate and EMI ceiling — before you walk into a lender.**

A borrower self-assessment tool built for the Lokta Build Challenge. It turns lending
judgement into deterministic rules a borrower can see and a machine can run — the opposite
of a credit model. Self-reported data only: no login, no bureau pull, no backend, nothing
leaves the browser.

## Run it (<5 min)

```bash
cd borrower-copilot
npm install
npm run dev        # → http://localhost:5173
```

Requirements: Node 18+. No env vars, no API keys, no network calls at runtime.

```bash
npm test           # Vitest — 25 engine tests covering the 3 personas
npm run build      # typecheck + static build to dist/
```

## What it answers (one screen each)

| # | Output | What you get |
|---|--------|--------------|
| O1 | **Verdict** | BORROW / BORROW_LESS / DONT_BORROW + 1-sentence reason + whys citing your answers |
| O2 | **Max amount** | LenderLikelyMax (FOIR math) vs SafeMax (surplus) — clearly separated, "Use this: SafeMax" |
| O3 | **Fair rate** | Fair band + all-in APR band for your profile, every add-on disclosed |
| O4 | **EMI ceiling** | Do-not-cross monthly EMI + tenure trade-off table + −20% income / +2pp rate stress test |

Plus a printable **Negotiation Card** with a lender-quote comparator (FAIR / OVERPRICED / BELOW fair).

## Try it

- **Start my assessment** — 9 must-know questions, then an optional adaptive set
  ("I don't know" is always honest: we widen ranges instead of guessing zero).
- **Persona buttons** — one-click demo runs: Priya (→ BORROW_LESS), Ravi (→ BORROW via
  secured LAP), Anita (→ DONT_BORROW, stress FAIL). Verified outputs in [`runs/`](runs/).
- Draft auto-saves to `localStorage` (`bc-draft-v1`); **Clear data** wipes it.

## Where the rules live

The engine is pure TypeScript with zero React imports — `borrower-copilot/src/rules/`:

```
src/rules/
├── affordability.ts  # income haircuts, FOIR caps, safe surplus, route sizing (O2)
├── rates.ts          # base bands + add-ons + APR (O3)
├── verdict.ts        # BORROW / LESS / DONT triggers R-V-01..08 (O1)
├── emi.ts            # tenure table + stress wording (O4)
├── questions.ts      # M1–M9 + adaptive A1–A11 + confidence model
└── index.ts          # computeAll(answers) → Outputs  (the only UI entry point)
```

Every threshold, band and assumption is documented with its source in **[`RULES.md`](RULES.md)**
(the submission doc). If code and RULES.md disagree, RULES.md wins.

## Documentation map

| File | Purpose |
|------|---------|
| `PRD.md` | What to build — requirements, personas, acceptance |
| `archetecture.md` | How it's built — stack, folder map, data flow |
| `rules.md` | Internal rules bible (thresholds + sources) |
| `RULES.md` | Judge-facing export of rules.md |
| `runs/priya.md · ravi.md · anita.md` | Full walkthroughs of the 3 personas with real outputs |
| `walkthrough.md` | 5-minute demo script + what-next / what-cut |
| `plan.md`, `phases.md`, `reference.md`, `memory.md` | Build process docs |

## Honest about limits

- Bands are judgement + Sep-2026 industry norms, **not** bureau data — we don't know a
  lender's exact rate card.
- Unknown is never zero: "don't know" widens the band, drops confidence, and says so.
- APR approximates the processing fee amortised; GST/insurance not included (disclosed).
- Deterministic rules only — no ML, no LLM, no backend. Runs offline.
