"use client";

import { Suspense } from "react";
import { ServiceWorkerNavListener } from "@/components/ServiceWorkerNavListener";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <ServiceWorkerNavListener />
      <Suspense>{children}</Suspense>
    </div>
  );
}
