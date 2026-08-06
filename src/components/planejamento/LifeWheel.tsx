"use client";

import { useEffect, useState } from "react";

const AREAS = [
  { key: "saude",           label: "Saúde",           color: "#7C5CFF", bg: "rgba(124,92,255,0.06)" },
  { key: "carreira",        label: "Carreira",        color: "#5EEAD4", bg: "rgba(94,234,212,0.06)" },
  { key: "financas",        label: "Finanças",        color: "#F59E0B", bg: "rgba(245,158,11,0.06)" },
  { key: "relacionamentos", label: "Relacionamentos", color: "#EC4899", bg: "rgba(236,72,153,0.06)" },
  { key: "familia",         label: "Família",         color: "#22D18B", bg: "rgba(34,209,139,0.06)" },
  { key: "desenvolvimento", label: "Mente",           color: "#A78BFA", bg: "rgba(167,139,250,0.06)" },
  { key: "lazer",           label: "Lazer",           color: "#38BDF8", bg: "rgba(56,189,248,0.06)" },
  { key: "espiritualidade", label: "Espiritualidade", color: "#F97316", bg: "rgba(249,115,22,0.06)" },
];

interface LifeWheelProps {
  done: Record<string, number>;
  totals: Record<string, number>;
}

export function LifeWheel({ done, totals }: LifeWheelProps) {
  const [animated, setAnimated] = useState(false);
  const [pulse, setPulse] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    const i = setInterval(() => setPulse(p => p === 1 ? 0.85 : 1), 3000);
    return () => { clearTimeout(t); clearInterval(i); };
  }, []);

  const N = AREAS.length;
  const cx = 170, cy = 170, R = 110;

  const progress = AREAS.map(a => {
    const t = totals[a.key] ?? 0;
    const d = done[a.key] ?? 0;
    return t > 0 ? Math.round((d / t) * 100) : 0;
  });

  const maxTotal = Math.max(...AREAS.map(a => totals[a.key] ?? 0), 1);
  const planned = AREAS.map(a => {
    const t = totals[a.key] ?? 0;
    return t > 0 ? Math.round((t / maxTotal) * 100) : 0;
  });

  const hasAnyPlanned = planned.some(p => p > 0);
  const hasAnyDone = progress.some(p => p > 0);
  const fullDone = progress.filter(p => p >= 100).length;
  const totalDone = progress.reduce((s, p) => s + (p > 0 ? (totals[AREAS[progress.indexOf(p)]?.key] ?? 0) : 0), 0);

  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / N;

  const ringPt = (i: number, ratio: number) => {
    const a = angle(i);
    return `${cx + R * ratio * Math.cos(a)},${cy + R * ratio * Math.sin(a)}`;
  };

  const pt = (i: number, pct: number) => {
    const a = angle(i);
    const r = R * (Math.min(pct, 100) / 100);
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  };

  const donePoints = AREAS.map((_, i) => pt(i, animated ? progress[i] : 0)).join(" ");
  const plannedPoints = AREAS.map((_, i) => pt(i, animated ? planned[i] : 0)).join(" ");

  return (
    <div style={{
      background: "radial-gradient(ellipse at 50% 30%, #1a1535 0%, #12121a 100%)",
      borderRadius: 28,
      border: "1px solid rgba(124,92,255,0.1)",
      padding: "24px 8px 16px",
      marginBottom: 16,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background aura layers */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        width: 260, height: 260, transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,92,255,0.06) 0%, rgba(94,234,212,0.03) 40%, transparent 70%)",
        pointerEvents: "none",
        opacity: pulse,
        transition: "opacity 3s ease-in-out",
      }} />
      <div style={{
        position: "absolute", top: "55%", left: "45%",
        width: 180, height: 180, transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 0, padding: "0 12px", position: "relative" }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#A78BFA" }}>
          Roda da Vida
        </p>
        <span style={{ fontSize: 10, color: "#6a657a", fontWeight: 600 }}>
          {fullDone} de {AREAS.filter((_, i) => planned[i] > 0 || progress[i] > 0).length || N} áreas
        </span>
      </div>

      {/* Wheel */}
      <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
        <svg viewBox="0 0 340 355" style={{ width: "100%", maxWidth: 320 }}>
          <defs>
            {/* Multi-stop gradient for the done polygon */}
            <linearGradient id="lwGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(124,92,255,0.25)" />
              <stop offset="50%" stopColor="rgba(94,234,212,0.15)" />
              <stop offset="100%" stopColor="rgba(245,158,11,0.2)" />
            </linearGradient>

            {/* Center glow */}
            <radialGradient id="lwCenter2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="30%" stopColor="rgba(124,92,255,0.12)" />
              <stop offset="100%" stopColor="rgba(124,92,255,0)" />
            </radialGradient>

            {/* Outer ring glow */}
            <radialGradient id="lwOuterRing" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="transparent" />
              <stop offset="95%" stopColor="rgba(124,92,255,0.04)" />
              <stop offset="100%" stopColor="rgba(124,92,255,0.1)" />
            </radialGradient>

            {/* Glow filter */}
            <filter id="lwGlow2" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="lwSoftGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer ring */}
          <circle cx={cx} cy={cy} r={R + 4} fill="none" stroke="rgba(124,92,255,0.06)" strokeWidth="8" />
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(124,92,255,0.12)" strokeWidth="1" />
          <circle cx={cx} cy={cy} r={R} fill="url(#lwOuterRing)" />

          {/* Grid rings with subtle labels */}
          {[0.25, 0.5, 0.75].map(r => (
            <polygon key={r} points={AREAS.map((_, i) => ringPt(i, r)).join(" ")}
              fill="none" stroke="rgba(167,139,250,0.04)" strokeWidth="0.5"
            />
          ))}

          {/* Axis lines - subtle from center to edge */}
          {AREAS.map((_, i) => {
            const [ex, ey] = ringPt(i, 1).split(",");
            return <line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="rgba(167,139,250,0.03)" strokeWidth="0.5" />;
          })}

          {/* Area background fills (subtle pie slices) */}
          {AREAS.map((a, i) => {
            const a1 = angle(i);
            const a2 = angle((i + 1) % N);
            const p1 = `${cx + R * Math.cos(a1)},${cy + R * Math.sin(a1)}`;
            const p2 = `${cx + R * Math.cos(a2)},${cy + R * Math.sin(a2)}`;
            return <polygon key={`bg-${a.key}`} points={`${cx},${cy} ${p1} ${p2}`} fill={a.bg} />;
          })}

          {/* Planned polygon - dashed, elegant */}
          {hasAnyPlanned && (
            <polygon points={plannedPoints}
              fill="none"
              stroke="rgba(167,139,250,0.25)"
              strokeWidth="1.5"
              strokeDasharray="5,5"
              strokeLinejoin="round"
              style={{ transition: "all 1s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            />
          )}

          {/* Done polygon - vibrant with glow */}
          {hasAnyDone && (
            <>
              <polygon points={donePoints}
                fill="url(#lwGrad1)"
                stroke="#7C5CFF"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                filter="url(#lwGlow2)"
                opacity={0.9}
                style={{ transition: "all 1s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
              />
            </>
          )}

          {/* Center mandala dot */}
          <circle cx={cx} cy={cy} r="24" fill="url(#lwCenter2)" />
          <circle cx={cx} cy={cy} r="6" fill="#fff" opacity={0.5} />
          <circle cx={cx} cy={cy} r="3" fill="#fff" opacity={0.8} />
          {/* Center ring pulse */}
          <circle cx={cx} cy={cy} r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"
            style={{ transform: `scale(${pulse})`, transformOrigin: `${cx}px ${cy}px`, transition: "transform 3s ease-in-out" }} />

          {/* Done vertex dots */}
          {AREAS.map((a, i) => {
            const pct = animated ? progress[i] : 0;
            if (pct === 0) return null;
            const [px, py] = pt(i, pct).split(",");
            const planPct = animated ? planned[i] : 0;
            return (
              <g key={a.key}>
                {/* Outer halo */}
                <circle cx={px} cy={py} r="10" fill="none" stroke={a.color} strokeWidth="0.5" opacity={0.3} />
                {/* Solid dot */}
                <circle cx={px} cy={py} r="5" fill={a.color} opacity={0.9} />
                <circle cx={px} cy={py} r="2.5" fill="#fff" />
                {/* % label */}
                <text x={px} y={Number(py) - 12} textAnchor="middle" fontSize="11" fontWeight="800" fill={a.color} filter="url(#lwSoftGlow)">
                  {pct}%
                </text>
                {/* Count label if planned > done */}
                {planPct > pct && (
                  <text x={px} y={Number(py) + 20} textAnchor="middle" fontSize="8" fill="rgba(167,139,250,0.4)" fontWeight="600">
                    {done[a.key] || 0}/{totals[a.key] || 0}
                  </text>
                )}
              </g>
            );
          })}

          {/* Area labels around the wheel */}
          {AREAS.map((a, i) => {
            const a2 = angle(i);
            const lx = cx + (R + 32) * Math.cos(a2);
            const ly = cy + (R + 32) * Math.sin(a2);
            const pct = animated ? progress[i] : 0;
            const planPct = animated ? planned[i] : 0;
            const empty = pct === 0 && planPct === 0;
            return (
              <g key={a.key}>
                {/* Emoji */}
                <text x={lx} y={ly - 6} textAnchor="middle" dominantBaseline="middle"
                  fontSize="17" opacity={empty ? 0.25 : 1}
                  style={{ transition: "opacity 0.5s ease" }}>
                  {getEmoji(a.key)}
                </text>
                {/* Label */}
                <text x={lx} y={ly + 9} textAnchor="middle" dominantBaseline="middle"
                  fontSize="9" fontWeight="700" fill={empty ? "#2a2540" : a.color}
                  letterSpacing=".04em"
                  style={{ transition: "fill 0.5s ease" }}>
                  {a.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom stats */}
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 4, position: "relative" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 8, textTransform: "uppercase", letterSpacing: ".1em", color: "#6a657a" }}>Planejado</p>
          <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 800, color: "#A78BFA", letterSpacing: "-0.03em" }}>
            {AREAS.reduce((s, a) => s + (totals[a.key] ?? 0), 0)}
          </p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 8, textTransform: "uppercase", letterSpacing: ".1em", color: "#6a657a" }}>Concluído</p>
          <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 800, color: totalDone > 0 ? "#22D18B" : "#6a657a", letterSpacing: "-0.03em" }}>
            {AREAS.reduce((s, a) => s + (done[a.key] ?? 0), 0)}
          </p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 8, textTransform: "uppercase", letterSpacing: ".1em", color: "#6a657a" }}>Taxa</p>
          <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 800, color: "#5EEAD4", letterSpacing: "-0.03em" }}>
            {AREAS.reduce((s, a) => s + (totals[a.key] ?? 0), 0) > 0
              ? Math.round((AREAS.reduce((s, a) => s + (done[a.key] ?? 0), 0) / Math.max(AREAS.reduce((s, a) => s + (totals[a.key] ?? 0), 0), 1)) * 100)
              : 0}%
          </p>
        </div>
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
