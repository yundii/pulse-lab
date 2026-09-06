# Shaping a heart on a cube lattice

The solver simulates a 7×7×7 grid of particles — a cube, topologically. Every
shape in this project is that cube pushed around by one pure function,
`restPoint()` in `lib/soft-body.ts`. The physics cage and the display surface
are both fed through it, which is why the visible skin can never drift away
from the simulated volume.

That single map is cheap to change and it is where all the shape work happens.
It also imposes the hard limits.

## What the topology allows

The cage is a deformed cube, so it is genus 0 with no branches:

- Fine: rounded, convex-ish bodies — droplets, blobs, eggs, this heart.
- Workable: shallow concavities, like the cleft between the two lobes.
- Impossible: holes (a torus), separate parts, thin branches, letters. The
  lattice self-intersects and the solver is handed inverted tetrahedra.

## Two settings that decide whether it is stable

**`SHELL` — the p-norm exponent for the cube→ball step.** Lower is rounder, but
it also crushes the eight cube corners, and crushed corner cells are the first
thing to invert. Measured over a 2400-step run with a deliberately brutal
single-node pull:

| `SHELL` | degenerate tets at rest | inversions under load | min tet volume |
| ------- | ----------------------- | --------------------- | -------------- |
| 2.4     | 1                       | 9                     | -1.0e-5        |
| 3.2     | 1                       | 0                     | 8.3e-7         |
| **4.2** | **0**                   | **0**                 | **1.3e-4**     |
| 5.5     | 0                       | 0                     | 2.4e-4         |
| 7.0     | 0                       | 0                     | 2.4e-4         |

4.2 is the roundest exponent that is completely clean, so that is what ships.
Below 4 the shape looks better and the corners pay for it.

**The apex taper floor (`0.36`).** Tapering the ventricles to an actual point
would collapse the whole bottom cap of the lattice onto the long axis. The
floor keeps the apex blunt. Raising it does not help stability — the thin
tetrahedra live in the cube corners, not at the apex, which is worth knowing
before spending time tuning the wrong number.

## Known residual

At `contraction = 100` combined with an extreme stiffness or damping setting,
a handful of tetrahedra per few million samples momentarily reach a volume
around -1e-5, against a median cell volume of 4.4e-3 — roughly 0.2% of a cell.
The volume constraint pulls them straight back, the simulation stays finite,
and nothing is visible on screen. Tightening it further would only mean
narrowing the slider ranges, which is not worth it.

## Reproducing the numbers

The tables above come from driving the solver headlessly, with no renderer:

```sh
node --experimental-strip-types scripts/stress.ts
```
