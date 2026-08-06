"use client";

import { useEffect, useState } from "react";

const AREAS = [
  { key: "saude",           label: "Saúde",           color: "#7C5CFF", emoji: "💚" },
  { key: "carreira",        label: "Carreira",        color: "#5EEAD4", emoji: "💼" },
  { key: "financas",        label: "Finanças",        color: "#F59E0B", emoji: "💰" },
  { key: "relacionamentos", label: "Relacionamentos", color: "#EC4899", emoji: "❤️" },
  { key: "familia",         label: "Família",         color: "#22D18B", emoji: "🏡" },
  { key: "desenvolvimento", label: "Mente",           color: "#A78BFA", emoji: "🧠" },
  { key: "lazer",           label: "Lazer",           color: "#38BDF8", emoji: "🌊" },
  { key: "espiritualidade", label: "Espiritualidade", color: "#F97316", emoji: "✨" },
];

interface LifeWheelProps {
  done: Record<string, number>;
  totals: Record<string, number>;
}

const N = AREAS.length;
const CX = 150, CY = 150, R = 108;

function angle(i: number) { return -Math.PI / 2 + (i * 2 * Math.PI) / N; }

function vertPt(i: number, pct: number) {
  const a = angle(i);
  const r = R * (Math.min(Math.max(pct, 0), 100) / 100);
  return `${CX + r * Math.cos(a)},${CY + r * Math.sin(a)}`;
}

function ringPt(i: number, ratio: number) {
  const a = angle(i);
  return `${CX + R * ratio * Math.cos(a)},${CY + R * ratio * Math.sin(a)}`;
}

