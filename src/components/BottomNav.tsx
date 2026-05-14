"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, MessageCircle, BookOpen, Camera } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { UserAvatar } from "@/components/UserAvatar";

export function BottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();

  const LEFT_TABS = [
    { icon: Home, label: t("inicio"), href: "/dashboard" },
    { icon: BookOpen, label: t("diario"), href: "/diario" },
  ];
  const RIGHT_TABS = [
    { icon: MessageCircle, label: "Maya", href: "/insights" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-sm border-t safe-bottom">
      <div className="max-w-4xl mx-auto flex items-center justify-around h-full px-2">
        {LEFT_TABS.map((tab) => {
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

        {/* Botão central de câmera — abre direto a captura */}
        <button
          type="button"
          onClick={() => router.push("/nutricao/registrar")}
          className="flex flex-col items-center justify-center gap-0.5 h-full px-3 min-w-0 flex-1 transition-colors text-muted-foreground hover:text-foreground -mt-5"
        >
          <span className="size-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
            <Camera className="size-5" />
          </span>
          <span className="text-[10px] font-medium leading-none">{t("nutricao")}</span>
        </button>

        {RIGHT_TABS.map((tab) => {
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

        {/* Perfil */}
        <button
          type="button"
          onClick={() => router.push("/perfil")}
          className={`flex flex-col items-center justify-center gap-0.5 h-full px-3 min-w-0 flex-1 transition-colors ${
            pathname.startsWith("/perfil") || pathname.startsWith("/configurações")
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserAvatar />
          <span className="text-[10px] font-medium leading-none">Perfil</span>
        </button>
      </div>
    </nav>
  );
}
