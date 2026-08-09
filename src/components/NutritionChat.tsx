"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, Send, ChefHat, ChevronDown, ChevronUp } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: "Olá! Sou seu assistente de nutrição. Posso analisar seus dados, identificar padrões e tirar dúvidas sobre alimentação. O que quer saber?",
};

const SUGGESTIONS = [
  "O que posso melhorar no meu café da manhã?",
  "Como está minha proteína essa semana?",
  "Qual alimento nunca como e faria diferença?",
  "Minhas refeições estão equilibradas?",
];

const PAGE_SIZE = 200;

export function NutritionChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history on mount
  const loadMessages = useCallback((before?: string) => {
    const url = before
      ? `/api/nutrition/chat/messages?before=${encodeURIComponent(before)}`
      : "/api/nutrition/chat/messages";

    return fetch(url)
      .then((res) => res.json())
      .then((rows: Array<{ role: string; content: string; created_at: string }>) => {
        if (!Array.isArray(rows)) return [];
        return [...rows]
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((r) => ({ role: r.role as "user" | "assistant", content: r.content, createdAt: r.created_at }));
      });
  }, []);

  useEffect(() => {
    loadMessages()
      .then((msgs) => {
        if (msgs.length > 0) {
          setMessages(msgs);
          setHasMore(msgs.length >= PAGE_SIZE);
          setExpanded(true);
        } else {
          setMessages([WELCOME_MESSAGE]);
        }
        setHydrated(true);
      })
      .catch(() => {
        setMessages([WELCOME_MESSAGE]);
        setHydrated(true);
      });
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const persist = (role: "user" | "assistant", content: string) => {
    fetch("/api/nutrition/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role, content }] }),
    }).catch(() => {});
  };

  const send = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: "user", content };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setExpanded(true);
    setLoading(true);

    // Persist user message
    persist("user", content);

    try {
      const res = await fetch("/api/nutrition/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      const reply = data.reply || "Desculpe, não consegui processar isso. Tente novamente.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      // Persist assistant reply
      persist("assistant", reply);
    } catch {
      const fallback = "Erro ao processar. Tente novamente.";
      setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
      persist("assistant", fallback);
    } finally {
      setLoading(false);
    }
  };

  const loadOlder = async () => {
    // Find the oldest message with a createdAt timestamp
    const oldest = messages.find((m) => m.createdAt);
    if (!oldest?.createdAt || loadingOlder) return;

    // Remember scroll height before prepending
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;

    setLoadingOlder(true);
    try {
      const older = await loadMessages(oldest.createdAt);
      if (older.length > 0) {
        setMessages((prev) => [...older, ...prev]);
        setHasMore(older.length >= PAGE_SIZE);
      } else {
        setHasMore(false);
      }
      // Maintain scroll position after prepending
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight;
      });
    } catch {
      // silent
    } finally {
      setLoadingOlder(false);
    }
  };

  if (!hydrated) return null;

  const showWelcome = messages.length === 1 && messages[0].content === WELCOME_MESSAGE.content;

  return (
    <div style={{
      borderRadius: 16, border: "1px solid oklch(.58 .18 270 / .15)",
      background: "linear-gradient(135deg, oklch(.58 .18 270 / .06), transparent)",
      padding: 16, display: "flex", flexDirection: "column", gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ChefHat style={{ width: 16, height: 16, color: "oklch(.58 .18 270)" }} />
        <span style={{ fontSize: 14, fontWeight: 500, color: "#e0d6ff" }}>Assistente Nutri</span>
        <span style={{
          fontSize: 10, background: "oklch(.58 .18 270 / .12)",
          color: "oklch(.58 .18 270)", padding: "2px 6px", borderRadius: 9999,
        }}>
          IA
        </span>
        {!expanded && (
          <button type="button" onClick={() => setExpanded(!expanded)}
            style={{ marginLeft: "auto", background: "none", border: 0, cursor: "pointer", color: MUTED, padding: 4 }}>
            <ChevronDown style={{ width: 16, height: 16 }} />
          </button>
        )}
      </div>

      {/* Histórico de mensagens */}
      {expanded && (
        <div ref={scrollRef} style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 288, overflowY: "auto" }}>

          {/* Load older */}
          {hasMore && (
            <div style={{ textAlign: "center" }}>
              <button type="button" onClick={loadOlder} disabled={loadingOlder}
                style={{
                  background: "none", border: 0, cursor: "pointer", fontFamily: "inherit",
                  fontSize: 11, color: MUTED, display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "4px 12px",
                }}>
                {loadingOlder ? (
                  <><Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} /> Carregando...</>
                ) : (
                  <><ChevronUp style={{ width: 14, height: 14 }} /> Mensagens anteriores</>
                )}
              </button>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={msg.role === "user" ? {
              fontSize: 13, background: "oklch(.58 .18 270 / .10)", color: "#e0d6ff",
              marginLeft: 24, borderRadius: "12px 12px 4px 12px", padding: "8px 12px",
              lineHeight: 1.6, whiteSpace: "pre-wrap",
            } : {
              fontSize: 13, background: "oklch(.16 .012 270 / .6)",
              marginRight: 24, borderRadius: "12px 12px 12px 4px", padding: "8px 12px",
              lineHeight: 1.6, whiteSpace: "pre-wrap", color: "#e0d6ff",
            }}>
              {msg.content}
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: MUTED, padding: "4px 12px" }}>
              <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} />
              Analisando...
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Sugestões */}
      {!expanded && showWelcome && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SUGGESTIONS.map((s) => (
            <button key={s} type="button" onClick={() => send(s)}
              style={{
                fontSize: 11, background: "oklch(.22 .015 270 / .6)",
                padding: "6px 10px", borderRadius: 9999, border: 0, cursor: "pointer",
                color: MUTED, fontFamily: "inherit", textAlign: "left", transition: "all .15s",
              }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: 8 }}>
        <textarea
          placeholder="Pergunte sobre sua alimentação..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          style={{
            flex: 1, resize: "none", borderRadius: 12, border: "1px solid rgba(167,139,250,0.15)",
            background: "#0B0B10", color: "#e0d6ff", fontSize: 14, fontFamily: "inherit",
            padding: "10px 12px", outline: "none", minHeight: 40,
          }}
        />
        <button type="button"
          style={{
            width: 36, height: 36, borderRadius: 12, border: 0, flexShrink: 0,
            background: loading || !input.trim() ? "#1e1840" : "oklch(.58 .18 270)",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
          disabled={loading || !input.trim()}
          onClick={() => send()}>
          <Send style={{ width: 16, height: 16, color: "#fff" }} />
        </button>
      </div>

      <p style={{ fontSize: 10, color: MUTED, textAlign: "center" }}>
        Assistente virtual — não substitui um nutricionista
      </p>
    </div>
  );
}

const MUTED = "#9e96b5";
