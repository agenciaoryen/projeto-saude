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
    <Card className="rounded-2xl border-emerald-200/50 dark:border-emerald-800/30 bg-gradient-to-br from-emerald-50/30 to-transparent dark:from-emerald-950/10">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ChefHat className="size-4 text-emerald-600" />
          <span className="text-sm font-medium">Assistente Nutri</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
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
                className={`text-sm ${msg.role === "user"
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 ml-6 rounded-xl rounded-tr-sm px-3 py-2"
                  : "bg-muted/60 mr-6 rounded-xl rounded-tl-sm px-3 py-2"
                }`}
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
            className="size-9 rounded-xl shrink-0 bg-emerald-600 hover:bg-emerald-700"
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
