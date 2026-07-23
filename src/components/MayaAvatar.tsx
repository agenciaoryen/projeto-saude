"use client";

import { useMemo } from "react";

export type AvatarState = "idle" | "processing" | "speaking" | "mini";

interface MayaAvatarProps {
  state?: AvatarState;
  size?: number;
  className?: string;
}

export function MayaAvatar({ state = "idle", size = 60, className = "" }: MayaAvatarProps) {
  const purple = "#7C5CFF";
  const purpleLight = "#A78BFA";
  const teal = "#5EEAD4";

  const style = useMemo((): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      position: "relative",
    };

    if (state === "mini") {
      return {
        ...base,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 30% 30%, ${purpleLight} 0%, ${purple} 100%)`,
        boxShadow: `0 0 10px ${purple}66, 0 0 20px ${purple}33`,
      };
    }

    if (state === "processing") {
      return {
        ...base,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle at 40% 35%, ${purpleLight} 0%, ${purple} 60%, transparent 100%)`,
        boxShadow: `0 0 24px ${purple}88, 0 0 48px ${purple}44`,
      };
    }

    return {
      ...base,
      width: size,
      height: size,
      borderRadius: "50%",
      background: `radial-gradient(circle at 40% 35%, ${purpleLight}22 0%, ${purple}66 50%, transparent 80%)`,
      boxShadow: `0 0 16px ${purple}55, 0 0 32px ${purple}22`,
    };
  }, [state, size, purple, purpleLight]);

  const innerCircle = useMemo((): React.CSSProperties => ({
    width: state === "mini" ? size * 0.56 : size * 0.52,
    height: state === "mini" ? size * 0.56 : size * 0.52,
    borderRadius: "50%",
    background: `radial-gradient(circle at 35% 30%, ${purpleLight} 0%, ${purple} 100%)`,
    position: "absolute",
  }), [state, size, purple, purpleLight]);

  return (
    <div
      className={className}
      style={{
        ...style,
        ...(state === "idle" ? { animation: "mayaBreathe 3s ease-in-out infinite" } : {}),
        ...(state === "speaking" ? { animation: "mayaBreathe 1.5s ease-in-out infinite" } : {}),
      }}
    >
      {/* Glow ring */}
      {state !== "mini" && (
        <div
          style={{
            position: "absolute",
            inset: -6,
            borderRadius: "50%",
            border: `1.5px solid ${purple}44`,
            ...(state === "processing" ? { animation: "mayaBreathe 1s ease-in-out infinite" } : {}),
            ...(state === "speaking" ? { animation: "mayaBreathe 0.8s ease-in-out infinite" } : {}),
          }}
        />
      )}

      {/* Inner circle */}
      <div style={innerCircle} />

      {/* Processing particles */}
      {state === "processing" && (
        <ProcessingParticles size={size} purple={purple} teal={teal} />
      )}

      {/* Speaking waveform */}
      {state === "speaking" && (
        <WaveformOverlay size={size} purple={purple} teal={teal} />
      )}

      {/* Mini: subtle glow ring */}
      {state === "mini" && (
        <div
          style={{
            position: "absolute",
            inset: -3,
            borderRadius: "50%",
            border: `1.5px solid ${purple}55`,
            animation: "mayaBreathe 3s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
}

// ── Processing particles ─────────────────────────────────────────────

function ProcessingParticles({ size, purple, teal }: { size: number; purple: string; teal: string }) {
  const particles = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * 360;
    const delay = i * 0.12;
    const colors = [purple, teal, purple, teal, purple, teal, purple, teal];
    return { angle, delay, color: colors[i] };
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: -(size * 0.2),
        animation: "spin 3s linear infinite",
      }}
    >
      {particles.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;
        const r = size * 0.58;
        const x = 50 + Math.cos(rad) * 50;
        const y = 50 + Math.sin(rad) * 50;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: p.color,
              opacity: 0.7,
              transform: "translate(-50%, -50%)",
              animation: `particlePulse 1.5s ease-in-out ${p.delay}s infinite`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes particlePulse {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.8); }
          50% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.4); }
        }
      `}</style>
    </div>
  );
}

// ── Waveform overlay ──────────────────────────────────────────────────

function WaveformOverlay({ size, purple, teal }: { size: number; purple: string; teal: string }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: -(size * 0.15),
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "flex-end",
        gap: 3,
        height: size * 0.3,
      }}
    >
      {[1, 0.7, 1.4, 0.5, 1.2, 0.8, 1, 0.6].map((scale, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: 12,
            borderRadius: 9999,
            background: i % 2 === 0 ? purple : teal,
            opacity: 0.6,
            animation: `waveBar 0.6s ease-in-out ${i * 0.08}s infinite alternate`,
            transform: `scaleY(${scale})`,
          }}
        />
      ))}
      <style>{`
        @keyframes waveBar {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1.6); }
        }
      `}</style>
    </div>
  );
}
