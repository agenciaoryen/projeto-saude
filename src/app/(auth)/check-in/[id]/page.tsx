"use client";

import { useEffect, useState, use } from "react";
import { CheckInForm } from "@/components/CheckInForm";
import type { CheckIn } from "@/types";

export default function EditCheckInPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/check-ins")
      .then((res) => res.json())
      .then((data: CheckIn[]) => {
        if (Array.isArray(data)) {
          setCheckIn(data.find((c) => c.id === id) || null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!checkIn) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Check-in não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Editar check-in</h1>
        <p className="text-muted-foreground text-sm">
          {new Date(checkIn.date + "T12:00:00").toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>
      <CheckInForm existingCheckIn={checkIn} />
    </div>
  );
}
