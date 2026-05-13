"use client";

import { useEffect, useState } from "react";
import { CheckInForm } from "@/components/CheckInForm";
import type { CheckIn } from "@/types";
import { getLocalDate } from "@/lib/utils";

export default function CheckInPage() {
  const [existing, setExisting] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = getLocalDate();
    fetch(`/api/check-ins?date=${today}`)
      .then((res) => res.json())
      .then((data) => {
        setExisting(data);
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
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">
          {existing ? "Editar check-in" : "Novo check-in"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>
      <CheckInForm existingCheckIn={existing} />
    </div>
  );
}
