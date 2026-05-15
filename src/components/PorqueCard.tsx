"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { photoUrl } from "@/lib/photo-storage";
import { Heart } from "lucide-react";

interface Porque {
  id: string;
  text: string;
  photoPath: string | null;
}

const ROTATE_INTERVAL = 30 * 60 * 1000; // 30 minutos

export function PorqueCard() {
  const [porques, setPorques] = useState<Porque[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.porques?.length > 0) {
          setPorques(data.porques);
          setIndex(Math.floor(Math.random() * data.porques.length));
        }
      })
      .catch(() => {});
  }, []);

  const advance = useCallback(() => {
    if (porques.length <= 1) return;
    setIndex((prev) => {
      let next;
      do {
        next = Math.floor(Math.random() * porques.length);
      } while (next === prev && porques.length > 1);
      return next;
    });
  }, [porques.length]);

  // Auto-rotate
  useEffect(() => {
    if (porques.length <= 1) return;
    const t = setInterval(advance, ROTATE_INTERVAL);
    return () => clearInterval(t);
  }, [porques.length, advance]);

  if (porques.length === 0) return null;

  const pq = porques[index];
  const src = pq.photoPath ? photoUrl(pq.photoPath) : null;

  return (
    <Card className="rounded-2xl border-pink-200 dark:border-pink-900 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Heart className="size-5 text-pink-400 shrink-0 mt-0.5" fill="currentColor" />
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <p className="text-xs font-medium text-pink-500 dark:text-pink-400 mb-1">
                Meu Porquê
              </p>
              <p className="text-sm leading-relaxed text-foreground/85 italic">
                {pq.text || "—"}
              </p>
            </div>
            {src && (
              <img
                src={src}
                alt=""
                className="w-full aspect-[3/2] object-cover rounded-xl"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
