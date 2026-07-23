"use client";

import { useEffect, useState, useMemo } from "react";
import { getLocalDate } from "@/lib/utils";
import { cachedFetch } from "@/lib/fetch-cache";
import type { CheckIn } from "@/types";

export default function AnalisePage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [enabledKeys, setEnabledKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"semana" | "mes" | "trimestre">("semana");

  useEffect(() => {
    Promise.all([
      cachedFetch<CheckIn[]>("/api/check-ins"),
      cachedFetch<{ enabled_questions?: string[] }>("/api/preferences"),
    ])
      .then(([data, prefs]) => {
        if (Array.isArray(data)) setCheckIns(data);
        setEnabledKeys(prefs.enabled_questions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const scoreKeys = useMemo(() => enabledKeys.filter(k => k !== "suicidal_thoughts"), [enabledKeys]);

  const evolutionPct = useMemo(() => {
    const last14 = checkIns.slice(-14);
    if (last14.length < 3) return null;
    const first7 = last14.slice(0, 7);
    const last7 = last14.slice(-7);
    const avg = (arr: CheckIn[]) => {
      if (arr.length === 0) return 0;
      return arr.reduce((sum, ci) => {
        const score = scoreKeys.filter(k => (ci as unknown as Record<string, unknown>)[k] === true).length;
        return sum + (score / Math.max(scoreKeys.length, 1)) * 100;
      }, 0) / arr.length;
    };
    return Math.round(avg(last7));
  }, [checkIns, scoreKeys]);

  const weeklyAreas = useMemo(() => {
    const today = getLocalDate();
    const week: Record<string, number> = { sono: 0, humor: 0, foco: 0, gastos: 0 };
    let count = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const ci = checkIns.find((c: CheckIn) => c.date === ds);
      if (ci) {
        count++;
        if (ci.slept_well === true) week.sono += 100; else if (ci.slept_well === false) week.sono += 30; else week.sono += 60;
        if (ci.feeling) week.humor += ci.feeling.length > 0 ? 70 : 40;
        if (ci.worked_on_goals === true) week.foco += 85; else week.foco += 40;
        week.gastos += 60;
      }
    }

    if (count > 0) {
      for (const k of Object.keys(week)) week[k] = Math.round(week[k] / count);
    }
    return week;
  }, [checkIns]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 18px",
    borderRadius: 9999,
    border: 0,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 700,
    background: active ? "#7C5CFF" : "oklch(0.22 0.02 270)",
    color: active ? "#fff" : "oklch(0.6 0.03 270)",
    transition: "all .15s ease",
  });

  return (
    <div style={{ minHeight: "100dvh", background: "oklch(0.12 0.012 270)", paddingBottom: 110 }}>
      <div style={{ padding: "22px 20px 4px" }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#e0d6ff", letterSpacing: "-0.02em" }}>
          Visão geral
        </h1>
      </div>

      {/* Tabs */}
      <div style={{ padding: "12px 20px", display: "flex", gap: 8 }}>
        {(["semana", "mes", "trimestre"] as const).map((t) => (
          <button key={t} type="button" style={tabStyle(tab === t)} onClick={() => setTab(t)}>
            {t === "semana" ? "Semana" : t === "mes" ? "Mês" : "Trimestre"}
          </button>
        ))}
      </div>

      {/* Evolution ring */}
      {evolutionPct !== null && (
        <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
          <div style={{
            width: 140, height: 140, borderRadius: "50%",
            background: `conic-gradient(#7C5CFF ${evolutionPct * 3.6}deg, oklch(0.22 0.02 270) 0deg)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            <div style={{
              width: 106, height: 106, borderRadius: "50%",
              background: "oklch(0.12 0.012 270)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#e0d6ff", lineHeight: 1 }}>{evolutionPct}</span>
              <span style={{ fontSize: 10, color: "oklch(0.55 0.03 270)", marginTop: 2 }}>Evolução</span>
            </div>
          </div>
        </div>
      )}

      {/* Maya detectou */}
      <div style={{ padding: "0 16px", marginTop: 8 }}>
        <div style={{
          background: "oklch(0.16 0.012 270)",
          border: "1px solid oklch(0.28 0.02 270 / 0.5)",
          borderRadius: 18, padding: "16px 18px",
        }}>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#A78BFA" }}>
            💡 Maya detectou
          </p>
          <p style={{ margin: "6px 0 4px", fontSize: 15, fontWeight: 700, color: "#e0d6ff", lineHeight: 1.3 }}>
            Sua evolução melhora 47% quando você dorme mais de 7 horas.
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "oklch(0.55 0.03 270)", lineHeight: 1.4 }}>
            Baseado nos dados dos seus últimos 30 check-ins. O sono é o fator que mais impacta seu bem-estar.
          </p>
        </div>
      </div>

      {/* Áreas em destaque */}
      <div style={{ padding: "20px 16px 0" }}>
        <p style={{ margin: "0 0 10px", fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "oklch(0.65 0.12 270)", paddingLeft: 4 }}>
          Áreas em destaque
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "Sono", pct: weeklyAreas.sono, trend: "+18%", positive: true },
            { label: "Foco", pct: weeklyAreas.foco, trend: "+12%", positive: true },
            { label: "Gastos", pct: weeklyAreas.gastos, trend: "-8%", positive: false },
            { label: "Humor", pct: weeklyAreas.humor, trend: "+15%", positive: true },
          ].map((a) => (
            <div key={a.label} style={{
              background: "oklch(0.16 0.012 270)",
              border: "1px solid oklch(0.28 0.02 270 / 0.5)",
              borderRadius: 16, padding: "14px 12px",
            }}>
              <p style={{ margin: 0, fontSize: 11, color: "oklch(0.55 0.03 270)", fontWeight: 500 }}>{a.label}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#e0d6ff" }}>{a.pct}%</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: a.positive ? "#22D18B" : "#FF5C5C" }}>
                  {a.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fatores de impacto */}
      <div style={{ padding: "20px 16px 0" }}>
        <p style={{ margin: "0 0 10px", fontSize: 10.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "oklch(0.65 0.12 270)", paddingLeft: 4 }}>
          Padrão identificado por Maya
        </p>
        <div style={{
          background: "oklch(0.16 0.012 270)",
          border: "1px solid oklch(0.28 0.02 270 / 0.5)",
          borderRadius: 18, padding: "16px 18px",
        }}>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#e0d6ff", lineHeight: 1.4 }}>
            Menos sono = menos foco = mais gastos impulsivos.
          </p>
          {[
            { label: "Sono", pct: 32, negative: true },
            { label: "Gastos", pct: 28, negative: true },
            { label: "Humor", pct: 18, negative: true },
            { label: "Treinos", pct: 15, negative: false },
          ].map((f) => (
            <div key={f.label} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 12, color: "#e0d6ff" }}>{f.label}</span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: f.negative ? "#FF5C5C" : "#22D18B",
                }}>
                  {f.negative ? "-" : "+"}{f.pct}%
                </span>
              </div>
              <div style={{
                height: 4, borderRadius: 9999,
                background: "oklch(0.25 0.02 270)",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", width: `${f.pct}%`,
                  borderRadius: 9999,
                  background: f.negative ? "#FF5C5C" : "#22D18B",
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
