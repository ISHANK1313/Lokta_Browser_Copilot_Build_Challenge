// PersonaButtons — one-click persona prefill (PRD FR5).
import { PRIYA, RAVI, ANITA } from '../fixtures/personas';
import type { Answers } from '../types';

const PERSONAS: { name: string; a: Answers; blurb: string }[] = [
  { name: 'Priya', a: PRIYA, blurb: '29, salaried ₹1.1L, wants ₹8L wedding loan' },
  { name: 'Ravi', a: RAVI, blurb: '42, kirana store, wants ₹15L, owns shop' },
  { name: 'Anita', a: ANITA, blurb: '35, informal income, wants ₹1.5L scooter' },
];

export default function PersonaButtons({ onSelect }: { onSelect: (a: Answers) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label="Load a demo persona">
      {PERSONAS.map((p) => (
        <button
          key={p.name}
          type="button"
          onClick={() => onSelect(p.a)}
          className="rounded-lg border border-accent/20 bg-white px-3 py-2.5 text-left transition hover:border-accent hover:bg-accent-soft"
        >
          <span className="block font-semibold text-ink">{p.name}</span>
          <span className="mt-0.5 block text-xs leading-snug text-ink/60">{p.blurb}</span>
        </button>
      ))}
    </div>
  );
}
