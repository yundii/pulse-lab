// Drives the solver headlessly, with no renderer, and reports the numbers in
// docs/shape-notes.md: tetrahedron inversions, the worst cell volume seen, and
// how far the beat actually moves the body.
//
//   node --experimental-strip-types scripts/stress.ts
import { SoftBody } from '../lib/soft-body.ts';

function run(label: string, cfg: Partial<SoftBody>, grab: boolean) {
  const b = new SoftBody();
  Object.assign(b, cfg);
  let inverted = 0,
    minVol = Infinity,
    worst = 0;
  const heights: number[] = [];
  for (let step = 0; step < 2400; step++) {
    // A single-node yank, far harsher than the UI allows: the real grab is
    // spread over eight lattice nodes and its reach is clamped.
    if (grab && step === 200) {
      let id = 0,
        best = -Infinity;
      for (let i = 0; i < b.count; i++)
        if (b.p[i * 3] > best) {
          best = b.p[i * 3];
          id = i;
        }
      b.grab = {
        ids: [id],
        weights: [1],
        offset: [0, 0, 0],
        target: [b.p[id * 3] + 2.6, b.p[id * 3 + 1] + 1.4, b.p[id * 3 + 2] + 1],
        smooth: [b.p[id * 3], b.p[id * 3 + 1], b.p[id * 3 + 2]],
      };
    }
    if (grab && step === 620) b.grab = null;
    b.step(1 / 120);
    const m = b.metrics();
    if (!m.finite) {
      console.log(label, '→ NON-FINITE at step', step);
      return;
    }
    worst = Math.max(worst, m.maxStrain);
    heights.push(m.height);
    for (let t = 0; t < b.volumes.length; t++) {
      const v = b.volume([
        b.tets[t * 4] / 3,
        b.tets[t * 4 + 1] / 3,
        b.tets[t * 4 + 2] / 3,
        b.tets[t * 4 + 3] / 3,
      ]);
      if (v < 0) inverted++;
      minVol = Math.min(minVol, v);
    }
  }
  const tail = heights.slice(-720);
  const mean = tail.reduce((a, x) => a + x, 0) / tail.length;
  const swing = ((Math.max(...tail) - Math.min(...tail)) / mean) * 100;
  console.log(
    `${label.padEnd(42)} inverted=${String(inverted).padStart(5)}`,
    `minVol=${minVol.toExponential(2)} maxStrain=${worst.toFixed(2)}`,
    `beatSwing=${swing.toFixed(1)}%`,
  );
}

run('default', {}, false);
run('default + hard grab', {}, true);
run('contraction=100', { contraction: 100 }, false);
run('contraction=100 + hard grab', { contraction: 100 }, true);
run('contraction=100 firmness=0 damping=0', {
  contraction: 100,
  firmness: 0,
  damping: 0,
}, false);
run('contraction=100 firmness=100 damping=100', {
  contraction: 100,
  firmness: 100,
  damping: 100,
}, false);
run('contraction=100 rate=160 + hard grab', {
  contraction: 100,
  rate: 160,
}, true);
run('contraction=0 (arrested)', { contraction: 0 }, false);
