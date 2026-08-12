"use client";

import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";

// ── Design tokens ──────────────────────────────────────────────
const MUTED = "#9e96b5";
const PURPLE_HEX = "#7C5CFF";
const FOREGROUND = "#e0d6ff";

interface Props {
  htmlUrl: string;
  title: string;
  bookId: number;
  savedId?: string;
  initialProgress: number;
  onProgress: (progress: number) => void;
  onStart: () => void;
  onClose: () => void;
}

export function BookReader({ htmlUrl, title, bookId, savedId, initialProgress, onProgress, onStart, onClose }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressRef = useRef(initialProgress);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Marcar como "reading" ao abrir
  useEffect(() => {
    if (savedId) onStart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Salvar progresso periodicamente
  const saveProgress = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;
      const scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop;
      const scrollHeight = doc.documentElement.scrollHeight || doc.body.scrollHeight;
      const clientHeight = doc.documentElement.clientHeight || doc.body.clientHeight;
      if (scrollHeight <= clientHeight) return;
      const pct = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
      if (pct !== progressRef.current) {
        progressRef.current = pct;
        onProgress(pct);
      }
    } catch { /* cross-origin, ignore */ }
  }, [onProgress]);

  useEffect(() => {
    timerRef.current = setInterval(saveProgress, 3000);
    return () => clearInterval(timerRef.current);
  }, [saveProgress]);

  // Restaurar scroll
  const handleLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !initialProgress) return;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;
      const scrollHeight = doc.documentElement.scrollHeight || doc.body.scrollHeight;
      const clientHeight = doc.documentElement.clientHeight || doc.body.clientHeight;
      if (scrollHeight > clientHeight) {
        const target = (initialProgress / 100) * (scrollHeight - clientHeight);
        doc.documentElement.scrollTop = target;
      }
    } catch { /* ignore */ }
  }, [initialProgress]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "#0e0e16", display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px", flexShrink: 0,
        borderBottom: "1px solid rgba(167,139,250,0.1)",
        background: "oklch(.15 .015 270 / .97)",
      }}>
        <button type="button" onClick={onClose}
          style={{
            width: 36, height: 36, borderRadius: "50%", background: "none", border: 0,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: MUTED, flexShrink: 0,
          }}>
          <X style={{ width: 20, height: 20 }} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0, fontSize: 14, fontWeight: 600, color: FOREGROUND,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {title}
          </p>
          {progressRef.current > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <div style={{
                flex: 1, maxWidth: 120, height: 3, borderRadius: 9999,
                background: "oklch(.22 .015 270 / .5)", overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", borderRadius: 9999, background: PURPLE_HEX,
                  width: `${Math.min(progressRef.current, 100)}%`,
                  transition: "width 0.5s ease",
                }} />
              </div>
              <span style={{ fontSize: 10, color: MUTED }}>{progressRef.current}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Reader iframe */}
      <iframe
        ref={iframeRef}
        src={htmlUrl}
        onLoad={handleLoad}
        title={title}
        sandbox="allow-same-origin"
        style={{
          flex: 1, width: "100%", border: 0,
          background: "#f5f0e8", // cor de página de livro
        }}
      />
    </div>
  );
}
