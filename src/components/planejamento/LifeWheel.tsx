"use client";

import { useEffect, useState } from "react";

const AREAS = [
  { key: "saude",           label: "Saúde",           color: "#7C5CFF" },
  { key: "carreira",        label: "Carreira",        color: "#5EEAD4" },
  { key: "financas",        label: "Finanças",        color: "#F59E0B" },
  { key: "relacionamentos", label: "Relacionamentos", color: "#EC4899" },
  { key: "familia",         label: "Família",         color: "#22D18B" },
  { key: "desenvolvimento", label: "Mente",           color: "#A78BFA" },
  { key: "lazer",           label: "Lazer",           color: "#38BDF8" },
  { key: "espiritualidade", label: "Espiritualidade", color: "#F97316" },
];

interface LifeWheelProps {
  done: Record<string, number>;
  totals: Record<string, number>;
}

export function LifeWheel({ done, totals }: LifeWheelProps) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 150); return () => clearTimeout(t); }, []);

  const N = AREAS.length;
  const MAX = 100;
  const cx = 160, cy = 160, R = 100;

  // Compute progress % per area (done / total)
  const progress = AREAS.map(a => {
    const t = totals[a.key] ?? 0;
    const d = done[a.key] ?? 0;
    return t > 0 ? Math.round((d / t) * 100) : 0;
  });

  // Compute planned % per area (total / maxTotal, for outer dashed ring)
  const maxTotal = Math.max(...AREAS.map(a => totals[a.key] ?? 0), 1);
  const planned = AREAS.map(a => {
    const t = totals[a.key] ?? 0;
    return t > 0 ? Math.round((t / maxTotal) * 100) : 0;
  });

  const hasAnyPlanned = planned.some(p => p > 0);
  const hasAnyDone = progress.some(p => p > 0);

  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / N;

  const ringPt = (i: number, ratio: number) => {
    const a = angle(i);
    return `${cx + R * ratio * Math.cos(a)},${cy + R * ratio * Math.sin(a)}`;
  };

  const pt = (i: number, pct: number) => {
    const a = angle(i);
    const r = R * (Math.min(pct, MAX) / MAX);
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  };

  const donePoints = AREAS.map((_, i) => pt(i, animated ? progress[i] : 0)).join(" ");
  const plannedPoints = AREAS.map((_, i) => pt(i, animated ? planned[i] : 0)).join(" ");
  const fullDone = AREAS.filter((_, i) => progress[i] >= 100).length;
  const areasWithPlan = AREAS.filter((_, i) => planned[i] > 0).length;

  return (
    <div style={{
      background: "#151520",
      borderRadius: 24,
      border: "1px solid rgba(124,92,255,0.12)",
      padding: "20px 16px 16px",
      marginBottom: 16,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Glow behind wheel */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        width: 200, height: 200, transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,92,255,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4, position: "relative" }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#A78BFA" }}>
          Roda da Vida
        </p>
        <span style={{ fontSize: 10, color: "#9e96b5" }}>
          {fullDone}/{areasWithPlan || N} completas
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg viewBox="0 0 320 328" style={{ width: "100%", maxWidth: 300 }}>
          <defs>
            <radialGradient id="lwGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(124,92,255,0.18)" />
              <stop offset="100%" stopColor="rgba(124,92,255,0.02)" />
            </radialGradient>
            <radialGradient id="lwCenter" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(124,92,255,0.3)" />
              <stop offset="100%" stopColor="rgba(124,92,255,0)" />
            </radialGradient>
            <filter id="lwShadow">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="rgba(124,92,255,0.3)" />
            </filter>
          </defs>

          {/* Grid rings */}
          {[0.2, 0.4, 0.6, 0.8, 1].map(r => (
            <polygon key={r} points={AREAS.map((_, i) => ringPt(i, r)).join(" ")}
              fill="none"
              stroke={r === 1 ? "rgba(124,92,255,0.2)" : "rgba(167,139,250,0.06)"}
              strokeWidth={r === 1 ? 0.8 : 0.5}
            />
          ))}

          {/* Axis lines */}
          {AREAS.map((_, i) => {
            const [ex, ey] = ringPt(i, 1).split(",");
            return <line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="rgba(167,139,250,0.04)" strokeWidth="0.5" />;
          })}

          {/* Center glow */}
          <circle cx={cx} cy={cy} r="18" fill="url(#lwCenter)" />

          {/* Planned polygon (dashed, outer layer) */}
          {hasAnyPlanned && (
            <polygon
              points={plannedPoints}
              fill="none"
              stroke="rgba(167,139,250,0.35)"
              strokeWidth="1.5"
              strokeDasharray="6,4"
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{
                transition: "all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
          )}

          {/* Done polygon (solid, inner layer) */}
          {hasAnyDone && (
            <polygon
              points={donePoints}
              fill="url(#lwGlow)"
              stroke="#7C5CFF"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              filter="url(#lwShadow)"
              style={{
                transition: "all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
          )}

          {/* Planned vertex dots (hollow) */}
          {AREAS.map((a, i) => {
            const p = animated ? planned[i] : 0;
            if (p === 0) return null;
            const donePct = animated ? progress[i] : 0;
            const [px, py] = pt(i, p).split(",");
            return (
              <g key={`plan-${a.key}`}>
                <circle cx={px} cy={py} r="5" fill="none" stroke="rgba(167,139,250,0.3)" strokeWidth="1.5" strokeDasharray="3,2" />
                {/* Label planned count */}
                <text x={Number(px) + 8} y={Number(py) - 8} fontSize="8" fill="rgba(167,139,250,0.5)" fontWeight="600" textAnchor="start">
                  {totals[a.key] || 0}
                </text>
              </g>
            );
          })}

          {/* Done vertex dots (solid) */}
          {AREAS.map((a, i) => {
            const pct = animated ? progress[i] : 0;
            if (pct === 0) return null;
            const [px, py] = pt(i, pct).split(",");
            return (
              <g key={a.key}>
                <circle cx={px} cy={py} r="6" fill="rgba(124,92,255,0.15)" />
                <circle cx={px} cy={py} r="3.5" fill={a.color} stroke="#fff" strokeWidth="1" />
              </g>
            );
          })}

          {/* Area labels with individual colors */}
          {AREAS.map((a, i) => {
            const a2 = angle(i);
            const lx = cx + (R + 38) * Math.cos(a2);
            const ly = cy + (R + 38) * Math.sin(a2);
            const pct = animated ? progress[i] : 0;
            const inactive = pct === 0 && !hasAnyPlanned ? false : pct === 0;
            return (
              <g key={a.key}>
                <text x={lx} y={ly - 8} textAnchor="middle" dominantBaseline="middle"
                  fontSize="16" opacity={inactive ? 0.3 : 1}>{getEmoji(a.key)}</text>
                <text x={lx} y={ly + 6} textAnchor="middle" dominantBaseline="middle"
                  fontSize="8.5" fontWeight="700" fill={inactive ? "#3a3550" : a.color}
                  letterSpacing=".03em">{a.label}</text>
                {pct > 0 && (
                  <text x={lx} y={ly + 17} textAnchor="middle" dominantBaseline="middle"
                    fontSize="8" fontWeight="600" fill={a.color} opacity={0.7}>{pct}%</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function getEmoji(key: string): string {
  const map: Record<string, string> = {
    saude: "💚", carreira: "💼", financas: "💰", relacionamentos: "❤️",
    desenvolvimento: "🧠", familia: "🏡", lazer: "🌊", espiritualidade: "✨",
  };
  return map[key] || "⚪";
}
