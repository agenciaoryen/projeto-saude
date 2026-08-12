"use client";

import { useState, useEffect } from "react";
import { Target, ChevronRight } from "lucide-react";
import type { QuarterlyCycle } from "@/types";
import { AREA_CONFIG } from "@/lib/planejamento-constants";

interface QuickOKRWidgetProps {
  activeCycle?: QuarterlyCycle | null;
  loading?: boolean;
}

export function QuickOKRWidget({ activeCycle, loading }: QuickOKRWidgetProps) {
  if (loading) {
    return (
      <div style={{
        background: "#1a1530", borderRadius: 16, border: "1px solid rgba(124,92,255,0.1)",
        padding: "14px 16px",
      }}>
        <div style={{ height: 12, width: "60%", background: "rgba(167,139,250,0.08)", borderRadius: 6, marginBottom: 8, animation: "pulse 1.5s infinite" }} />
        <div style={{ height: 6, width: "100%", background: "rgba(167,139,250,0.08)", borderRadius: 3, animation: "pulse 1.5s infinite" }} />
      </div>
    );
  }

  if (!activeCycle) return null;

  const krs = activeCycle.key_results || [];
  if (krs.length === 0) return null;

  let totalPct = 0;
  for (const kr of krs) {
    totalPct += kr.target > 0 ? Math.min(100, Math.round((kr.current / kr.target) * 100)) : 0;
  }
  const avgPct = Math.round(totalPct / krs.length);

  const progressColor = avgPct >= 70 ? "#22D18B" : avgPct >= 30 ? "#F59E0B" : "#FF7070";

  return (
    <div style={{
      background: "linear-gradient(135deg, #1a1530 0%, rgba(124,92,255,0.05) 100%)",
      borderRadius: 16, border: "1px solid rgba(124,92,255,0.12)",
      padding: "14px 16px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Target size={14} color="#A78BFA" />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#A78BFA", letterSpacing: ".03em" }}>
            OKRs {activeCycle.label}
          </span>
        </div>
        <div style={{
          padding: "3px 8px", borderRadius: 9999, fontSize: 10, fontWeight: 700,
          background: progressColor + "18", color: progressColor, fontFamily: "monospace",
        }}>
          {avgPct}%
        </div>
      </div>

      {/* Mini KRs */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {krs.slice(0, 3).map((kr) => {
          const pct = kr.target > 0 ? Math.min(100, Math.round((kr.current / kr.target) * 100)) : 0;
          const areaConf = kr.area ? AREA_CONFIG[kr.area as keyof typeof AREA_CONFIG] : null;
          const krColor = pct >= 70 ? "#22D18B" : pct >= 30 ? "#F59E0B" : "#FF7070";

          return (
            <div key={kr.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {areaConf && <span style={{ fontSize: 10, flexShrink: 0 }}>{areaConf.emoji}</span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  fontSize: 11, fontWeight: 500, color: kr.status === "completed" ? "#5a5470" : "#c4bce0",
                  textDecoration: kr.status === "completed" ? "line-through" : "none",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block",
                }}>
                  {kr.title}
                </span>
                <div style={{
                  height: 3, borderRadius: 9999, background: "rgba(167,139,250,0.08)",
                  overflow: "hidden", marginTop: 3,
                }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: krColor, borderRadius: 9999, transition: "width .3s" }} />
                </div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: krColor, width: 24, textAlign: "right", flexShrink: 0 }}>
                {pct}%
              </span>
            </div>
          );
        })}
        {krs.length > 3 && (
          <p style={{ margin: 0, fontSize: 10, color: "#6a657a", textAlign: "center" }}>
            +{krs.length - 3} KRs
          </p>
        )}
      </div>
    </div>
  );
}