export function LifeWheel({ done, totals }: LifeWheelProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const progress = AREAS.map(a => {
    const t = totals[a.key] ?? 0;
    return t > 0 ? Math.round(((done[a.key] ?? 0) / t) * 100) : 0;
  });

  const maxTotal = Math.max(...AREAS.map(a => totals[a.key] ?? 0), 1);
  const planned = AREAS.map(a => {
    const t = totals[a.key] ?? 0;
    return t > 0 ? Math.round((t / maxTotal) * 100) : 0;
  });

  const hasData = planned.some(p => p > 0);
  const hasDone = progress.some(p => p > 0);

  const donePoints  = AREAS.map((_, i) => vertPt(i, mounted ? progress[i] : 0)).join(" ");
  const plannedPts  = AREAS.map((_, i) => vertPt(i, mounted ? planned[i] : 0)).join(" ");
  const outerRing   = AREAS.map((_, i) => ringPt(i, 1)).join(" ");
  const ring75      = AREAS.map((_, i) => ringPt(i, 0.75)).join(" ");
  const ring50      = AREAS.map((_, i) => ringPt(i, 0.5)).join(" ");
  const ring25      = AREAS.map((_, i) => ringPt(i, 0.25)).join(" ");
  const fullDone    = progress.filter(p => p >= 100).length;

  const totalPlanned = AREAS.reduce((s, a) => s + (totals[a.key] ?? 0), 0);
  const totalDone    = AREAS.reduce((s, a) => s + (done[a.key] ?? 0), 0);
  const pctGlobal    = totalPlanned > 0 ? Math.round((totalDone / totalPlanned) * 100) : 0;

  return (
    <div
      style={{
        background: `
          radial-gradient(ellipse 60% 40% at 50% 30%, rgba(124,92,255,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 40% 30% at 80% 70%, rgba(94,234,212,0.05) 0%, transparent 60%),
          linear-gradient(180deg, #181825 0%, #12121c 100%)
        `,
        borderRadius: 28,
        border: "1px solid rgba(255,255,255,0.04)",
        padding: "24px 20px 20px",
        marginBottom: 16,
        position: "relative",
        overflow: "hidden",
        boxShadow: `
          0 1px 0 rgba(255,255,255,0.03) inset,
          0 8px 32px rgba(0,0,0,0.4)
        `,
      }}
    >
      {/* Glass grain texture overlay */}
      <div
        style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"100\" height=\"100\" filter=\"url(#n)\" opacity=\"0.03\"/></svg>')",
        }}
      />

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8, position: "relative" }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em", color: "#e0d6ff" }}>
            Roda da Vida
          </p>
          <p style={{ margin: "1px 0 0", fontSize: 10, color: "#6a657a", fontWeight: 500 }}>
            Como sua energia está distribuída
          </p>
        </div>
        {totalPlanned > 0 && (
          <div style={{
            background: "rgba(124,92,255,0.08)", borderRadius: 20,
            padding: "4px 12px", border: "1px solid rgba(124,92,255,0.12)",
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#A78BFA" }}>{pctGlobal}%</span>
            <span style={{ fontSize: 9, color: "#6a657a", marginLeft: 4 }}>concluído</span>
          </div>
        )}
      </div>

      {/* ── Wheel container ── */}
      <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
        {/* Glow behind wheel */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 220, height: 220, transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,92,255,0.12) 0%, transparent 60%)",
          pointerEvents: "none",
          animation: "lwPulse 4s ease-in-out infinite",
        }} />

        <svg viewBox="0 0 300 315" style={{ width: "100%", maxWidth: 290 }}>
          <defs>
            <linearGradient id="lwDoneFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(124,92,255,0.3)" />
              <stop offset="50%" stopColor="rgba(94,234,212,0.18)" />
              <stop offset="100%" stopColor="rgba(245,158,11,0.22)" />
            </linearGradient>
            <filter id="lwGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Grid rings */}
          <polygon points={outerRing} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <polygon points={ring75}  fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
          <polygon points={ring50}  fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
          <polygon points={ring25}  fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />

          {/* Axis lines */}
          {AREAS.map((_, i) => {
            const [ex, ey] = ringPt(i, 1).split(",");
            return <line key={i} x1={CX} y1={CY} x2={ex} y2={ey} stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />;
          })}

          {/* Planned polygon */}
          {hasData && (
            <polygon points={plannedPts}
              fill="rgba(167,139,250,0.03)"
              stroke="rgba(167,139,250,0.2)"
              strokeWidth="1.2"
              strokeDasharray="4,4"
              strokeLinejoin="round"
              style={{ transition: "all 1.1s cubic-bezier(0.34, 1.4, 0.5, 1)" }}
            />
          )}

          {/* Done polygon */}
          {hasDone && (
            <polygon points={donePoints}
              fill="url(#lwDoneFill)"
              stroke="rgba(124,92,255,0.6)"
              strokeWidth="2"
              strokeLinejoin="round"
              filter="url(#lwGlow)"
              style={{ transition: "all 1.1s cubic-bezier(0.34, 1.4, 0.5, 1)" }}
            />
          )}

          {/* Vertex dots */}
          {AREAS.map((a, i) => {
            const pct = mounted ? progress[i] : 0;
            if (pct === 0) return null;
            const [px, py] = vertPt(i, pct).split(",");
            const isFull = pct >= 100;
            return (
              <g key={a.key}>
                <circle cx={px} cy={py} r={isFull ? 6 : 5} fill={a.color} opacity={0.2} />
                <circle cx={px} cy={py} r={isFull ? 3 : 2.5} fill={a.color} stroke="#fff" strokeWidth="0.8" />
                <text x={px} y={Number(py) - 14} textAnchor="middle" fontSize={isFull ? 10 : 9} fontWeight="700" fill={a.color}>
                  {isFull ? "✓" : `${pct}%`}
                </text>
              </g>
            );
          })}

          {/* Area labels */}
          {AREAS.map((a, i) => {
            const a2 = angle(i);
            const lx = CX + (R + 30) * Math.cos(a2);
            const ly = CY + (R + 30) * Math.sin(a2);
            const pct = mounted ? progress[i] : 0;
            const planPct = mounted ? planned[i] : 0;
            const empty = pct === 0 && planPct === 0;
            return (
              <g key={a.key} opacity={empty ? 0.3 : 1} style={{ transition: "opacity .6s" }}>
                <text x={lx} y={ly - 3} textAnchor="middle" dominantBaseline="middle" fontSize="16">
                  {a.emoji}
                </text>
                <text x={lx} y={ly + 11} textAnchor="middle" dominantBaseline="middle"
                  fontSize="8.5" fontWeight="600" fill={a.color} letterSpacing=".03em">
                  {a.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Legend row ── */}
      <div style={{
        display: "flex", justifyContent: "center", gap: 16, marginTop: 6,
        fontSize: 9, color: "#6a657a", fontWeight: 500, position: "relative",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, border: "1px dashed rgba(167,139,250,0.4)" }} />
          Planejado
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(124,92,255,0.5)", border: "1px solid rgba(124,92,255,0.6)" }} />
          Concluído
        </span>
      </div>

      {/* ── Stats row ── */}
      <div style={{
        display: "flex", justifyContent: "space-around", marginTop: 14, paddingTop: 14,
        borderTop: "1px solid rgba(255,255,255,0.03)", position: "relative",
      }}>
        <StatCell value={totalPlanned} label="Planejadas" />
        <StatCell value={totalDone} label="Concluídas" color={totalDone > 0 ? "#22D18B" : undefined} />
        <StatCell value={`${Math.min(AREAS.filter((_, i) => (totals[AREAS[i].key] ?? 0) > 0).length, N)}`} label="Áreas" />
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes lwPulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
        }
      `}</style>
    </div>
  );
}

function StatCell({ value, label, color }: { value: number | string; label: string; color?: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: color || "#e0d6ff", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
        {value}
      </p>
      <p style={{ margin: "2px 0 0", fontSize: 9, color: "#6a657a", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".06em" }}>
        {label}
      </p>
    </div>
  );
}
