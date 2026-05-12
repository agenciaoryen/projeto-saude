"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/useTranslation";
import { Send, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_CACHE_KEY = "maya_chat";

function splitIntoParts(text: string): string[] {
  // Split by double newline (paragraph breaks)
  const parts = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (parts.length > 1) return parts;

  // If single paragraph, split long ones by sentence groups
  const sentences = text.split(/(?<=[.!?])\s+/);
  if (sentences.length <= 2) return [text];

  // Group sentences into pairs for natural delivery
  const groups: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    const group = sentences.slice(i, i + 2).join(" ").trim();
    if (group) groups.push(group);
  }
  return groups.length > 0 ? groups : [text];
}

function loadProfileCache() {
  try {
    const raw = localStorage.getItem("user_profile");
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return null;
}

export default function MayaChatPage() {
  const { t, lang } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load cached messages + profile on mount
  useEffect(() => {
    const cache = loadProfileCache();
    if (cache?.avatar_url) setAvatarUrl(cache.avatar_url);
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

  // Sync profile from API
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
        if (data.name) setUserName(data.name);
      })
      .catch(() => {});
  }, []);

  // Persist messages to localStorage
  useEffect(() => {
    if (hydrated && messages.length > 0) {
      // Keep only last 50 messages to avoid localStorage bloat
      const toCache = messages.slice(-50);
      localStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(toCache));
    }
  }, [messages, hydrated]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  }, [input]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const contextMsgs = updated.slice(-20);
      const res = await fetch("/api/maya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: contextMsgs }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const parts = splitIntoParts(data.reply);

      // Add first part immediately
      setMessages([...updated, { role: "assistant", content: parts[0] }]);
      setLoading(false);

      // Stagger remaining parts with delay
      if (parts.length > 1) {
        const remaining = parts.slice(1);
        const base = [...updated, { role: "assistant", content: parts[0] }];
        remaining.forEach((part, i) => {
          setTimeout(() => {
            setMessages((prev) => {
              // Avoid race: only append if not already added
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && last.content === part) return prev;
              return [...prev, { role: "assistant", content: part }];
            });
          }, (i + 1) * 1000 + Math.random() * 400);
        });
      }
    } catch {
      setMessages([...updated, { role: "assistant", content: t("maya_error") }]);
      setLoading(false);
    }
  }, [input, loading, messages, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const welcomeMessage = t("maya_welcome");

  return (
    <div className="max-w-lg mx-auto flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="text-center py-3 shrink-0">
        <h1 className="text-xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="size-4 text-primary" />
          Maya
        </h1>
        <p className="text-xs text-muted-foreground">{t("maya_subtitle")}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 py-2">
        {hydrated && messages.length === 0 && (
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-lg shrink-0 mt-0.5 overflow-hidden">
              <img src="/Maya.png" alt="Maya" className="size-full object-cover" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed max-w-[85%]">
              {welcomeMessage}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-lg shrink-0 mt-0.5 overflow-hidden">
                <img src="/Maya.png" alt="Maya" className="size-full object-cover" />
              </div>
            )}
            <div
              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%] ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-md"
                  : "bg-muted rounded-tl-md"
              }`}
            >
              <div className="whitespace-pre-line">{msg.content}</div>
            </div>
            {msg.role === "user" && (
              <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium shrink-0 mt-0.5 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  userName ? userName.charAt(0).toUpperCase() : "V"
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-lg shrink-0 mt-0.5 overflow-hidden">
              <img src="/Maya.png" alt="Maya" className="size-full object-cover" />
            </div>
            <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:0ms]" />
                <span className="size-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:150ms]" />
                <span className="size-1.5 rounded-full bg-primary/50 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 py-3 sticky bottom-16 bg-background">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("maya_placeholder")}
            disabled={loading}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
          <Button
            size="icon"
            className="rounded-xl size-10 shrink-0"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
