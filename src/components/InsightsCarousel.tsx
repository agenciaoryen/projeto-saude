"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

interface Slide {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  ctaHref: string | null;
  bg: string;
  accent: string;
}

const SLIDES: Slide[] = [
  {
    eyebrow: "MAYA DETECTOU",
    title: "Padrões que você não vê",
    body: "A Maya cruza seu sono, humor e gastos para revelar conexões ocultas.",
    cta: "Ver análise",
    ctaHref: "/analise",
    bg: "linear-gradient(135deg,#2D1B69 0%,#1A1035 100%)",
    accent: "oklch(.55 .2 270)",
  },
  {
    eyebrow: "CONVERSE",
    title: "Falar com Maya é o centro do app",
    body: "Ela te conhece. Conte o que está acontecendo.",
    cta: "Conversar",
    ctaHref: "/insights",
    bg: "linear-gradient(135deg,#134E4A 0%,#0F2E2C 100%)",
    accent: "oklch(.7 .12 175)",
  },
];

function CarouselArtwork({ accent }: { accent: string }) {
  return (
    <>
      <div
        className="absolute -right-12 -top-12 w-44 h-44 rounded-full pointer-events-none opacity-[.35]"
        style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 70%)` }}
      />
      <div className="absolute -right-7 top-4 w-32 h-32 rounded-full border border-white/[.18] pointer-events-none" />
      <div className="absolute -right-3 top-9 w-20 h-20 rounded-full border border-white/[.12] pointer-events-none" />
      <div className="absolute right-5 top-5 w-14 h-14 rounded-full bg-white/[.08] backdrop-blur-md border border-white/20 pointer-events-none" />
    </>
  );
}

export function InsightsCarousel() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Auto-advance every 8s
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 8000);
    return () => clearInterval(id);
  }, []);

  const prev = useCallback(() => setIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length), []);
  const next = useCallback(() => setIdx((i) => (i + 1) % SLIDES.length), []);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only handle horizontal swipes
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) next();
      else prev();
    }
  };

  return (
    <div className="px-3.5 pt-2.5">
      <div
        className="rounded-[18px] overflow-hidden min-h-[144px] relative"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className="px-[22px] py-5 text-white min-h-[144px] overflow-hidden"
            style={{
              position: i === idx ? "relative" : "absolute",
              inset: 0,
              background: s.bg,
              opacity: i === idx ? 1 : 0,
              transition: "opacity .5s ease",
              pointerEvents: i === idx ? "auto" : "none",
            }}
          >
            <CarouselArtwork accent={s.accent} />
            <div className="relative max-w-[78%]" style={{ zIndex: 20 }}>
              <p className="m-0 text-[10px] font-bold tracking-[.14em] uppercase text-white/65">
                {s.eyebrow}
              </p>
              <h3 className="mt-1.5 mb-1.5 text-[18px] font-bold leading-tight tracking-tight">
                {s.title}
              </h3>
              <p className="m-0 mb-3 text-[12px] leading-snug text-white/75">{s.body}</p>
              {s.ctaHref ? (
                <button
                  type="button"
                  onClick={() => router.push(s.ctaHref!)}
                  className="px-3.5 py-1.5 rounded-full text-[11.5px] font-semibold inline-flex items-center gap-1.5"
                  style={{
                    background: "rgba(255,255,255,.18)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,.3)",
                    color: "#fff",
                  }}
                >
                  {s.cta}
                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <span
                  className="px-3.5 py-1.5 rounded-full text-[11.5px] font-semibold inline-flex items-center gap-1.5"
                  style={{
                    background: "rgba(255,255,255,.12)",
                    border: "1px solid rgba(255,255,255,.2)",
                    color: "rgba(255,255,255,.65)",
                  }}
                >
                  {s.cta}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Edge tap zones */}
        <button
          type="button"
          className="absolute left-0 top-0 bottom-0 w-[30%] z-10 cursor-pointer"
          style={{ background: "transparent" }}
          aria-label="Slide anterior"
          onClick={prev}
        />
        <button
          type="button"
          className="absolute right-0 top-0 bottom-0 w-[30%] z-10 cursor-pointer"
          style={{ background: "transparent" }}
          aria-label="Próximo slide"
          onClick={next}
        />
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-2">
        {SLIDES.map((_, i) => (
          <span
            key={i}
            className="h-[5px] rounded-full transition-[width] duration-300"
            style={{
              width: i === idx ? 16 : 5,
              background: i === idx ? "#A78BFA" : "oklch(.28 .02 270)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
