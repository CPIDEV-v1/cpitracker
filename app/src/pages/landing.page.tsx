/**
 * Landing Page — CPITracker v2
 *
 * Premium terminal aesthetic with:
 * - Animated circuit grid background with glowing nodes
 * - Mouse-tracking spotlight on hero
 * - Glitch text effect
 * - Data flow particles on CPI tree edges
 * - Bento grid features
 * - Scan line CRT overlay
 * - Dramatic typography
 */

import { useEffect, useRef, useCallback, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './landing.page.module.css';

/* ------------------------------------------------------------------ */
/*  Circuit Grid Canvas                                               */
/* ------------------------------------------------------------------ */

function CircuitGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d')!;
    let animId: number;
    const spacing = 50;
    let dots: { x: number; y: number; pulse: number; speed: number }[] = [];
    // Spatial grid for fast neighbor lookups
    let cellMap: Map<string, typeof dots> = new Map();

    function cellKey(cx: number, cy: number) { return `${cx},${cy}`; }

    function resize() {
      cvs!.width = window.innerWidth;
      cvs!.height = window.innerHeight;
      dots = [];
      cellMap = new Map();
      for (let x = spacing / 2; x < cvs!.width; x += spacing) {
        for (let y = spacing / 2; y < cvs!.height; y += spacing) {
          const dot = { x, y, pulse: Math.random() * Math.PI * 2, speed: 0.008 + Math.random() * 0.015 };
          dots.push(dot);
          const key = cellKey(Math.floor(x / spacing), Math.floor(y / spacing));
          if (!cellMap.has(key)) cellMap.set(key, []);
          cellMap.get(key)!.push(dot);
        }
      }
    }

    resize();
    window.addEventListener('resize', resize);

    const RADIUS = 200;

    function draw() {
      ctx.clearRect(0, 0, cvs!.width, cvs!.height);

      // Mouse position — direct clientX/Y since canvas is position:fixed
      const mx = mouse.current.x;
      const my = mouse.current.y;

      // Pre-calc: which dots are near mouse
      for (const dot of dots) {
        dot.pulse += dot.speed;
        const dx = dot.x - mx;
        const dy = dot.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const proximity = Math.max(0, 1 - dist / RADIUS);

        // Connection lines — only for dots near mouse
        if (proximity > 0.05) {
          const cx = Math.floor(dot.x / spacing);
          const cy = Math.floor(dot.y / spacing);
          // Check direct neighbors in grid
          for (let nx = cx - 1; nx <= cx + 1; nx++) {
            for (let ny = cy - 1; ny <= cy + 1; ny++) {
              const neighbors = cellMap.get(cellKey(nx, ny));
              if (!neighbors) continue;
              for (const other of neighbors) {
                if (other === dot) continue;
                const d2 = Math.hypot(dot.x - other.x, dot.y - other.y);
                if (d2 <= spacing * 1.5) {
                  const lineAlpha = proximity * 0.2;
                  ctx.beginPath();
                  ctx.moveTo(dot.x, dot.y);
                  ctx.lineTo(other.x, other.y);
                  ctx.strokeStyle = `rgba(0, 255, 136, ${lineAlpha})`;
                  ctx.lineWidth = proximity > 0.5 ? 1 : 0.5;
                  ctx.stroke();
                }
              }
            }
          }
        }

        // Dot glow halo
        if (proximity > 0.3) {
          const glowSize = 4 + proximity * 10;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, glowSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 255, 136, ${proximity * 0.06})`;
          ctx.fill();
        }

        // Dot itself
        const baseBright = 0.03 + Math.sin(dot.pulse) * 0.015;
        const brightness = baseBright + proximity * 0.7;
        const dotSize = proximity > 0.4 ? 1.5 + proximity * 1.5 : 1;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 136, ${brightness})`;
        ctx.fill();
      }

      // Central glow around cursor
      if (mx > 0) {
        const gradient = ctx.createRadialGradient(mx, my, 0, mx, my, RADIUS * 0.6);
        gradient.addColorStop(0, 'rgba(0, 255, 136, 0.04)');
        gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
        ctx.beginPath();
        ctx.arc(mx, my, RADIUS * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    draw();

    function handleMouse(e: MouseEvent) {
      mouse.current = { x: e.clientX, y: e.clientY };
    }
    window.addEventListener('mousemove', handleMouse);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.gridCanvas} />;
}

/* ------------------------------------------------------------------ */
/*  Animated CPI Tree with data flow                                  */
/* ------------------------------------------------------------------ */

const NODES = [
  { id: 'tx',       label: 'Transaction',     x: 260, y: 20,  color: '#00ff88' },
  { id: 'jupiter',  label: 'Jupiter v6',      x: 120, y: 100, color: '#00ccff' },
  { id: 'system',   label: 'System Program',  x: 400, y: 100, color: '#ffaa00' },
  { id: 'raydium',  label: 'Raydium AMM',     x: 30,  y: 185, color: '#ff6688' },
  { id: 'token',    label: 'Token Program',   x: 200, y: 185, color: '#aa88ff' },
  { id: 'orca',     label: 'Orca Whirlpool',  x: 400, y: 185, color: '#00ddcc' },
  { id: 'spl',      label: 'SPL Transfer',    x: 30,  y: 265, color: '#ff88cc' },
  { id: 'mint',     label: 'Mint To',         x: 200, y: 265, color: '#88ff88' },
];
const EDGES = [
  ['tx','jupiter'], ['tx','system'], ['jupiter','raydium'],
  ['jupiter','token'], ['system','orca'], ['raydium','spl'], ['token','mint'],
];

function CpiTree() {
  const [visible, setVisible] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timers = NODES.map((n, i) =>
      setTimeout(() => setVisible(prev => new Set([...prev, n.id])), i * 80 + 200)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const nm = Object.fromEntries(NODES.map(n => [n.id, n]));

  return (
    <svg viewBox="0 0 530 310" className={styles.treeSvg}>
      <defs>
        <filter id="nodeGlow">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {EDGES.map(([f, t], i) => {
          const from = nm[f], to = nm[t];
          return (
            <linearGradient key={i} id={`eg${i}`} x1={from.x+50} y1={from.y+16} x2={to.x+50} y2={to.y+16} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={from.color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={to.color} stopOpacity="0.6" />
            </linearGradient>
          );
        })}
      </defs>

      {/* Edges with data flow particles */}
      {EDGES.map(([f, t], i) => {
        const from = nm[f], to = nm[t];
        const vis = visible.has(f) && visible.has(t);
        return (
          <g key={`${f}-${t}`}>
            <line
              x1={from.x+50} y1={from.y+28} x2={to.x+50} y2={to.y}
              stroke={vis ? `url(#eg${i})` : '#1a2230'}
              strokeWidth={vis ? 1.5 : 0.5}
              opacity={vis ? 1 : 0.3}
            />
            {/* Data flow particle */}
            {vis && (
              <circle r="2.5" fill={to.color} filter="url(#nodeGlow)">
                <animateMotion
                  dur={`${1.5 + i * 0.3}s`}
                  repeatCount="indefinite"
                  path={`M${from.x+50},${from.y+28} L${to.x+50},${to.y}`}
                />
                <animate attributeName="opacity" values="0;1;1;0" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {NODES.map(n => {
        const vis = visible.has(n.id);
        return (
          <g key={n.id} opacity={vis ? 1 : 0} style={{ transition: 'opacity 0.5s' }}>
            {/* Glow backdrop */}
            <rect x={n.x-2} y={n.y-2} width={104} height={32} rx={6}
              fill="none" stroke={n.color} strokeWidth={0.5} opacity={0.2}
              filter="url(#nodeGlow)" />
            {/* Main rect */}
            <rect x={n.x} y={n.y} width={100} height={28} rx={5}
              fill="#0d1117" stroke={n.color} strokeWidth={1.2} />
            {/* Status dot */}
            <circle cx={n.x+10} cy={n.y+14} r={2.5} fill={n.color}>
              <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite" />
            </circle>
            {/* Label */}
            <text x={n.x+50} y={n.y+18} textAnchor="middle" fill={n.color}
              fontSize={9} fontFamily="JetBrains Mono, monospace" fontWeight={500}>
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Scroll-triggered fade-in                                          */
/* ------------------------------------------------------------------ */

function FadeIn({ children, className = '', delay = 0, direction = 'up' }: {
  children: ReactNode; className?: string; delay?: number;
  direction?: 'up' | 'left' | 'right';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fallback = setTimeout(() => setVis(true), 3000 + delay);
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        clearTimeout(fallback);
        setTimeout(() => setVis(true), delay);
        obs.unobserve(el);
      }
    }, { threshold: 0.08, rootMargin: '60px' });
    obs.observe(el);
    return () => { clearTimeout(fallback); obs.disconnect(); };
  }, [delay]);

  const dirClass = direction === 'left' ? styles.fadeFromLeft
    : direction === 'right' ? styles.fadeFromRight : styles.fadeFromUp;

  return (
    <div ref={ref} className={`${className} ${vis ? styles.fadeVisible : dirClass}`}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Glitch title                                                      */
/* ------------------------------------------------------------------ */

function GlitchTitle() {
  return (
    <h1 className={styles.glitchWrap}>
      <span className={styles.glitchText} data-text="CPITracker">CPITracker</span>
    </h1>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats counter                                                     */
/* ------------------------------------------------------------------ */

function Counter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        (function tick(now: number) {
          const p = Math.min((now - t0) / duration, 1);
          setVal(Math.floor((1 - Math.pow(1 - p, 3)) * end));
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      }
    }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ------------------------------------------------------------------ */
/*  Terminal Demo                                                     */
/* ------------------------------------------------------------------ */

const LINES = [
  { t: '$ cpitracker analyze 5xK9m...7pQz', c: '#00ff88' },
  { t: '' },
  { t: '  [1/3] Fetching transaction from Helius RPC...', c: '#556b6a' },
  { t: '  [2/3] Parsing 7 inner instructions...', c: '#556b6a' },
  { t: '  [3/3] Resolving 5 program IDs...', c: '#556b6a' },
  { t: '' },
  { t: '  ╔═══════════════════════════════════════════════╗', c: '#1e2a38' },
  { t: '  ║  Transaction   5xK9m...7pQz                  ║', c: '#88aa99' },
  { t: '  ║  Status        ✓ Success                     ║', c: '#00ff88' },
  { t: '  ║  Slot          287,432,198                    ║', c: '#88aa99' },
  { t: '  ║  Compute       68,242 / 200,000 CU           ║', c: '#ffaa00' },
  { t: '  ║  Fee           0.000005 SOL                   ║', c: '#88aa99' },
  { t: '  ╚═══════════════════════════════════════════════╝', c: '#1e2a38' },
  { t: '' },
  { t: '  CPI Call Tree (7 instructions, 3 levels deep):', c: '#00ccff' },
  { t: '' },
  { t: '  ┌─ Jupiter v6 Aggregator              28,140 CU', c: '#00ccff' },
  { t: '  │  ├─ Raydium AMM: swap               18,320 CU', c: '#ff6688' },
  { t: '  │  │  └─ Token Program: transfer        4,200 CU', c: '#aa88ff' },
  { t: '  │  └─ Orca Whirlpool: swap             12,480 CU', c: '#00ddcc' },
  { t: '  │     └─ Token Program: transfer        4,200 CU', c: '#aa88ff' },
  { t: '  └─ System Program: transfer               902 CU', c: '#ffaa00' },
  { t: '' },
  { t: '  Account Diffs:', c: '#88ff88' },
  { t: '  ┌─ 7xK...mPq  SOL   -2.500000000', c: '#ff4444' },
  { t: '  ├─ 3nR...vBz  USDC  +142.800000', c: '#00ff88' },
  { t: '  ├─ Pool Vault  SOL   +2.487500000', c: '#00ff88' },
  { t: '  └─ Fee Acct    SOL   +0.012500000', c: '#ffaa00' },
];

function TerminalDemo() {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        LINES.forEach((_, i) => {
          setTimeout(() => setCount(i + 1), i * 120);
        });
      }
    }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={styles.terminal}>
      <div className={styles.termBar}>
        <div className={styles.termDots}>
          <span style={{ background: '#ff5f56' }} />
          <span style={{ background: '#ffbd2e' }} />
          <span style={{ background: '#27c93f' }} />
        </div>
        <span className={styles.termTitle}>cpitracker — analysis session</span>
      </div>
      <div className={styles.termBody}>
        {LINES.slice(0, count).map((line, i) => (
          <div key={i} className={styles.termLine} style={{ color: line.c || '#88aa99' }}>
            {line.t || '\u00A0'}
          </div>
        ))}
        {count < LINES.length && <span className={styles.termCursor}>▊</span>}
        {count >= LINES.length && (
          <div className={styles.termDone}>
            <span style={{ color: '#00ff88' }}>  ✓ Analysis complete — 0.8s</span>
          </div>
        )}
      </div>
      <div className={styles.scanlines} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature data                                                      */
/* ------------------------------------------------------------------ */

const BENTO = [
  { title: 'CPI Call Tree',     desc: 'Interactive D3 tree with collapsible nodes, color-coded by program. Click to explore any branch.',                 icon: '⟠', span: 'wide' },
  { title: 'Account Diffs',     desc: 'Every SOL and token balance change, side-by-side.',                                                                icon: '◈', span: 'normal' },
  { title: 'Compute Breakdown', desc: 'See which CPI eats your CU budget.',                                                                              icon: '⬡', span: 'normal' },
  { title: 'Program Resolver',  desc: 'Auto-identifies Jupiter, Raydium, Orca, Drift, Marinade, Phoenix, Tensor, and more. No config needed.',            icon: '⟁', span: 'normal' },
  { title: 'Devnet + Mainnet',  desc: 'One-click network switch. Debug production txs or test locally.',                                                  icon: '◉', span: 'normal' },
  { title: 'Zero Config',       desc: 'Paste a signature and go. No setup, no login, no API keys. Terminal-native experience for developers who ship.',   icon: '⏣', span: 'wide' },
];

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */

export function LandingPage() {
  const navigate = useNavigate();
  const [sig, setSig] = useState('');

  const goApp = useCallback(() => navigate('/app'), [navigate]);
  const goAnalyze = useCallback(() => {
    navigate(sig.trim().length >= 80 ? `/tx/${sig.trim()}` : '/app');
  }, [sig, navigate]);

  return (
    <div className={styles.page}>
      <CircuitGrid />
      <div className={styles.scanOverlay} />

      {/* ===================== NAV ===================== */}
      <nav className={styles.topNav}>
        <div className={styles.navLogo}><span className={styles.accent}>&gt;_</span> CPITracker</div>
        <div className={styles.navLinks}>
          <a href="https://github.com/nickmura/cpitracker" target="_blank" rel="noopener noreferrer">GitHub</a>
          <button className={styles.navBtn} onClick={goApp}>Launch App</button>
        </div>
      </nav>

      {/* ===================== HERO ===================== */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.badge}><span className={styles.badgeDot} />Built for Solana Devs</div>
          <GlitchTitle />
          <p className={styles.heroTagline}>
            See every cross-program invocation.<br />
            <span className={styles.dim}>Trace the call tree. Inspect account diffs. Debug faster.</span>
          </p>
          <div className={styles.searchBar}>
            <span className={styles.prompt}>$</span>
            <input
              className={styles.searchInput}
              placeholder="Paste any transaction signature..."
              value={sig}
              onChange={e => setSig(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && goAnalyze()}
              spellCheck={false}
            />
            <button className={styles.searchBtn} onClick={goAnalyze}>analyze</button>
          </div>
          <div className={styles.heroActions}>
            <button className={styles.ghostBtn} onClick={goApp}>Open Dashboard →</button>
            <span className={styles.heroHint}>Works with devnet & mainnet</span>
          </div>
        </div>
        <div className={styles.heroRight}>
          <div className={styles.treeFrame}>
            <div className={styles.treeFrameLabel}>&gt; live CPI preview</div>
            <CpiTree />
          </div>
        </div>
      </section>

      {/* ===================== STATS ===================== */}
      <section className={styles.stats}>
        {[
          { val: <Counter end={10} suffix="+" />, label: 'Programs\nDecoded' },
          { val: <Counter end={200} suffix="K" />, label: 'Max Compute\nUnits' },
          { val: '2', label: 'Networks\nSupported' },
          { val: '<3s', label: 'Analysis\nTime' },
          { val: '7', label: 'CPI Levels\nDeep' },
        ].map((s, i) => (
          <div key={i} className={styles.statCard}>
            <span className={styles.statVal}>{s.val}</span>
            <span className={styles.statLbl}>{s.label}</span>
          </div>
        ))}
      </section>

      {/* ===================== BENTO FEATURES ===================== */}
      <section className={styles.bentoSection}>
        <FadeIn>
          <p className={styles.sectionTag}>// features</p>
          <h2 className={styles.sectionH2}>Everything you need to<br /><span className={styles.accent}>debug a transaction.</span></h2>
        </FadeIn>
        <div className={styles.bentoGrid}>
          {BENTO.map((b, i) => (
            <FadeIn key={b.title} delay={i * 60}
              className={`${styles.bentoCard} ${b.span === 'wide' ? styles.bentoWide : ''}`}
              direction={i % 2 === 0 ? 'left' : 'right'}>
              <div className={styles.bentoIcon}>{b.icon}</div>
              <h3 className={styles.bentoTitle}>{b.title}</h3>
              <p className={styles.bentoDesc}>{b.desc}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ===================== DEMO ===================== */}
      <section className={styles.demoSection}>
        <FadeIn>
          <p className={styles.sectionTag}>// live demo</p>
          <h2 className={styles.sectionH2}>A Jupiter swap,<br /><span className={styles.accent}>dissected.</span></h2>
        </FadeIn>
        <FadeIn delay={200}>
          <TerminalDemo />
        </FadeIn>
      </section>

      {/* ===================== HOW ===================== */}
      <section className={styles.howSection}>
        <FadeIn>
          <p className={styles.sectionTag}>// workflow</p>
          <h2 className={styles.sectionH2}>Three steps.<br /><span className={styles.accent}>Zero config.</span></h2>
        </FadeIn>
        <div className={styles.howGrid}>
          {[
            { n: '01', t: 'Paste', d: 'Copy any Solana transaction signature — from Explorer, your terminal, or logs.' },
            { n: '02', t: 'Parse', d: 'We fetch via Helius RPC, recursively parse inner instructions, and build the CPI tree.' },
            { n: '03', t: 'Explore', d: 'Click nodes, inspect accounts, compare balances. See exactly what happened on-chain.' },
          ].map((s, i) => (
            <FadeIn key={s.n} delay={i * 120} className={styles.howCard}>
              <span className={styles.howNum}>{s.n}</span>
              <div className={styles.howLine} />
              <h3 className={styles.howTitle}>{s.t}</h3>
              <p className={styles.howDesc}>{s.d}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaOrb} />
        <div className={styles.ctaOrb2} />
        <FadeIn>
          <p className={styles.ctaPre}>&gt;_ ready</p>
          <h2 className={styles.ctaH2}>Stop guessing.<br />Start debugging.</h2>
          <button className={styles.ctaBtn} onClick={goApp}>Launch CPITracker</button>
          <p className={styles.ctaNote}>Free. No login. No API key required.</p>
        </FadeIn>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}><span className={styles.accent}>&gt;_</span> CPITracker</div>
          <div className={styles.footerLinks}>
            <a href="https://github.com/nickmura/cpitracker" target="_blank" rel="noopener noreferrer">GitHub</a>
            <span>·</span>
            <a href="https://solana.com" target="_blank" rel="noopener noreferrer">Solana</a>
            <span>·</span>
            <a href="https://helius.dev" target="_blank" rel="noopener noreferrer">Helius</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
