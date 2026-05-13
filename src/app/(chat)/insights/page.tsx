"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/useTranslation";
import { Send, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
  time: string;
  seen?: boolean;
}

const CHAT_CACHE_KEY = "maya_chat";

function formatTime(): string {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
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
  } catch { /* noop */ }
  return null;
}

export default function MayaChatPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [userName, setUserName] = useState("");
  const [viewportH, setViewportH] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendingRef = useRef(false);
  const fullHeightRef = useRef(0);

  // Shrink container to visual viewport so nothing hides behind keyboard
  useEffect(() => {
    // Save initial height before any keyboard activity
    fullHeightRef.current = window.innerHeight;

    const onViewportChange = () => {
      const vv = window.visualViewport;
      if (!vv) return;

      window.scrollTo(0, 0);

      const h = vv.height;
      setViewportH(h);
      // Compare against the original full height, not current innerHeight
      setKeyboardOpen(fullHeightRef.current - h > 80);
    };

    window.visualViewport?.addEventListener("resize", onViewportChange);
    window.visualViewport?.addEventListener("scroll", onViewportChange);
    onViewportChange();

    return () => {
      window.visualViewport?.removeEventListener("resize", onViewportChange);
      window.visualViewport?.removeEventListener("scroll", onViewportChange);
    };
  }, []);

  useEffect(() => {
    const cache = loadProfileCache();
    if (cache?.name) setUserName(cache.name);

    try {
      const cached = localStorage.getItem(CHAT_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch { /* noop */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.name) setUserName(data.name);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (hydrated && messages.length > 0) {
      localStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(messages.slice(-50)));
    }
  }, [messages, hydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, viewportH]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 100) + "px";
    }
  }, [input]);

  const deliverParts = useCallback(async (parts: string[], baseMessages: Message[]) => {
    sendingRef.current = true;
    let current = [...baseMessages];

    for (let i = 0; i < parts.length; i++) {
      setTyping(true);
      await new Promise((r) => setTimeout(r, typingDelayFor(parts[i])));
      setTyping(false);
      current = [...current, { role: "assistant", content: parts[i], time: formatTime() }];
      setMessages(current);
      if (i < parts.length - 1) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    setMessages(prev => {
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
  }, []);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending || sendingRef.current) return;

    const now = formatTime();
    const userMsg: Message = { role: "user", content: trimmed, time: now, seen: false };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setSending(true);

    try {
      const contextMsgs = updated.slice(-20).map(({ role, content }) => ({ role, content }));
      const res = await fetch("/api/maya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: contextMsgs }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const parts = splitIntoParts(data.reply);
      setSending(false);
      deliverParts(parts, updated);
    } catch {
      setSending(false);
      setMessages([...updated, { role: "assistant", content: t("maya_error"), time: formatTime() }]);
    }
  }, [input, sending, messages, t, deliverParts]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const welcomeMessage = t("maya_welcome");
  const busy = sending || typing;

  return (
    <div
      className="flex flex-col bg-chat"
      style={{ height: viewportH > 0 ? `${viewportH}px` : "100dvh" }}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 bg-background border-b border-border safe-top">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="size-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors -ml-1"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </button>

        <div className="size-10 rounded-full overflow-hidden shrink-0">
          <img src="/Maya.png" alt="Maya" className="size-full object-cover" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">Maya</p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            {typing ? t("maya_typing") : t("maya_subtitle")}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {hydrated && messages.length === 0 && welcomeMessage && (
          <div className="flex justify-center pt-12">
            <div className="bg-background/80 rounded-lg px-4 py-3 text-sm text-center max-w-sm text-muted-foreground shadow-sm">
              <div className="whitespace-pre-line">{welcomeMessage}</div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const next = i < messages.length - 1 ? messages[i + 1] : null;
          const isLastInGroup = next?.role !== msg.role;

          if (msg.role === "assistant") {
            return (
              <div key={i} className="flex justify-start">
                <div className={`max-w-[85%] px-3 py-2 bg-muted text-sm leading-relaxed ${
                  isLastInGroup ? "rounded-xl rounded-bl-sm mb-1.5" : "rounded-xl rounded-bl-sm"
                }`}>
                  <div className="whitespace-pre-line">{msg.content}</div>
                  <span className="text-[10px] text-muted-foreground/55 float-right ml-3 translate-y-0.5">
                    {msg.time}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div key={i} className={`flex justify-end ${isLastInGroup ? "mb-1.5" : ""}`}>
              <div className="max-w-[85%] px-3 py-2 bg-primary text-primary-foreground text-sm leading-relaxed rounded-xl rounded-br-sm">
                <div className="whitespace-pre-line">{msg.content}</div>
                <span className="text-[10px] text-primary-foreground/45 float-right ml-1 translate-y-0.5">
                  {msg.time}
                  {msg.seen ? (
                    <span className="ml-0.5 opacity-70">✓✓</span>
                  ) : (
                    <span className="ml-0.5 opacity-50">✓</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}

        {typing && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl rounded-bl-sm px-3 py-3">
              <div className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-foreground/25 animate-bounce [animation-delay:0ms]" />
                <span className="size-2 rounded-full bg-foreground/25 animate-bounce [animation-delay:150ms]" />
                <span className="size-2 rounded-full bg-foreground/25 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        className="shrink-0 px-3 pt-2.5 bg-background border-t border-border"
        style={{
          paddingBottom: keyboardOpen
            ? "calc(8px + env(safe-area-inset-bottom, 0px))"
            : "calc(80px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              setTimeout(() => {
                setViewportH(0);
                setKeyboardOpen(false);
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    if (messagesRef.current) {
                      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
                    }
                  });
                });
              }, 100);
            }}
            placeholder={t("maya_placeholder")}
            disabled={busy}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-muted/60 px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
          <Button
            size="icon"
            className="rounded-full size-10 shrink-0"
            onClick={sendMessage}
            disabled={!input.trim() || busy}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
