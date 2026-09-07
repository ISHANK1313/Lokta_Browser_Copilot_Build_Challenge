// App — step router (archetecture.md §6): Welcome → MUST wizard → interim results →
// adaptive EXTRA → Results → Negotiation Card. Draft persists to localStorage (FR6);
// everything recomputes live via useMemo (FR2). Mobile-first (FR7).
import { useEffect, useMemo, useState } from 'react';
import type { Answers } from './types';
import { emptyAnswers } from './types';
import { computeAll, MUST_ORDER, nextQuestions } from './rules';
import type { QId } from './rules';
import { fmtInr, fmtPctBand } from './rules/format';
import QuestionCard from './components/QuestionCard';
import Results from './components/Results';
import NegotiationCard from './components/NegotiationCard';
import PersonaButtons from './components/PersonaButtons';
import ConfidenceBadge from './components/ConfidenceBadge';

type View = 'welcome' | 'must' | 'interim' | 'extra' | 'results' | 'card';

const DRAFT_KEY = 'bc-draft-v1';

interface Draft {
  answers: Answers;
  mustIndex: number;
}

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    if (!d || typeof d !== 'object' || !d.answers) return null;
    return d;
  } catch {
    return null;
  }
}

export default function App() {
  const restored = useMemo(loadDraft, []);
  const [answers, setAnswers] = useState<Answers>(restored?.answers ?? emptyAnswers);
  const [view, setView] = useState<View>('welcome');
  const [mustIndex, setMustIndex] = useState(0);
  const [extraQueue, setExtraQueue] = useState<QId[]>([]);
  const [extraIndex, setExtraIndex] = useState(0);
  const hasDraft = restored != null && restored.answers.purpose != null;

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, mustIndex }));
    } catch {
      /* storage full/blocked — app still works, just no draft */
    }
  }, [answers, mustIndex]);

  const outputs = useMemo(() => computeAll(answers), [answers]);

  // ---------- navigation ----------
  const startFresh = () => {
    setAnswers(emptyAnswers);
    setMustIndex(0);
    setView('must');
  };
  const resume = () => {
    if (restored) setMustIndex(restored.mustIndex ?? 0);
    setView('must');
  };
  const loadPersona = (a: Answers) => {
    setAnswers(a);
    setView('results');
    window.scrollTo(0, 0);
  };
  const goExtra = () => {
    setExtraQueue(nextQuestions(answers));
    setExtraIndex(0);
    setView('extra');
  };
  const patch = (p: Partial<Answers>) => setAnswers((prev) => ({ ...prev, ...p }));
  const clearData = () => {
    localStorage.removeItem(DRAFT_KEY);
    setAnswers(emptyAnswers);
    setMustIndex(0);
    setView('welcome');
  };
  const scrollToTop = () => window.scrollTo(0, 0);

  const mustQid = MUST_ORDER[Math.min(mustIndex, MUST_ORDER.length - 1)];
  const extraQid = extraQueue[Math.min(extraIndex, Math.max(0, extraQueue.length - 1))];
  const inWizard = view === 'must' || view === 'extra';
  const progress =
    view === 'must'
      ? mustIndex / MUST_ORDER.length
      : view === 'extra'
        ? (extraIndex + 1) / (extraQueue.length + 1)
        : 0;

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* ---------- header ---------- */}
      <header className="no-print sticky top-0 z-10 border-b border-accent/10 bg-paper/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <button type="button" onClick={() => setView('welcome')} className="text-left">
            <span className="font-serif text-lg font-semibold leading-none text-ink">Borrower Copilot</span>
            <span className="block text-[11px] text-ink/50">Walk in knowing your number</span>
          </button>
          {(answers.purpose != null || view !== 'welcome') && (
            <button
              type="button"
              onClick={clearData}
              className="text-xs font-medium text-ink/40 underline-offset-2 transition hover:text-red-700 hover:underline"
            >
              Clear data
            </button>
          )}
        </div>
        {inWizard && (
          <div className="mx-auto mt-2 h-1 max-w-md overflow-hidden rounded-full bg-stone-200">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
        )}
      </header>

      <main className="mx-auto max-w-md px-4 py-5 pb-16">
        {/* ---------- welcome ---------- */}
        {view === 'welcome' && (
          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-3xl font-semibold leading-tight text-ink">
                Know your verdict, max amount, fair rate and EMI ceiling — before you walk into a lender.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-ink/60">
                Answer 9 quick questions (plus a few optional ones) and get a one-page Negotiation Card.
                Self-reported only — no login, no data leaves this device. &quot;Don&apos;t know&quot; is always an
                honest answer: we widen the range instead of guessing.
              </p>
            </div>
            <button
              type="button"
              onClick={startFresh}
              className="w-full rounded-lg bg-accent px-4 py-3.5 font-semibold text-white transition hover:opacity-90"
            >
              Start my assessment →
            </button>
            {hasDraft && (
              <button
                type="button"
                onClick={resume}
                className="w-full rounded-lg border border-accent/25 bg-white px-4 py-2.5 text-sm font-medium text-ink/70 transition hover:border-accent hover:text-accent"
              >
                Resume my draft
              </button>
            )}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">Or try a demo persona</p>
              <PersonaButtons onSelect={loadPersona} />
            </div>
          </div>
        )}

        {/* ---------- MUST wizard ---------- */}
        {view === 'must' && (
          <QuestionCard
            key={mustQid}
            qid={mustQid}
            answers={answers}
            index={mustIndex}
            total={MUST_ORDER.length}
            sectionLabel="The 9 must-knows"
            onAnswer={patch}
            onNext={() => {
              scrollToTop();
              if (mustIndex < MUST_ORDER.length - 1) setMustIndex(mustIndex + 1);
              else setView('interim');
            }}
            onBack={() => {
              scrollToTop();
              if (mustIndex > 0) setMustIndex(mustIndex - 1);
              else setView('welcome');
            }}
          />
        )}

        {/* ---------- interim results ---------- */}
        {view === 'interim' && (
          <div className="space-y-5">
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-accent/10">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Early read — wide ranges on purpose</p>
              <p
                className={`mt-2 inline-block rounded-lg px-3 py-1.5 font-serif text-xl font-semibold text-white ${
                  outputs.o1.verdict === 'BORROW' ? 'bg-emerald-600' : outputs.o1.verdict === 'BORROW_LESS' ? 'bg-amber-500' : 'bg-red-600'
                }`}
              >
                {outputs.o1.verdict.replace('_', ' ')}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink">{outputs.o1.reason}</p>
              {!outputs.o2.blocked && (
                <div className="mt-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-paper px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/50">Lender likely</p>
                      <p className="font-mono text-lg">{fmtInr(outputs.o2.lenderMax)}</p>
                    </div>
                    <div className="rounded-lg bg-paper px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/50">Safe</p>
                      <p className="font-mono text-lg font-semibold text-emerald-700">{fmtInr(outputs.o2.safeMax)}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-ink/50">
                    Fair rate {fmtPctBand(outputs.o3.fairLow, outputs.o3.fairHigh)} · EMI ceiling {fmtInr(outputs.o4.ceiling)}/mo
                  </p>
                </div>
              )}
              <div className="mt-3">
                <ConfidenceBadge level={outputs.confidence} why={outputs.confidenceWhy} />
              </div>
            </div>
            <button
              type="button"
              onClick={goExtra}
              className="w-full rounded-lg bg-accent px-4 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Tighten my numbers — {nextQuestions(answers).length} quick extra questions →
            </button>
            <button
              type="button"
              onClick={() => setView('results')}
              className="w-full px-4 py-1.5 text-sm font-medium text-ink/50 transition hover:text-ink"
            >
              Skip — show me the full results as-is
            </button>
          </div>
        )}


        {/* ---------- adaptive EXTRA wizard ---------- */}
        {view === 'extra' && extraQueue.length > 0 && extraQid && (
          <QuestionCard
            key={extraQid}
            qid={extraQid}
            answers={answers}
            index={extraIndex}
            total={extraQueue.length}
            sectionLabel="Optional — tightens your numbers"
            onAnswer={patch}
            onNext={() => {
              scrollToTop();
              if (extraIndex < extraQueue.length - 1) setExtraIndex(extraIndex + 1);
              else setView('results');
            }}
            onSkip={() => {
              scrollToTop();
              if (extraIndex < extraQueue.length - 1) setExtraIndex(extraIndex + 1);
              else setView('results');
            }}
            onBack={() => {
              scrollToTop();
              if (extraIndex > 0) setExtraIndex(extraIndex - 1);
              else setView('interim');
            }}
          />
        )}

        {/* ---------- full results ---------- */}
        {view === 'results' && (
          <Results
            o={outputs}
            onOpenCard={() => {
              setView('card');
              scrollToTop();
            }}
            onEdit={() => {
              setMustIndex(0);
              setView('must');
              scrollToTop();
            }}
          />
        )}

        {/* ---------- negotiation card ---------- */}
        {view === 'card' && (
          <NegotiationCard
            o={outputs}
            offerRatePct={answers.offerRatePct ?? null}
            offerFeePct={answers.offerFeePct ?? null}
            onBack={() => {
              setView('results');
              scrollToTop();
            }}
          />
        )}
      </main>

      <footer className="no-print border-t border-accent/10 px-4 py-4 text-center">
        <p className="mx-auto max-w-md text-[11px] leading-snug text-ink/40">
          Deterministic rules, no ML, no backend. Everything stays in this browser until you clear it.
          Not financial advice — bands are honest estimates from self-reported inputs.
        </p>
      </footer>
    </div>
  );
}

