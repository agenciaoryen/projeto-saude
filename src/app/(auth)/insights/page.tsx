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
  // Simulate human typing: ~30ms per char, min 600ms, max 2200ms
  const ms = Math.round(text.length * 30);
  return Math.max(600, Math.min(2200, ms));
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
  const [sending, setSending] = useState(false); // waiting for API
  const [typing, setTyping] = useState(false); // Maya "digitando..."
  const [hydrated, setHydrated] = useState(false);
  const [userName, setUserName] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendingRef = useRef(false); // track across async ops

  // Load cached messages + profile
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

  // Sync profile
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.name) setUserName(data.name);
      })
      .catch(() => {});
  }, []);

  // Persist messages
  useEffect(() => {
    if (hydrated && messages.length > 0) {
      localStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(messages.slice(-50)));
    }
  }, [messages, hydrated]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Auto-resize textarea
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
      const part = parts[i];
      // Show typing
      setTyping(true);
      // Wait proportional to message length
      await new Promise((r) => setTimeout(r, typingDelayFor(part)));
      setTyping(false);
      // Add message
      const msg: Message = { role: "assistant", content: part, time: formatTime() };
      current = [...current, msg];
      setMessages(current);
      // Small gap between consecutive messages from Maya
      if (i < parts.length - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }
    sendingRef.current = false;
  }, []);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending || sendingRef.current) return;

    const now = formatTime();
    const userMsg: Message = { role: "user", content: trimmed, time: now };
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
  const showTyping = typing || sending;

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[100dvh] bg-background">
      {/* Header — WhatsApp style */}
      <div className="shrink-0 flex items-center gap-3 px-3 py-2 border-b border-border bg-background/95 backdrop-blur-sm safe-top">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="size-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors -ml-1"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </button>

        <div className="size-9 rounded-full overflow-hidden shrink-0 bg-primary/10">
          <img src="/Maya.png" alt="Maya" className="size-full object-cover" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">Maya</p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            {typing ? t("maya_typing") : t("maya_subtitle")}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        {hydrated && messages.length === 0 && (
          <div className="flex justify-center py-8">
            <div className="bg-muted/60 rounded-xl px-4 py-3 text-sm text-center max-w-[85%] text-muted-foreground">
              {welcomeMessage}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const prev = i > 0 ? messages[i - 1] : null;
          const isConsecutive = prev?.role === msg.role;
          const showAvatar = msg.role === "assistant" && !isConsecutive;

          return (
            <div
              key={i}
              className={`flex items-end gap-1.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* Maya avatar — only on first in a group */}
              <div className="size-7 shrink-0">
                {showAvatar && (
                  <div className="size-7 rounded-full overflow-hidden bg-primary/10">
                    <img src="/Maya.png" alt="Maya" className="size-full object-cover" />
                  </div>
                )}
              </div>

              <div
                className={`relative max-w-[80%] px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#d9fdd3] dark:bg-[#005c4b] rounded-xl rounded-br-sm"
                    : "bg-muted rounded-xl rounded-bl-sm"
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>
                <span className="inline-block text-[10px] text-muted-foreground/70 ml-2 float-right mt-1 translate-y-0.5">
                  {msg.time}
                </span>
              </div>

              {/* Spacer for user side */}
              <div className="size-7 shrink-0" />
            </div>
          );
        })}

        {/* Typing indicator */}
        {showTyping && (
          <div className="flex items-end gap-1.5">
            <div className="size-7 shrink-0">
              <div className="size-7 rounded-full overflow-hidden bg-primary/10">
                <img src="/Maya.png" alt="Maya" className="size-full object-cover" />
              </div>
            </div>
            <div className="bg-muted rounded-xl rounded-bl-sm px-3 py-3 max-w-[80%]">
              <div className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-primary/40 animate-bounce [animation-delay:0ms]" />
                <span className="size-2 rounded-full bg-primary/40 animate-bounce [animation-delay:150ms]" />
                <span className="size-2 rounded-full bg-primary/40 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
            <div className="size-7 shrink-0" />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input — fixed at bottom */}
      <div className="shrink-0 px-3 py-2.5 border-t border-border bg-background safe-bottom">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("maya_placeholder")}
            disabled={sending || typing}
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-border bg-muted/60 px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
          <Button
            size="icon"
            className="rounded-full size-10 shrink-0"
            onClick={sendMessage}
            disabled={!input.trim() || sending || typing}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
