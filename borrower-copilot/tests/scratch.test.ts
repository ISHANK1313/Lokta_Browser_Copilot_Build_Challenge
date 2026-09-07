// Scratch validation — prints computeAll outputs for the 3 personas.
// Run: npx vitest run tests/scratch.ts  (or npx tsx)
import { describe, it } from 'vitest';
import { computeAll } from '../src/rules';
import { PRIYA, RAVI, ANITA } from '../src/fixtures/personas';
import type { Answers } from '../src/types';

function dump(name: string, a: Answers) {
  const o = computeAll(a);
  console.log(`
================ ${name} ================
O1 verdict:        ${o.o1.verdict}${o.o1.securedRoute ? ' (secured route)' : ''}
O1 reason:         ${o.o1.reason}
O1 whys:           ${JSON.stringify(o.o1.whys, null, 1)}
O2 blocked:        ${o.o2.blocked ?? false}
O2 lenderMax:      ${o.o2.lenderMax}
O2 safeMax:        ${o.o2.safeMax}
O2 routes:         ${JSON.stringify(o.o2.routes.map((r) => ({ route: r.route, lenderMax: r.lenderMax, safeMax: r.safeMax })), null, 1)}
O3 fair:           ${o.o3.fairLow}–${o.o3.fairHigh}  APR ${o.o3.aprLow}–${o.o3.aprHigh}
O3 addOns:         ${JSON.stringify(o.o3.addOns)}
O4 ceiling:        ${o.o4.ceiling}
O4 tenureTable:    ${JSON.stringify(o.o4.tenureTable)}
O4 stress:         pass=${o.o4.stress.pass} :: ${o.o4.stress.detail}
Confidence:        ${o.confidence} — ${o.confidenceWhy}
`);
}

describe('scratch validation', () => {
  it('prints persona outputs', () => {
    dump('PRIYA', PRIYA);
    dump('RAVI', RAVI);
    dump('ANITA', ANITA);
  });
});
