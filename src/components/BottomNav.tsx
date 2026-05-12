"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, PenLine, MessageCircle, BookOpen, Settings } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

export function BottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();

  const TABS = [
    { icon: Home, label: t("inicio"), href: "/dashboard" },
    { icon: PenLine, label: t("checkin"), href: "/check-in" },
    { icon: BookOpen, label: t("diario"), href: "/diario" },
    { icon: MessageCircle, label: "Maya", href: "/insights" },
    { icon: Settings, label: t("ajustes"), href: "/perfil" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-sm border-t safe-bottom">
      <div className="max-w-4xl mx-auto flex items-center justify-around h-full px-2">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          return (
            <button
              key={tab.href}
              type="button"
              onClick={() => router.push(tab.href)}
              className={`flex flex-col items-center justify-center gap-0.5 h-full px-3 min-w-0 flex-1 transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-5" />
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
