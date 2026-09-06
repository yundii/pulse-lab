# Pulse Lab

An interactive soft-body heart. It contracts on its own, stretches where you
grab it, and beats faster while you handle it.

**[Try it](https://yundii.github.io/pulse-lab/)**

## Playing with it

- Drag anywhere on the surface. Let go and the tissue keeps moving.
- Keep hold of it and the measured rate climbs above the resting rate, then
  settles once you let go.
- Three tints: arterial, venous, perfusate.
- Four controls: resting rate, contraction depth, myocardial stiffness and
  tissue damping.
- `R` or "Restore rhythm" returns the relaxed shape and resets the beat.
  Material settings are kept.
- Sliders take arrow keys, `Home` and `End`.

## Running locally

Needs Node 22.13 or newer.

```sh
npm install
npm run dev -- --port 4399
```

For a static production build:

```sh
npm run build
```

The site lands in `dist/client/` and runs off any static HTTP server. WebGPU
needs localhost or HTTPS, and falls back to WebGL2 when it is unavailable.

## How it works

`lib/soft-body.ts` is a CPU XPBD solver: 343 particles, 1,296 tetrahedral
volume constraints, plus edge elasticity, gravity, floor friction and velocity
damping. A fixed 120 Hz step is interpolated onto a finer display surface.
Barycentric coordinates from the raycast hit map the exact grab point onto
simulation particles, so dragging stretches the tissue locally instead of
scaling the whole model.

The beat scales the *rest state* by `diag(s, sy, s)` every step, driven by a
cardiac waveform — a sharp ventricular contraction, a smaller closing beat, a
long refill. Because that is one affine map of the relaxed shape, the scaled
rest lengths and rest volumes stay mutually consistent and the two constraint
families never fight each other. Squeezing is radial-dominant: the long axis
shortens about half as much as the width.

`lib/heart.ts` holds the Three.js WebGPURenderer scene — transmissive physical
node material, double-sided surface, clearcoat, light absorption, an
approximate thickness field, refracted environment light, dynamic normals and
a soft contact shadow.

`app/page.tsx` holds the controls and an optional, feature-detected WebMCP
`configure_heart` tool. There is no server-side state and no external runtime
assets.

The shape is one pure function, `restPoint()`. `docs/shape-notes.md` covers
what a cube lattice can and cannot be bent into, and the two constants that
decide whether it stays stable. Reproduce those numbers with:

```sh
node --experimental-strip-types scripts/stress.ts
```

## Credits

Built on [54singa/soft-matter-jelly-lab](https://github.com/54singa/soft-matter-jelly-lab),
which is where the XPBD solver, the transmissive material and the page layout
come from. This project replaces the jelly with an anatomy-leaning heart and
adds the beat, the rate response to handling, and the associated controls.

The upstream repository does not carry a license file, so it reserves all
rights by default. Treat this as a study built on someone else's work, and ask
the original author before putting it to any use beyond that.
