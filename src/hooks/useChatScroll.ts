"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseChatScrollOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  messageCount: number;
  typing: boolean;
  hydrated: boolean;
}

/**
 * Manages scroll behavior for a chat interface:
 * - Auto-scrolls to bottom on new messages
 * - Maintains scroll position during container resize (keyboard, textarea growth)
 * - Tracks whether the user has manually scrolled up
 */
export function useChatScroll({
  containerRef,
  bottomRef,
  messageCount,
  typing,
  hydrated,
}: UseChatScrollOptions) {
  const isAtBottomRef = useRef(true);
  const prevMessageCountRef = useRef(messageCount);

  const checkAtBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, [containerRef]);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "instant") => {
      bottomRef.current?.scrollIntoView({ block: "end", behavior });
    },
    [bottomRef],
  );

  // ── ResizeObserver: mantém scroll no bottom quando o container muda de altura ──
  // Dispara ANTES do paint — elimina o flash/bounce quando o textarea expande
  // ou o teclado abre/fecha. Usa scrollIntoView por ser mais confiável que
  // scrollTop puro (lida corretamente com flex spacers).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let prevClientHeight = el.clientHeight;

    const ro = new ResizeObserver(() => {
      const newClientHeight = el.clientHeight;

      // Container encolheu (teclado abriu, textarea foi pra 3ª+ linha)
      // → mantém última mensagem visível SEMPRE que o usuário está no bottom
      if (newClientHeight < prevClientHeight && isAtBottomRef.current) {
        bottomRef.current?.scrollIntoView({ block: "end", behavior: "instant" });
      }
      // Conteúdo cresceu (nova msg, typing indicator) → segue se estiver no bottom
      else if (isAtBottomRef.current) {
        bottomRef.current?.scrollIntoView({ block: "end", behavior: "instant" });
      }

      prevClientHeight = newClientHeight;
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, bottomRef]);

  // ── Scroll to bottom on new messages ──
  useEffect(() => {
    if (!hydrated) return;

    if (messageCount > prevMessageCountRef.current) {
      if (isAtBottomRef.current) {
        scrollToBottom("instant");
      }
    }
    prevMessageCountRef.current = messageCount;
  }, [messageCount, hydrated, scrollToBottom]);

  // ── Scroll to bottom when typing indicator appears ──
  useEffect(() => {
    if (typing && isAtBottomRef.current) {
      scrollToBottom("instant");
    }
  }, [typing, scrollToBottom]);

  // ── Initial scroll to bottom after hydration ──
  useEffect(() => {
    if (hydrated) {
      requestAnimationFrame(() => {
        scrollToBottom("instant");
      });
    }
  }, [hydrated, scrollToBottom]);

  // ── Track scroll position on user scroll ──
  const handleScroll = useCallback(() => {
    isAtBottomRef.current = checkAtBottom();
  }, [checkAtBottom]);

  return { handleScroll, scrollToBottom, isAtBottomRef };
}
