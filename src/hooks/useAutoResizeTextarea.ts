"use client";

import { useEffect, useRef } from "react";

/**
 * Auto-resizes a textarea element as the user types.
 * Uses requestAnimationFrame for smooth, jank-free height transitions.
 *
 * The textarea should have CSS `transition: height 120ms ease-out` for
 * smooth animation between height changes.
 */
export function useAutoResizeTextarea(
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
  value: string,
) {
  const rafRef = useRef(0);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    // Use rAF so the resize happens in the same frame as the render,
    // preventing layout thrashing
    rafRef.current = requestAnimationFrame(() => {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, textareaRef]);
}
