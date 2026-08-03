"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseChatScrollOptions {
  /** Ref to the scrollable messages container */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Ref to the bottom sentinel element */
  bottomRef: React.RefObject<HTMLDivElement | null>;
  /** Total number of messages — scroll to bottom when this increases */
  messageCount: number;
  /** Whether the AI is currently typing (shows typing indicator) */
  typing: boolean;
  /** Whether initial data has loaded */
  hydrated: boolean;
}

/**
 * Manages scroll behavior for a chat interface:
 * - Auto-scrolls to bottom on new messages
 * - Maintains scroll position during container resize (keyboard, textarea growth)
 * - Tracks whether the user has manually scrolled up (to not interrupt reading history)
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

  // Check if the user is scrolled near the bottom (within 80px)
  const checkAtBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, [containerRef]);

  // Scroll to bottom (used when new messages arrive)
  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "instant") => {
      bottomRef.current?.scrollIntoView({ block: "end", behavior });
    },
    [bottomRef],
  );

  // ── ResizeObserver: maintain scroll position when container resizes ──
  // This fires BEFORE paint, eliminating the flash/bounce when the
  // textarea grows or the keyboard opens/closes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let prevScrollHeight = el.scrollHeight;
    let prevClientHeight = el.clientHeight;

    const ro = new ResizeObserver(() => {
      const newScrollHeight = el.scrollHeight;
      const newClientHeight = el.clientHeight;

      // If we were at the bottom, stay at the bottom after resize
      if (isAtBottomRef.current) {
        // Content grew (typing indicator appeared, new message part, etc.)
        if (newScrollHeight > prevScrollHeight) {
          el.scrollTop = newScrollHeight - newClientHeight;
        }
        // Container shrunk (keyboard opened)
        else if (newClientHeight < prevClientHeight) {
          el.scrollTop = newScrollHeight - newClientHeight;
        }
      }

      prevScrollHeight = newScrollHeight;
      prevClientHeight = newClientHeight;
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  // ── Scroll to bottom on new messages ──
  useEffect(() => {
    if (!hydrated) return;

    // Always scroll to bottom when message count increases
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
      // Small delay to let the DOM paint first
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
