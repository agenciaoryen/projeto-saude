"use client";

import { useEffect, useState, useRef, useCallback } from "react";

// Ordered to place longer labels where there's more horizontal space
// Top (0) & bottom (4) = most space for long labels
// Left (6) & right (2) = tight — shorter labels
const AREAS = [
  { key: "espiritualidade", label: "Espiritualidade", color: "#F97316", emoji: "✨" }, // top — long label, centered
  { key: "carreira",        label: "Carreira",        color: "#5EEAD4", emoji: "💼" }, // top-right
  { key: "desenvolvimento", label: "Mente",           color: "#A78BFA", emoji: "🧠" }, // right — short label
  { key: "familia",         label: "Família",         color: "#22D18B", emoji: "🏡" }, // bottom-right
  { key: "relacionamentos", label: "Relacionamentos", color: "#EC4899", emoji: "❤️" }, // bottom — long label, centered
  { key: "financas",        label: "Finanças",        color: "#F59E0B", emoji: "💰" }, // bottom-left — longer label
  { key: "lazer",           label: "Lazer",           color: "#38BDF8", emoji: "🌊" }, // left — short label
  { key: "saude",           label: "Saúde",           color: "#7C5CFF", emoji: "💚" }, // top-left
];

interface LifeWheelProps {
  done: Record<string, number>;
  totals: Record<string, number>;
  /** Custom emoji images — map of area key to PNG URL. Falls back to system emoji. */
  emojis?: Partial<Record<string, string>>;
  /** Week date range label, e.g. "4 a 10 de agosto" — used in share PNG */
  weekLabel?: string;
  /** Focus stones for the week (max 3) — used in share PNG bottom card */
  stones?: (string | null)[];
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

export function LifeWheel({ done, totals, emojis, weekLabel, stones }: LifeWheelProps) {
  const [mounted, setMounted] = useState(false);
  const [sharing, setSharing] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
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

  // Helper: draw rounded rectangle on canvas (roundRect not available in all TypeScript DOM libs)
  function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  const handleShare = useCallback(async () => {
    const svg = svgRef.current;
    if (!svg) return;
    setSharing(true);
    try {
      // ── Clone SVG & boost everything for export ──
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      // Force full opacity on ALL area groups — every label vibrant, even empty areas
      clone.querySelectorAll("g").forEach((el: Element) => {
        const g = el as SVGElement;
        const op = g.getAttribute("opacity");
        if (op && parseFloat(op) < 1) g.setAttribute("opacity", "1");
      });
      // Boost text sizes modestly for export
      clone.querySelectorAll("text").forEach((el: Element) => {
        const t = el as SVGElement;
        const fs = parseFloat(t.getAttribute("font-size") || "8");
        t.setAttribute("font-size", String(fs * 1.2));
        const fill = t.getAttribute("fill");
        // Boost opacity on rgba fills to full
        if (fill && fill.includes("rgba")) {
          t.setAttribute("fill", fill.replace(/[\d.]+\)$/, () => "1)"));
        }
        // Make subdued text fully vibrant
        if (fill && fill === "#6a657a") t.setAttribute("fill", "#c0b8d8");
      });
      // Boost structural elements (rings, axes, polygons) for export clarity
      clone.querySelectorAll("polygon, line, circle").forEach((el: Element) => {
        const s = el as SVGElement;
        const stroke = s.getAttribute("stroke");
        const fill = s.getAttribute("fill");
        if (stroke && stroke.includes("rgba")) {
          s.setAttribute("stroke", stroke.replace(/[\d.]+\)$/, m => {
            const v = parseFloat(m);
            return `${Math.min(v * 3, 0.85)})`;
          }));
        }
        if (fill && fill.includes("rgba")) {
          s.setAttribute("fill", fill.replace(/[\d.]+\)$/, m => {
            const v = parseFloat(m);
            return `${Math.min(v * 2.5, 0.75)})`;
          }));
        }
      });
      const svgData = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);

      // ── Canvas setup (2x internal resolution = 4K quality) ──
      const canvas = document.createElement("canvas");
      const W = 1080, H = 1920;
      const SCALE = 2; // 2160×3840 internal → crisp text
      canvas.width = W * SCALE; canvas.height = H * SCALE;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(SCALE, SCALE);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // ── 1. BACKGROUND ──────────────────────────────────────────
      // Base fill
      ctx.fillStyle = "#0F0F14"; ctx.fillRect(0, 0, W, H);

