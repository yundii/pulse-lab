'use client';
import { useEffect, useRef, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { RotateCcw, ArrowUpRight } from 'lucide-react';
import type { HeartWorld } from '@/lib/heart';

const TINTS = [
  ['arterial', 'Arterial'],
  ['venous', 'Venous'],
  ['perfusate', 'Perfusate'],
];

export default function Home() {
  const host = useRef<HTMLDivElement>(null);
  const world = useRef<HeartWorld | null>(null);
  const [color, setColor] = useState('arterial');
  const [rate, setRate] = useState(62);
  const [contraction, setContraction] = useState(46);
  const [firmness, setFirmness] = useState(38);
  const [damping, setDamping] = useState(28);
  const [liveBpm, setLiveBpm] = useState(62);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let disposed = false;
    import('@/lib/heart')
      .then(async ({ HeartWorld }) => {
        if (disposed || !host.current) return;
        const engine = new HeartWorld(host.current);
        world.current = engine;
        await engine.init();
        if (disposed) engine.dispose();
        else setReady(true);
      })
      .catch((e) => {
        console.error(e);
        if (!disposed) {
          world.current?.dispose();
          world.current = null;
          setError(true);
        }
      });
    return () => {
      disposed = true;
      world.current?.dispose();
    };
  }, []);
  // The displayed rate is the solver's, not the slider's: handling the specimen
  // drives it above the resting rate and it settles back on its own.
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      const bpm = world.current?.bpm();
      if (bpm) setLiveBpm(bpm);
    }, 200);
    return () => clearInterval(id);
  }, [ready]);
  useEffect(() => {
    if (!ready) return;
    type ToolContext = {
      registerTool(
        tool: {
          name: string;
          title: string;
          description: string;
          inputSchema: object;
          annotations: object;
          execute(input: unknown): Promise<object>;
        },
        options: { signal: AbortSignal },
      ): void | Promise<void>;
    };
    const context = (document as Document & { modelContext?: ToolContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const ranges: Record<string, [number, number]> = {
      rate: [40, 160],
      contraction: [0, 100],
      firmness: [0, 100],
      damping: [0, 100],
    };
    const apply: Record<string, (n: number) => void> = {
      rate: (n) => {
        setRate(n);
        world.current?.setRate(n);
      },
      contraction: (n) => {
        setContraction(n);
        world.current?.setContraction(n);
      },
      firmness: (n) => {
        setFirmness(n);
        world.current?.setFirmness(n);
      },
      damping: (n) => {
        setDamping(n);
        world.current?.setDamping(n);
      },
    };
    const tints = TINTS.map(([id]) => id);
    const tool = {
      name: 'configure_heart',
      title: 'Configure heart',
      description:
        'Set the specimen tint, resting rate, contraction depth, myocardial stiffness and tissue damping, or restore the relaxed shape. Updates the visible controls.',
      inputSchema: {
        type: 'object',
        properties: {
          color: { type: 'string', enum: tints },
          rate: { type: 'number', minimum: 40, maximum: 160 },
          contraction: { type: 'number', minimum: 0, maximum: 100 },
          firmness: { type: 'number', minimum: 0, maximum: 100 },
          damping: { type: 'number', minimum: 0, maximum: 100 },
          reset: { type: 'boolean' },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input: unknown) {
        if (!input || typeof input !== 'object' || Array.isArray(input))
          throw new Error('Expected a settings object.');
        const data = input as Record<string, unknown>;
        const known = [...Object.keys(ranges), 'color', 'reset'];
        if (Object.keys(data).some((k) => !known.includes(k)))
          throw new Error('Unknown setting.');
        if (data.color !== undefined && !tints.includes(data.color as string))
          throw new Error(`Choose ${tints.join(', ')}.`);
        for (const [key, [lo, hi]] of Object.entries(ranges))
          if (
            data[key] !== undefined &&
            (typeof data[key] !== 'number' ||
              !Number.isFinite(data[key]) ||
              (data[key] as number) < lo ||
              (data[key] as number) > hi)
          )
            throw new Error(`${key} must be a number from ${lo} to ${hi}.`);
        if (data.reset !== undefined && typeof data.reset !== 'boolean')
          throw new Error('Reset must be a boolean.');
        if (data.color !== undefined) {
          setColor(data.color as string);
          world.current?.setColor(data.color as string);
        }
        for (const key of Object.keys(ranges))
          if (data[key] !== undefined) apply[key](data[key] as number);
        if (data.reset) world.current?.reset();
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        return { updated: true, ...data };
      },
    };
    try {
      void Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {
      /* Optional browser API. */
    }
    return () => lifecycle.abort();
  }, [ready]);
  const reset = () => {
    world.current?.reset();
  };
  return (
    <main className="laboratory">
      <div
        ref={host}
        className="scene"
        aria-label="Interactive 3D heart, beating on its own. Drag any point on its surface to stretch it."
      />
      <header className="masthead">
        <p className="eyebrow">
          SOFT TISSUE STUDIES <span>/</span> NO. 001
        </p>
        <h1>
          Pulse
          <br />
          <em>Lab.</em>
        </h1>
        <p className="intro">
          A little gravity.
          <br />A little light.
          <br />A solid that refuses to sit still.
        </p>
      </header>
      <div className="live">
        <i /> BEATING SPECIMEN
      </div>
      {!ready && (
        <output className="loading" aria-live="polite">
          {error
            ? 'Unable to start the 3D scene. Please reload in a browser with graphics enabled.'
            : 'Warming the specimen…'}
        </output>
      )}
      <aside className="controls" aria-label="Specimen controls">
        <div className="panel-head">
          <h2>THE SPECIMEN</h2>
          <span>01 — MYOCARDIUM</span>
        </div>
        <div className="swatches" aria-label="Tint">
          {TINTS.map(([id, label]) => (
            <button
              key={id}
              disabled={!ready}
              aria-pressed={color === id}
              className={`swatch ${id} ${color === id ? 'selected' : ''}`}
              onClick={() => {
                setColor(id);
                world.current?.setColor(id);
              }}
            >
              <i />
              {label}
            </button>
          ))}
        </div>
        <div className="setting">
          <div className="setting-label">
            <span id="rate-label">Resting rate</span>
            <output>
              {rate} <small>bpm</small>
            </output>
          </div>
          <Slider
            disabled={!ready}
            aria-labelledby="rate-label"
            min={40}
            max={160}
            value={[rate]}
            onValueChange={(v) => {
              const n = Array.isArray(v) ? v[0] : v;
              setRate(n);
              world.current?.setRate(n);
            }}
          />
          <div className="range-ends">
            <span>Calm</span>
            <span>Racing</span>
          </div>
        </div>
        <div className="setting">
          <div className="setting-label">
            <span id="contraction-label">Contraction</span>
            <output>
              {contraction} <small>%</small>
            </output>
          </div>
          <Slider
            disabled={!ready}
            aria-labelledby="contraction-label"
            min={0}
            max={100}
            value={[contraction]}
            onValueChange={(v) => {
              const n = Array.isArray(v) ? v[0] : v;
              setContraction(n);
              world.current?.setContraction(n);
            }}
          />
          <div className="range-ends">
            <span>Arrested</span>
            <span>Full</span>
          </div>
        </div>
        <div className="setting">
          <div className="setting-label">
            <span id="firmness-label">Myocardial stiffness</span>
            <output>
              {(0.4 + firmness * 0.025).toFixed(2)} <small>kPa</small>
            </output>
          </div>
          <Slider
            disabled={!ready}
            aria-labelledby="firmness-label"
            min={0}
            max={100}
            value={[firmness]}
            onValueChange={(v) => {
              const n = Array.isArray(v) ? v[0] : v;
              setFirmness(n);
              world.current?.setFirmness(n);
            }}
          />
          <div className="range-ends">
            <span>Soft</span>
            <span>Rigid</span>
          </div>
        </div>
        <div className="setting">
          <div className="setting-label">
            <span id="damping-label">Tissue damping</span>
            <output>
              {(0.5 + damping * 0.055).toFixed(1)} <small>s⁻¹</small>
            </output>
          </div>
          <Slider
            disabled={!ready}
            aria-labelledby="damping-label"
            min={0}
            max={100}
            value={[damping]}
            onValueChange={(v) => {
              const n = Array.isArray(v) ? v[0] : v;
              setDamping(n);
              world.current?.setDamping(n);
            }}
          />
          <div className="range-ends">
            <span>Wobbly</span>
            <span>Calm</span>
          </div>
        </div>
        <button className="reset" onClick={reset}>
          <RotateCcw size={14} strokeWidth={1.5} /> Restore rhythm{' '}
          <span>R</span>
        </button>
        <p className="panel-note">
          A small study in softness.
          <ArrowUpRight size={12} />
        </p>
      </aside>
      <footer className="footnote">
        <p>Take hold. Let go.</p>
        <span>Drag the heart. It will beat faster.</span>
        <div className="spec">
          <div>
            {Math.round(liveBpm)} <small>bpm</small>
            <span>MEASURED</span>
          </div>
          <div>
            343 <small>pts</small>
            <span>LATTICE</span>
          </div>
          <div>
            01<span>SPECIMEN</span>
          </div>
        </div>
      </footer>
      <div className="colophon">A LITTLE PLAY, A LITTLE PHYSIOLOGY.</div>
    </main>
  );
}
