"use client";

import { useEffect, useRef } from "react";

/**
 * Auto-resizes a textarea element as the user types, and keeps the
 * chat messages scrolled to the bottom when the textarea grows.
 *
 * The textarea should have CSS `transition: height 120ms ease-out` for
 * smooth animation between height changes.
 */
export function useAutoResizeTextarea(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
  messagesRef: React.RefObject<HTMLDivElement | null>,
) {
  const rafRef = useRef(0);

  useEffect(() => {
    const ta = textareaRef.current;
    const mc = messagesRef.current;
    if (!ta) return;

    const prevHeight = ta.clientHeight;

    rafRef.current = requestAnimationFrame(() => {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";

      // If textarea grew (new line added), scroll messages to keep
      // the last message visible above the input. This is the direct,
      // reliable fix — no ResizeObserver timing issues.
      if (ta.clientHeight > prevHeight && mc) {
        mc.scrollTop = mc.scrollHeight;
      }
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, textareaRef, messagesRef]);
}
