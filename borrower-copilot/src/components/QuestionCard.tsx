// QuestionCard — renders ONE question (MUST M1–M9 or EXTRA A1–A11) with progress,
// "Why we ask" (tightens), back navigation, and honest "I don't know" (PRD FR1, §5).
import { useEffect, useState } from 'react';
import { QUESTIONS } from '../rules/questions';
import type { QId } from '../rules/questions';
import type { Answers } from '../types';
import { patchFor, patchForSecondary, readValue, readSecondary, secondaryLabel, unknownPatch } from './fields';

interface Props {
  qid: QId;
  answers: Answers;
  index: number;
  total: number;
  sectionLabel: string;
  onAnswer: (patch: Partial<Answers>) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

const numberInputCls =
  'w-full rounded-lg border border-accent/25 bg-white px-3 py-2.5 font-mono text-lg text-ink placeholder:text-ink/30 focus:border-accent';

export default function QuestionCard({ qid, answers, index, total, sectionLabel, onAnswer, onNext, onBack, onSkip }: Props) {
  const q = QUESTIONS[qid];
  const label = q.labelFor ? q.labelFor(answers) : q.label;
  const [val, setVal] = useState(() => readValue(answers, qid));
  const [val2, setVal2] = useState(() => readSecondary(answers, qid));

  // re-seed local state when moving between questions
  useEffect(() => {
    setVal(readValue(answers, qid));
    setVal2(readSecondary(answers, qid));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qid]);

  const unknown = unknownPatch(qid);
  const canAdvance = q.kind === 'choice' || q.composite ? true : val.trim() !== '';

  function commitAndNext(patch: Partial<Answers>) {
    onAnswer(patch);
    onNext();
  }

  function submitNumber() {
    if (!canAdvance) return;
    const patch = { ...patchFor(qid, val) };
    if (q.composite) Object.assign(patch, patchForSecondary(qid, val2));
    if (qid === 'A3' && Number(val) === 0) patch.highestRatePct = null;
    commitAndNext(patch);
  }

  return (
    <section aria-labelledby={`q-${qid}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs font-medium text-ink/60">
          <span>{sectionLabel}</span>
          <span>{index + 1} of {total}</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
      </div>

      <h2 id={`q-${qid}`} className="font-serif text-2xl leading-snug text-ink">{label}</h2>
      {q.help && <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{q.help}</p>}
      <p className="mt-1 text-xs font-medium text-accent/80">Why we ask: tightens {q.tightens}</p>

      <div className="mt-5 space-y-3">
        {q.kind === 'choice' && (
          <div className="grid gap-2" role="radiogroup" aria-label={label}>
            {q.options!.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={val === opt.value}
                onClick={() => setVal(opt.value)}
                className={`rounded-lg border px-4 py-3 text-left text-[15px] transition ${
                  val === opt.value
                    ? 'border-accent bg-accent-soft font-semibold text-accent'
                    : 'border-accent/20 bg-white text-ink hover:border-accent/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {q.kind === 'number' && (
          <div className="flex items-baseline gap-2">
            {(q.unit === '₹' || q.unit === '₹/mo' || q.unit === '₹ over 6m') && (
              <span className="font-serif text-2xl text-ink/50">₹</span>
            )}
            <input
              type="number"
              inputMode="numeric"
              id={`input-${qid}`}
              value={val}
              placeholder={q.placeholder}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitNumber()}
              className={numberInputCls}
              aria-label={label}
            />
            {q.unit && q.unit !== '₹' && q.unit !== '₹ over 6m' && (
              <span className="text-sm text-ink/50">{q.unit}</span>
            )}
          </div>
        )}

        {q.composite && secondaryLabel(qid) && (
          <div>
            <label htmlFor={`input-${qid}-2`} className="mb-1 block text-sm font-medium text-ink/70">
              {secondaryLabel(qid)}
            </label>
            <input
              type="number"
              inputMode="decimal"
              id={`input-${qid}-2`}
              value={val2}
              onChange={(e) => setVal2(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitNumber()}
              className={numberInputCls}
            />
          </div>
        )}
      </div>

      {/* actions */}
      <div className="mt-6 space-y-2">
        <button
          type="button"
          disabled={q.kind !== 'choice' && q.kind !== 'number' ? false : q.kind === 'choice' ? !val : !canAdvance}
          onClick={() => (q.kind === 'choice' ? commitAndNext(patchFor(qid, val)) : submitNumber())}
          className="w-full rounded-lg bg-accent px-4 py-3 font-semibold text-white transition enabled:hover:opacity-90 disabled:opacity-40"
        >
          {q.kind === 'choice' ? (val ? 'Next' : 'Pick an option') : canAdvance ? 'Next' : 'Enter a number to continue'}
        </button>

        {unknown && (
          <button
            type="button"
            onClick={() => commitAndNext(unknown.patch)}
            className="w-full rounded-lg border border-accent/25 px-4 py-2.5 text-sm font-medium text-ink/70 transition hover:border-accent hover:text-accent"
          >
            {unknown.label} — we widen ranges instead of guessing
          </button>
        )}

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="w-full px-4 py-1.5 text-xs font-medium text-ink/40 transition hover:text-ink/70"
          >
            Skip this question
          </button>
        )}

        <button
          type="button"
          onClick={onBack}
          className="w-full px-4 py-1.5 text-sm font-medium text-ink/50 transition hover:text-ink"
        >
          ← Back
        </button>
      </div>
    </section>
  );
}
