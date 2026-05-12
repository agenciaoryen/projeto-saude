"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CheckIn } from "@/types";

export default function HistoricoPage() {
  const router = useRouter();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/check-ins")
      .then((res) => res.json())
      .then((data: CheckIn[]) => {
        if (Array.isArray(data)) {
          setCheckIns(
            data.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            )
          );
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Histórico</h1>
        <p className="text-muted-foreground text-sm">
          {checkIns.length} check-in{checkIns.length !== 1 ? "s" : ""} registrado
          {checkIns.length !== 1 ? "s" : ""}
        </p>
      </div>

      {checkIns.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-8 text-center space-y-4">
            <div className="text-4xl">📋</div>
            <p className="text-muted-foreground">Nenhum check-in registrado ainda.</p>
            <Button size="lg" className="rounded-xl" onClick={() => router.push("/check-in")}>
              Fazer primeiro check-in
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {checkIns.map((ci) => {
            const score = Object.entries(ci).filter(
              ([k, v]) =>
                typeof v === "boolean" &&
                k !== "suicidal_thoughts" &&
                v === true
            ).length;

            return (
              <Card key={ci.id} className="rounded-2xl hover:bg-secondary/20 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {new Date(ci.date + "T12:00:00").toLocaleDateString(
                        "pt-BR",
                        {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {score}/12
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                    {[
                      ["💊", ci.took_medication],
                      ["🗣️", ci.talked_to_someone],
                      ["🧘", ci.meditation_prayer_breathing],
                      ["🍽️", ci.ate_well],
                      ["🏃", ci.exercise_walk],
                      ["💧", ci.drank_water],
                      ["😴", ci.slept_well],
                      ["🎯", ci.worked_on_goals],
                      ["🎨", ci.did_something_enjoyable],
                    ].map(([emoji, val]) => (
                      <span
                        key={emoji}
                        className={val ? "" : "opacity-30"}
                      >
                        {emoji}
                      </span>
                    ))}
                  </div>
                  {ci.feeling && (
                    <p className="text-sm mt-2 text-muted-foreground line-clamp-1">
                      "{ci.feeling}"
                    </p>
                  )}
                  <Button variant="ghost" size="sm" className="mt-1 rounded-xl" onClick={() => router.push(`/check-in/${ci.id}`)}>
                    Ver detalhes
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
