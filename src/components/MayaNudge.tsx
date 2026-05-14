"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

interface Nudge {
  id: string;
  message: string;
}

/** Map nudge IDs to the page they link to */
function nudgeLink(id: string): string | null {
  if (id.startsWith("checkin")) return "/check-in";
  if (id.startsWith("breakfast") || id.startsWith("lunch") || id.startsWith("dinner") || id.startsWith("meals")) return "/nutricao/registrar";
  if (id.startsWith("diary")) return "/diario/novo";
  return null;
}

export function MayaNudge() {
  const router = useRouter();
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/maya/nudge")
      .then((r) => r.json())
      .then((data) => {
        if (data.nudges?.length > 0) setNudges(data.nudges);
      })
      .catch(() => {});
  }, []);

  const visible = nudges.filter((n) => !dismissed.has(n.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((nudge) => {
        const link = nudgeLink(nudge.id);
        return (
          <Card
            key={nudge.id}
            className={`rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:from-primary/10 transition-colors group relative ${link ? "cursor-pointer" : ""}`}
            {...(link ? { onClick: () => router.push(link) } : {})}
          >
            <CardContent className="p-4 pr-10">
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">🌸</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-primary/70 mb-1">Maya</p>
                  <p className="text-sm leading-relaxed text-foreground/85">{nudge.message}</p>
                </div>
              </div>
              {link && (
                <span className="absolute top-4 right-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors">
                  <ArrowUpRight className="size-4" />
                </span>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