      // Radial gradient — subtle purple/blue glow behind center
      const bgGlow = ctx.createRadialGradient(W / 2, H * 0.38, W * 0.08, W / 2, H * 0.42, W * 0.75);
      bgGlow.addColorStop(0, "rgba(124,92,255,0.12)");
      bgGlow.addColorStop(0.4, "rgba(94,234,212,0.04)");
      bgGlow.addColorStop(1, "transparent");
      ctx.fillStyle = bgGlow; ctx.fillRect(0, 0, W, H);

      // Subtle particles / blurred lights
      const particleSeeds = [23, 67, 112, 189, 245, 312, 378, 421, 489, 534, 601, 678, 723, 789, 845, 901, 956, 1003];
      particleSeeds.forEach(seed => {
        const px = (seed * 173) % W;
        const py = (seed * 337) % H;
        const pr = 1.5 + (seed % 5);
        const alpha = 0.08 + (seed % 4) * 0.03;
        const hue = seed % 3 === 0 ? "124,92,255" : seed % 3 === 1 ? "94,234,212" : "167,139,250";
        ctx.fillStyle = `rgba(${hue},${alpha})`;
        ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
      });

      // Vignette
      const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.55, W / 2, H / 2, W * 0.95);
      vignette.addColorStop(0, "transparent");
      vignette.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);

      // ── 2. HEADER ──────────────────────────────────────────────
      const headerY = 110;
      // Diamond icon + MAYA
      const diamondCx = W / 2 - 62, diamondCy = headerY - 52;
      ctx.save();
      ctx.translate(diamondCx, diamondCy);
      ctx.beginPath();
      ctx.moveTo(0, -11); ctx.lineTo(8, 0); ctx.lineTo(0, 11); ctx.lineTo(-8, 0); ctx.closePath();
      ctx.fillStyle = "#A78BFA";
      ctx.shadowColor = "rgba(167,139,250,0.6)"; ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
      // MAYA text
      ctx.fillStyle = "#FFFFFF"; ctx.font = "600 24px Inter, system-ui, -apple-system, sans-serif"; ctx.textAlign = "center";
      ctx.fillText("MAYA", W / 2 + 10, headerY - 46);

      // Title: "Hub da" + "Semana" in gradient
      const titleY = headerY + 20;
      ctx.font = "700 72px Inter, system-ui, -apple-system, sans-serif"; ctx.textAlign = "center";
      const hubDaW = ctx.measureText("Hub da ").width;
      const semanaW = ctx.measureText("Semana").width;
      const titleStartX = (W - hubDaW - semanaW) / 2;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("Hub da ", titleStartX + hubDaW / 2, titleY);
      // Gradient for "Semana"
      const semanaGrad = ctx.createLinearGradient(titleStartX + hubDaW, titleY, titleStartX + hubDaW + semanaW, titleY);
      semanaGrad.addColorStop(0, "#7C5CFF"); semanaGrad.addColorStop(1, "#A78BFA");
      ctx.fillStyle = semanaGrad;
      ctx.fillText("Semana", titleStartX + hubDaW + semanaW / 2, titleY);

      // Subtitle
      ctx.fillStyle = "#A0A0B3"; ctx.font = "400 24px Inter, system-ui, -apple-system, sans-serif";
      ctx.fillText("Meu equilíbrio. Minhas escolhas. Minha melhor versão.", W / 2, titleY + 42);

      // ── 3. DATE BADGE ──────────────────────────────────────────
      const badgeY = titleY + 90;
      const badgeLabel = weekLabel || "";
      const badgeW = badgeLabel ? ctx.measureText(`📅 ${badgeLabel}`).width + 44 : 0;
      if (badgeW > 0) {
        const badgeX = (W - badgeW) / 2;
        ctx.fillStyle = "rgba(124,92,255,0.12)"; ctx.strokeStyle = "rgba(167,139,250,0.2)"; ctx.lineWidth = 1;
        drawRoundRect(ctx, badgeX, badgeY - 20, badgeW, 40, 22); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#E0D6FF"; ctx.font = "500 19px Inter, system-ui, -apple-system, sans-serif"; ctx.textAlign = "center";
        ctx.fillText(`📅  ${badgeLabel}`, W / 2, badgeY + 6);
      }

      // ── 4. WHEEL ───────────────────────────────────────────────
      const wheelSize = 740, wheelX = (W - wheelSize) / 2, wheelY = badgeY + 100;
      const wheelCx = W / 2, wheelCy = wheelY + wheelSize / 2;

      // Glow aura behind wheel
      const wheelGlow = ctx.createRadialGradient(wheelCx, wheelCy, wheelSize * 0.08, wheelCx, wheelCy, wheelSize * 0.65);
      wheelGlow.addColorStop(0, "rgba(124,92,255,0.18)");
      wheelGlow.addColorStop(0.4, "rgba(94,234,212,0.05)");
      wheelGlow.addColorStop(1, "transparent");
      ctx.fillStyle = wheelGlow; ctx.beginPath();
      ctx.arc(wheelCx, wheelCy, wheelSize * 0.65, 0, Math.PI * 2); ctx.fill();

      // Load & render SVG wheel
      const img = new Image();
      await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; img.src = svgUrl; });
      ctx.drawImage(img, wheelX, wheelY, wheelSize, wheelSize);

      // Center luminous dot with halo
      const centerGlow = ctx.createRadialGradient(wheelCx, wheelCy, 0, wheelCx, wheelCy, 28);
      centerGlow.addColorStop(0, "rgba(255,255,255,0.9)");
      centerGlow.addColorStop(0.2, "rgba(167,139,250,0.5)");
      centerGlow.addColorStop(0.6, "rgba(124,92,255,0.15)");
      centerGlow.addColorStop(1, "transparent");
      ctx.fillStyle = centerGlow; ctx.beginPath();
      ctx.arc(wheelCx, wheelCy, 28, 0, Math.PI * 2); ctx.fill();
      // Tiny white dot
      ctx.fillStyle = "#FFFFFF"; ctx.beginPath();
      ctx.arc(wheelCx, wheelCy, 4, 0, Math.PI * 2); ctx.fill();

      // ── 5. HANDWRITTEN NOTES ───────────────────────────────────
      // Note 1 — right side, subtle handwritten style
      ctx.save();
      ctx.fillStyle = "rgba(167,139,250,0.4)"; ctx.font = "italic 400 24px 'Segoe Script', 'Brush Script MT', cursive, sans-serif"; ctx.textAlign = "right";
      ctx.translate(W - 100, wheelCy - 80); ctx.rotate(-0.06);
      ctx.fillText("Pequenas escolhas", 0, 0);
      ctx.fillText("grandes mudanças", 0, 32);
      // Subtle arrow pointing left toward wheel
      ctx.strokeStyle = "rgba(167,139,250,0.25)"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(-180, -10); ctx.lineTo(-80, -10); ctx.stroke();
      ctx.setLineDash([]);
      // Small arrowhead
      ctx.fillStyle = "rgba(167,139,250,0.3)";
      ctx.beginPath(); ctx.moveTo(-90, -10); ctx.lineTo(-80, -17); ctx.lineTo(-80, -3); ctx.closePath(); ctx.fill();
      ctx.restore();

      // Note 2 — above bottom card, centered
      const cardStartY = wheelY + wheelSize + 90;
      ctx.save();
      ctx.fillStyle = "rgba(167,139,250,0.35)"; ctx.font = "italic 400 22px 'Segoe Script', 'Brush Script MT', cursive, sans-serif"; ctx.textAlign = "center";
      ctx.translate(W / 2, cardStartY - 22); ctx.rotate(-0.04);
      ctx.fillText("Menos é mais. Escolho o que importa.", 0, 0);
      ctx.restore();

      // ── 7. BOTTOM CARD — "MEU FOCO DA SEMANA" ──────────────────
      const cardW = 900, cardX = (W - cardW) / 2;
      const cardHeaderY = cardStartY + 30;
      const cardPadding = 36;
      const cardBottomY = cardHeaderY + 380;
      const cardRadius = 28;

      // Glass card background
      ctx.fillStyle = "rgba(26,26,36,0.85)"; ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1;
      drawRoundRect(ctx, cardX, cardStartY, cardW, cardBottomY - cardStartY, cardRadius); ctx.fill(); ctx.stroke();

      // Card header
      ctx.fillStyle = "#FFFFFF"; ctx.font = "600 28px Inter, system-ui, -apple-system, sans-serif"; ctx.textAlign = "left";
      ctx.fillText("🎯  Meu foco da semana", cardX + cardPadding, cardHeaderY);

      // ── Mini cards ──
      const stoneDefs: { emoji: string; title: string; desc: string; color: string }[] = [
        { emoji: "🚀", title: "Crescer na carreira", desc: "Dar um passo decisivo.", color: "#5EEAD4" },
        { emoji: "🏋️", title: "Cuidar do corpo", desc: "Energia para viver com presença.", color: "#7C5CFF" },
        { emoji: "💗", title: "Fortalecer relações", desc: "Tempo de qualidade com quem importa.", color: "#EC4899" },
      ];

      // Override with actual stones if available
      const activeStones = (stones || []).filter(Boolean);
      if (activeStones.length > 0) {
        activeStones.forEach((s, idx) => {
          if (idx < 3 && s) {
            stoneDefs[idx].title = s.length > 28 ? s.slice(0, 26) + "…" : s;
            stoneDefs[idx].desc = "Meu compromisso desta semana.";
          }
        });
      }

      const miniGap = 18, miniW = (cardW - cardPadding * 2 - miniGap * 2) / 3, miniH = 220;
      const miniY = cardHeaderY + 36;

      stoneDefs.forEach((sd, idx) => {
        const mx = cardX + cardPadding + idx * (miniW + miniGap);
        // Mini card bg
        ctx.fillStyle = "rgba(15,15,20,0.7)"; ctx.strokeStyle = `rgba(${sd.color === "#5EEAD4" ? "94,234,212" : sd.color === "#7C5CFF" ? "124,92,255" : "236,72,153"},0.2)`; ctx.lineWidth = 1;
        drawRoundRect(ctx, mx, miniY, miniW, miniH, 18); ctx.fill(); ctx.stroke();
        // Colored top glow line
        const topGlow = ctx.createLinearGradient(mx, miniY, mx + miniW, miniY);
        topGlow.addColorStop(0, "transparent");
        topGlow.addColorStop(0.5, sd.color);
        topGlow.addColorStop(1, "transparent");
        ctx.strokeStyle = topGlow; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(mx + 20, miniY + 2); ctx.lineTo(mx + miniW - 20, miniY + 2); ctx.stroke();

        // Emoji — bigger
        ctx.fillStyle = "#FFFFFF"; ctx.font = "42px Inter, system-ui, -apple-system, sans-serif"; ctx.textAlign = "center";
        ctx.fillText(sd.emoji, mx + miniW / 2, miniY + 58);
        // Title — bigger
        ctx.fillStyle = "#FFFFFF"; ctx.font = "600 19px Inter, system-ui, -apple-system, sans-serif";
        ctx.fillText(sd.title, mx + miniW / 2, miniY + 100);
        // Description — bigger
        ctx.fillStyle = "#A0A0B3"; ctx.font = "400 15px Inter, system-ui, -apple-system, sans-serif";
        ctx.fillText(sd.desc, mx + miniW / 2, miniY + 132);
      });

      // ── 8. HERO STATEMENT ──────────────────────────────────────
      const heroY = cardBottomY + 60;
      ctx.font = "700 50px Inter, system-ui, -apple-system, sans-serif"; ctx.textAlign = "center";
      const planejoW = ctx.measureText("Planejo hoje, ").width;
      const vivoW = ctx.measureText("vivo meu amanhã.").width;
      const heroStartX = (W - planejoW - vivoW) / 2;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("Planejo hoje, ", heroStartX + planejoW / 2, heroY);
      const vivoGrad = ctx.createLinearGradient(heroStartX + planejoW, heroY, heroStartX + planejoW + vivoW, heroY);
      vivoGrad.addColorStop(0, "#7C5CFF"); vivoGrad.addColorStop(1, "#A78BFA");
      ctx.fillStyle = vivoGrad;
      ctx.fillText("vivo meu amanhã.", heroStartX + planejoW + vivoW / 2, heroY);

      // ── 9. FOOTER ──────────────────────────────────────────────
      const footerY = H - 180;
      // Heart outline icon
      const heartX = W / 2, heartY = footerY;
      ctx.fillStyle = "rgba(124,92,255,0.15)"; ctx.strokeStyle = "rgba(167,139,250,0.4)"; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(heartX, heartY + 8);
      ctx.bezierCurveTo(heartX, heartY + 2, heartX - 14, heartY - 6, heartX - 14, heartY - 14);
      ctx.bezierCurveTo(heartX - 14, heartY - 24, heartX - 4, heartY - 22, heartX, heartY - 14);
      ctx.bezierCurveTo(heartX + 4, heartY - 22, heartX + 14, heartY - 24, heartX + 14, heartY - 14);
      ctx.bezierCurveTo(heartX + 14, heartY - 6, heartX, heartY + 2, heartX, heartY + 8);
      ctx.fill(); ctx.stroke();

      // MAYA
      ctx.fillStyle = "#A78BFA"; ctx.font = "500 20px Inter, system-ui, -apple-system, sans-serif"; ctx.textAlign = "center";
      ctx.fillText("MAYA", W / 2, heartY + 46);

      // Tagline
      ctx.fillStyle = "#6A657A"; ctx.font = "400 15px Inter, system-ui, -apple-system, sans-serif";
      ctx.fillText("SUA MELHOR VERSÃO, TODOS OS DIAS.", W / 2, heartY + 76);

      // ── 10. EXPORT & SHARE ─────────────────────────────────────
      const pngBlob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/png"));
      URL.revokeObjectURL(svgUrl);
      if (!pngBlob) return;
      const file = new File([pngBlob], "roda-da-vida.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Minha Roda da Vida" });
      } else {
        const a = document.createElement("a"); a.href = URL.createObjectURL(pngBlob); a.download = "roda-da-vida.png"; a.click();
      }
    } catch { /* cancelled */ }
    setSharing(false);
  }, [totalPlanned, totalDone, pctGlobal, weekLabel, stones, mounted, progress]);

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, position: "relative" }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em", color: "#e0d6ff" }}>
            Roda da Vida
          </p>
          <p style={{ margin: "1px 0 0", fontSize: 10, color: "#6a657a", fontWeight: 500 }}>
            Como sua energia está distribuída
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {totalPlanned > 0 && (
            <div style={{
              background: "rgba(124,92,255,0.08)", borderRadius: 20,
              padding: "4px 12px", border: "1px solid rgba(124,92,255,0.12)",
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#A78BFA" }}>{pctGlobal}%</span>
              <span style={{ fontSize: 9, color: "#6a657a", marginLeft: 4 }}>concluído</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            aria-label="Compartilhar Roda da Vida"
            style={{
              width: 32, height: 32, borderRadius: 10, border: "1px solid rgba(167,139,250,0.15)",
              background: "rgba(124,92,255,0.06)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: sharing ? 0.5 : 1,
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
        </div>
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

        <svg ref={svgRef} viewBox="0 0 320 320" style={{ width: "100%", maxWidth: 300 }}>
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

          {/* Grid rings — visible, alive */}
          <polygon points={outerRing} fill="none" stroke="rgba(124,92,255,0.25)" strokeWidth="1.5" />
          <polygon points={ring75}  fill="none" stroke="rgba(167,139,250,0.15)" strokeWidth="0.8" />
          <polygon points={ring50}  fill="none" stroke="rgba(167,139,250,0.1)" strokeWidth="0.7" />
          <polygon points={ring25}  fill="none" stroke="rgba(167,139,250,0.06)" strokeWidth="0.5" />

          {/* Axis lines — each with its area color, visible */}
          {AREAS.map((a, i) => {
            const [ex, ey] = ringPt(i, 1).split(",");
            return <line key={i} x1={CX} y1={CY} x2={ex} y2={ey} stroke={a.color} strokeWidth="0.6" opacity="0.35" />;
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
            const lx = CX + (R + 26) * Math.cos(a2);
            const ly = CY + (R + 26) * Math.sin(a2);
            const pct = mounted ? progress[i] : 0;
            const planPct = mounted ? planned[i] : 0;
            const empty = pct === 0 && planPct === 0;
            const customEmoji = emojis?.[a.key];
            return (
              <g key={a.key} opacity={empty ? 0.4 : 1} style={{ transition: "opacity .6s" }}>
                {customEmoji ? (
                  <image href={customEmoji} x={lx - 12} y={ly - 16} width="24" height="24" />
                ) : (
                  <text x={lx} y={ly - 3} textAnchor="middle" dominantBaseline="middle" fontSize="16">
                    {a.emoji}
                  </text>
                )}
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
