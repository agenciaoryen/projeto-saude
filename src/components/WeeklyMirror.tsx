"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/useTranslation";
import { getWeekMondayDate, getWeekSundayDate } from "@/lib/utils";
import { Loader2, Sparkles, ChevronDown } from "lucide-react";

function getWeekLabel(): string {
  const mon = getWeekMondayDate();
  const sun = getWeekSundayDate();
  const fmt = (d: string) => {
    const [, m, day] = d.split("-");
    return `${parseInt(day)}/${parseInt(m)}`;
  };
  return `${fmt(mon)} – ${fmt(sun)}`;
}

// ── Design tokens ──────────────────────────────────────────────
const MUTED = "#9e96b5";
const FOREGROUND = "#e0d6ff";

export function WeeklyMirror() {
  const { t, lang } = useTranslation();
  const [narrative, setNarrative] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const weekKey = getWeekMondayDate();
    const cacheKey = `weekly_mirror_${weekKey}`;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setNarrative(cached);
        setLoading(false);
        return;
      }
    } catch { /* localStorage unavailable */ }

    fetch("/api/reflect/weekly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.narrative) {
          setNarrative(data.narrative);
          try { localStorage.setItem(cacheKey, data.narrative); } catch { /* ignore */ }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lang]);

  if (loading) {
    return (
      <div
        style={{
          borderRadius: 16, padding: 16, display: "flex", alignItems: "center", gap: 12,
          background: "linear-gradient(135deg, oklch(.58 .18 270 / .08) 0%, oklch(.65 .15 280 / .05) 100%)",
          border: "1px solid oklch(.58 .18 270 / .15)",
        }}
      >
        <Loader2 className="animate-spin" style={{ width: 16, height: 16, flexShrink: 0, color: "oklch(.58 .18 270)" }} />
        <span style={{ fontSize: 13, color: MUTED }}>{t("preparando_espelho")}</span>
      </div>
    );
  }

  if (!narrative) return null;

  const firstPara = narrative.split(/\n+/).filter(Boolean)[0] ?? "";

  return (
    <div
      style={{
        borderRadius: 16, overflow: "hidden",
        background: "linear-gradient(135deg, oklch(.58 .18 270 / .10) 0%, oklch(.60 .15 280 / .06) 100%)",
        border: "1px solid oklch(.58 .18 270 / .18)",
      }}
    >
      {/* Header — sempre visível, clicável */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", textAlign: "left", padding: "16px 20px 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "transparent", border: 0, cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles style={{ width: 16, height: 16, flexShrink: 0, color: "oklch(.58 .18 270)" }} />
          <div>
            <span style={{ fontSize: 13, fontWeight: 600, display: "block", color: "oklch(.50 .14 280)" }}>
              {t("espelho_titulo")}
            </span>
            <span style={{ fontSize: 11, color: MUTED, fontVariantNumeric: "tabular-nums" }}>
              {getWeekLabel()}
            </span>
          </div>
        </div>
        <ChevronDown
          style={{
            width: 16, height: 16, flexShrink: 0, transition: "transform .2s ease",
            color: "oklch(.55 .12 280)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Preview quando fechado */}
      {!open && (
        <div
          style={{ padding: "0 20px 16px", borderTop: "1px solid oklch(.58 .18 270 / .08)" }}
        >
          <p
            style={{
              fontSize: 13, lineHeight: 1.6, color: MUTED, marginTop: 12,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}
          >
            {firstPara}
          </p>
        </div>
      )}

      {/* Narrativa completa quando aberto */}
      {open && (
        <div style={{ borderTop: "1px solid oklch(.58 .18 270 / .10)" }}>
          <div style={{ padding: "20px 20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            {narrative.split(/\n+/).filter(Boolean).map((para, i) => (
              <p
                key={i}
                style={{
                  fontSize: 13, lineHeight: 1.6,
                  color: FOREGROUND,
                }}
              >
                {para}
              </p>
            ))}
          </div>
          <div style={{ padding: "0 20px 16px" }}>
            <p style={{ fontSize: 10, color: MUTED, fontStyle: "italic" }}>
              {t("espelho_disclaimer")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
