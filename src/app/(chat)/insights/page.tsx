"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/useTranslation";
import { Send, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { MayaAvatar } from "@/components/MayaAvatar";
import { useViewportHeight } from "@/hooks/useViewportHeight";
import { useChatScroll } from "@/hooks/useChatScroll";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";

interface Message {
  role: "user" | "assistant";
  content: string;
  time: string;
  date: string;
  seen?: boolean;
  synced?: boolean;
  action?: { label: string; href: string };
}

// ── Helpers ──────────────────────────────────────────────────────────

async function persistWithRetry(
  messages: Array<{ role: string; content: string }>,
  retries = 3,
): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch("/api/maya/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    if (i < retries - 1) await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
  return false;
}

const CHAT_CACHE_KEY = "maya_chat";

function formatTime(): string {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const PT_DAYS = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira",
  "Quinta-feira", "Sexta-feira", "Sábado",
];

function getDateLabel(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  if (diff < 7) return PT_DAYS[d.getDay()];
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Sub-components ────────────────────────────────────────────────────

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center my-4">
      <span
        className="px-3 py-1 rounded-full text-[12px] font-medium select-none"
        style={{
          background: "var(--muted)",
          color: "var(--muted-foreground)",
          boxShadow: "0 1px 2px rgba(0,0,0,.12)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function splitIntoParts(text: string): string[] {
  const parts = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (parts.length > 1) return parts;

  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length <= 2) return [text];

  const groups: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    const group = sentences.slice(i, i + 2).join(" ").trim();
    if (group) groups.push(group);
  }
  return groups.length > 0 ? groups : [text];
}

function typingDelayFor(text: string): number {
  const ms = Math.round(text.length * 55);
  return Math.max(1200, Math.min(4500, ms));
}

function loadProfileCache() {
  try {
    const raw = localStorage.getItem("user_profile");
    if (raw) return JSON.parse(raw);
  } catch {
    /* noop */
  }
  return null;
}

function Ticks({ status }: { status: "sent" | "delivered" | "read" }) {
  // White tones on the purple bubble — good contrast like WhatsApp
  const color =
    status === "read"
      ? "rgba(255,255,255,0.9)"
      : status === "delivered"
        ? "rgba(255,255,255,0.5)"
        : "rgba(255,255,255,0.35)";
  const Tick = (
    <svg
      width="14" height="11" viewBox="0 0 18 13"
      fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M1.5 6.6 6 11l11-9.5" />
    </svg>
  );
  return (
    <span style={{ display: "inline-flex", alignItems: "center", color }}>
      {Tick}
      {status !== "sent" && (
        <span style={{ marginLeft: -9, display: "inline-flex" }}>{Tick}</span>
      )}
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-1.5 maya-chat-msg">
      <div
        className="rounded-[8px] px-3.5 py-2"
        style={{
          background: "var(--card)",
          boxShadow: "0 1px 0.5px rgba(11,20,26,.13)",
        }}
      >
        <div className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-[var(--maya-secondary)]/60 animate-bounce [animation-delay:0ms]" />
          <span className="size-2 rounded-full bg-[var(--maya-secondary)]/60 animate-bounce [animation-delay:150ms]" />
          <span className="size-2 rounded-full bg-[var(--maya-secondary)]/60 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function MayaChatPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Hooks ──
  const { viewportH, keyboardOpen } = useViewportHeight();
  const messagesRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── State ──
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(() => searchParams.get("draft") ?? "");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showLoadMore, setShowLoadMore] = useState(false);
  const [userName, setUserName] = useState("");

  // ── Refs ──
  const sentinelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendingRef = useRef(false);
  const nudgeActionRef = useRef<{ label: string; href: string } | null>(null);

  // ── Chat scroll management ──
  const { handleScroll } = useChatScroll({
    containerRef: messagesRef,
    bottomRef,
    messageCount: messages.length,
    typing,
    hydrated,
  });

  // ── Textarea auto-resize ──
  useAutoResizeTextarea(textareaRef, input);

  // ── Focus textarea if draft param ──
  useEffect(() => {
    if (searchParams.get("draft")) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [searchParams]);

  // ── Load messages + profile (unified) ──
  useEffect(() => {
    // Profile from localStorage (instant, for greeting)
    const cache = loadProfileCache();
    if (cache?.name) setUserName(cache.name);

    // Load messages from server
    fetch("/api/maya/messages", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const serverMsgs: Message[] = Array.isArray(data)
          ? data
              .sort((a: Message, b: Message) =>
                (a as unknown as { created_at: string }).created_at?.localeCompare?.(
                  (b as unknown as { created_at: string }).created_at,
                ) ?? 0,
              )
              .map((m: unknown) => {
                const msg = m as { role: string; content: string; created_at: string };
                return {
                  role: msg.role as "user" | "assistant",
                  content: msg.content,
                  time: new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  date: msg.created_at.slice(0, 10),
                };
              })
          : [];

        setMessages(serverMsgs);
        if (serverMsgs.length > 0) {
          localStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(serverMsgs.slice(-50)));
        }
        setHydrated(true);
      })
      .catch(() => {
        // Server unreachable — use localStorage as fallback
        try {
          const cached = localStorage.getItem(CHAT_CACHE_KEY);
          if (cached) setMessages(JSON.parse(cached));
        } catch {
          /* noop */
        }
        setHydrated(true);
      });

    // Also fetch fresh profile from API
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.name) setUserName(data.name);
      })
      .catch(() => {});
  }, []);

  // ── Load proactive nudge ──
  useEffect(() => {
    fetch("/api/maya/nudge")
      .then((r) => r.json())
      .then((data) => {
        if (data.nudges?.length > 0) {
          const nudge = data.nudges[0];
          if (nudge.action) nudgeActionRef.current = nudge.action;
          fetch("/api/maya/nudge", { method: "POST" })
            .then(() => {
              const now = formatTime();
              const today = formatDate();
              setMessages((prev) => {
                if (prev.some((m) => m.content === nudge.message)) return prev;
                return [
                  ...prev,
                  {
                    role: "assistant",
                    content: nudge.message,
                    time: now,
                    date: today,
                    action: nudge.action,
                  },
                ];
              });
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  // ── Save to localStorage on changes + page hide ──
  useEffect(() => {
    if (!hydrated || messages.length === 0) return;
    const save = () =>
      localStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(messages.slice(-50)));
    save();
    window.addEventListener("beforeunload", save);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) save();
    });
    return () => {
      window.removeEventListener("beforeunload", save);
      document.removeEventListener("visibilitychange", save);
    };
  }, [messages, hydrated]);

  // ── Deliver AI response in parts (simulated streaming) ──
  const deliverParts = useCallback(
    async (parts: string[], baseMessages: Message[]) => {
      sendingRef.current = true;
      let current = [...baseMessages];

      for (let i = 0; i < parts.length; i++) {
        setTyping(true);
        await new Promise((r) => setTimeout(r, typingDelayFor(parts[i])));
        setTyping(false);
        current = [
          ...current,
          {
            role: "assistant" as const,
            content: parts[i],
            time: formatTime(),
            date: formatDate(),
          },
        ];
        setMessages(current);
        // Fire-and-forget persist
        persistWithRetry([{ role: "assistant", content: parts[i] }]);
        if (i < parts.length - 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }

      // Mark last user message as seen
      setMessages((prev) => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === "user") {
            updated[i] = { ...updated[i], seen: true };
            break;
          }
        }
        return updated;
      });

      sendingRef.current = false;
    },
    [],
  );

  // ── Load older messages ──
  const loadOlder = async () => {
    if (messages.length === 0) return;
    const oldest = messages[0];
    if (!oldest?.date) return;
    const res = await fetch(
      `/api/maya/messages?before=${oldest.date}T${oldest.time}:00`,
    );
    if (res.ok) {
      const older: Message[] = (await res.json())
        .sort((a: { created_at: string }, b: { created_at: string }) =>
          a.created_at.localeCompare(b.created_at),
        )
        .map((m: { role: string; content: string; created_at: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          time: new Date(m.created_at).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          date: m.created_at.slice(0, 10),
        }));
      if (older.length > 0) {
        setMessages((prev) => [...older, ...prev]);
      }
      setShowLoadMore(older.length >= 200);
    }
  };

  // ── IntersectionObserver for "load older" sentinel ──
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && hydrated && messages.length >= 200) {
        setShowLoadMore(true);
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hydrated, messages.length]);

  // ── Send message ──
  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending || sendingRef.current) return;

    const now = formatTime();
    const nowDate = formatDate();
    const userMsg: Message = {
      role: "user",
      content: trimmed,
      time: now,
      date: nowDate,
      seen: false,
    };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setSending(true);
    sendingRef.current = true;

    // Keyboard stays open because send button uses onMouseDown+preventDefault
    // (focus never leaves the textarea)

    // Persist user message first so DB order is correct
    await persistWithRetry([{ role: "user", content: trimmed }]);

    // Mark as "read" immediately — Maya received the message
    // (before the API call, before the typing indicator)
    setMessages((prev) => {
      const updated2 = [...prev];
      for (let i = updated2.length - 1; i >= 0; i--) {
        if (updated2[i].role === "user") {
          updated2[i] = { ...updated2[i], seen: true };
          break;
        }
      }
      return updated2;
    });

    try {
      const contextMsgs = updated.slice(-20).map(({ role, content, date, time }) => ({
        role,
        content,
        date,
        time,
      }));
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const localHour = new Date().getHours();
      const localDate = formatDate();
      const res = await fetch("/api/maya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: contextMsgs,
          timezone: tz,
          localHour,
          localDate,
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const parts = splitIntoParts(data.reply);
      setSending(false);
      sendingRef.current = false;
      deliverParts(parts, updated);
    } catch {
      setSending(false);
      sendingRef.current = false;
      setMessages([
        ...updated,
        {
          role: "assistant",
          content: t("maya_error"),
          time: formatTime(),
          date: formatDate(),
        },
      ]);
    }
  }, [input, sending, messages, t, deliverParts]);

  // ── Keyboard handler ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Derived ──
  const welcomeMessage = t("maya_welcome");
  const busy = sending || typing;
  const containerHeight =
    viewportH > 200 ? `${viewportH}px` : "100dvh";

  // ── Render ──
  return (
    <div
      className="flex flex-col"
      style={{
        height: containerHeight,
        background: "var(--background)",
      }}
    >
      {/* ── Header ── */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 py-2.5"
        style={{
          background: "var(--chat)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="size-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors -ml-1"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </button>

        <MayaAvatar state="mini" size={36} />

        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">Maya</p>
          <p
            className="text-[11px] leading-tight"
            style={{ color: "var(--muted-foreground)" }}
          >
            {typing
              ? t("maya_typing")
              : hydrated
                ? "Online"
                : "carregando..."}
          </p>
        </div>
      </div>

      {/* ── Messages ── */}
      {/* Outer: scrollable container. Inner: min-height 100% + flex-end = pin to bottom.
           This is the proven pattern for chat UIs — when the container shrinks
           (keyboard opens, textarea grows), flex-end keeps content anchored to the
           bottom without any spacer hacks. */}
      <div
        ref={messagesRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto px-3 pt-3 pb-1"
      >
        <div
          style={{
            minHeight: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          {/* Sentinel for loading older messages */}
          <div ref={sentinelRef} style={{ height: 1, flexShrink: 0 }} />

          {/* "Load older" button */}
          {showLoadMore && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <button
                type="button"
                onClick={loadOlder}
                style={{
                  padding: "6px 14px",
                  borderRadius: 9999,
                  border: "1px solid rgba(167,139,250,0.2)",
                  background: "transparent",
                  color: "var(--maya-secondary)",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ↑ Mensagens anteriores
              </button>
            </div>
          )}

          {/* Welcome message (empty state) */}
          {hydrated && messages.length === 0 && welcomeMessage && (
            <div className="flex justify-center pt-12 maya-chat-msg">
              <div
                className="rounded-[8px] px-4 py-3 text-sm text-center max-w-sm"
                style={{
                  background: "var(--card)",
                  color: "var(--maya-text)",
                  boxShadow: "0 2px 8px oklch(0.3 0.03 270 / 0.3)",
                }}
              >
                <div className="whitespace-pre-line">{welcomeMessage}</div>
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg, i) => {
            const isAssistant = msg.role === "assistant";
            const status: "sent" | "delivered" | "read" = msg.seen
              ? "read"
              : "delivered";
            const prevMsg = i > 0 ? messages[i - 1] : null;

            let separatorLabel: string | null = null;
            if (!msg.date) {
              if (!prevMsg || prevMsg.date != null) {
                separatorLabel = "Mensagens anteriores";
              }
            } else {
              const prevDate = prevMsg?.date ?? null;
              if (msg.date !== prevDate)
                separatorLabel = getDateLabel(msg.date);
            }

            return (
              <div key={i} className="maya-chat-msg">
                {separatorLabel && <DateSeparator label={separatorLabel} />}
                <div
                  className={`flex ${isAssistant ? "justify-start" : "justify-end"} mb-1.5`}
                >
                  <div
                    className="max-w-[80%] rounded-[8px] px-3 pt-1.5 pb-2 text-[14px] leading-[1.32] whitespace-pre-line"
                    style={{
                      background: isAssistant
                        ? "var(--card)"
                        : "var(--maya-primary)",
                      color: isAssistant ? "var(--maya-text)" : "#fff",
                      boxShadow: "0 1px 0.5px rgba(11,20,26,.13)",
                    }}
                  >
                    {msg.content}
                    {msg.action && (
                      <a
                        href={msg.action.href}
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(msg.action!.href);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 8,
                          padding: "6px 12px",
                          borderRadius: 8,
                          background: "var(--maya-primary)",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        {msg.action.label} →
                      </a>
                    )}
                    {/* Time + ticks for user messages only */}
                    {!isAssistant && (
                      <span
                        className="text-[11px] leading-none whitespace-nowrap"
                        style={{
                          float: "right",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          margin: "8px -4px -5px 8px",
                          color: "rgba(255,255,255,0.7)",
                        }}
                      >
                        {msg.time}
                        <Ticks status={status} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {typing && <TypingIndicator />}

          {/* Bottom sentinel */}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input bar ── */}
      <div
        className="shrink-0 px-3 pt-2.5"
        style={{
          background: "var(--chat)",
          borderTop: "1px solid var(--border)",
          paddingBottom: keyboardOpen
            ? "calc(8px + env(safe-area-inset-bottom, 0px))"
            : "calc(32px + env(safe-area-inset-bottom, 16px))",
        }}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("maya_placeholder")}
            disabled={busy}
            rows={1}
            className="maya-chat-input flex-1 resize-none rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
            style={{
              background: "var(--background)",
              borderColor: "var(--border)",
              color: "var(--maya-text)",
            }}
          />
          <Button
            size="icon"
            className="rounded-full size-10 shrink-0"
            style={{ background: "var(--maya-primary)" }}
            onMouseDown={(e) => {
              e.preventDefault(); // prevent textarea blur → keyboard stays open
              sendMessage();
            }}
            disabled={!input.trim() || busy}
          >
            <Send className="size-4" color="#fff" />
          </Button>
        </div>
      </div>
    </div>
  );
}
