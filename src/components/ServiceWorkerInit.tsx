"use client";

import { useEffect } from "react";
import { registerSW } from "@/lib/push-utils";

export function ServiceWorkerInit() {
  useEffect(() => { registerSW(); }, []);
  return null;
}
