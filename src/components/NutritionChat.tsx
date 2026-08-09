"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, ChefHat, ChevronDown } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
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

export function NutritionChat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: "user", content };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setExpanded(true);
    setLoading(true);

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
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Erro ao processar. Tente novamente." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ borderRadius: 16, border: "1px solid oklch(.58 .18 270 / .15)", background: "linear-gradient(135deg, oklch(.58 .18 270 / .06), transparent)" }}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ChefHat style={{ width: 16, height: 16, color: "oklch(.58 .18 270)" }} />
          <span className="text-sm font-medium">Assistente Nutri</span>
          <span style={{
            fontSize: 10,
            background: "oklch(.58 .18 270 / .12)",
            color: "oklch(.58 .18 270)",
            padding: "2px 6px",
            borderRadius: 9999,
          }}>
            IA
          </span>
          {!expanded && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="size-4" />
            </button>
          )}
        </div>

        {/* Histórico de mensagens (quando expandido) */}
        {expanded && (
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {messages.map((msg, i) => (
              <div
                key={i}
                style={msg.role === "user" ? {
                  fontSize: 13,
                  background: "oklch(.58 .18 270 / .10)",
                  color: "#e0d6ff",
                  marginLeft: 24,
                  borderRadius: "12px 12px 4px 12px",
                  padding: "8px 12px",
                } : {
                  fontSize: 13,
                  background: "oklch(.16 .012 270 / .6)",
                  marginRight: 24,
                  borderRadius: "12px 12px 12px 4px",
                  padding: "8px 12px",
                }}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2">
                <Loader2 className="size-3 animate-spin" />
                Analisando...
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Sugestões (quando não expandido) */}
        {!expanded && messages.length <= 1 && (
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="text-[11px] bg-muted/60 hover:bg-muted px-2.5 py-1.5 rounded-full text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Textarea
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
            className="resize-none rounded-xl text-sm min-h-0 h-9 py-2"
          />
          <Button
            size="icon"
            style={{ width: 36, height: 36, borderRadius: 12, background: "oklch(.58 .18 270)", flexShrink: 0 }}
            disabled={loading || !input.trim()}
            onClick={() => send()}
          >
            <Send className="size-4" />
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          Assistente virtual — não substitui um nutricionista
        </p>
      </CardContent>
    </Card>
  );
}
