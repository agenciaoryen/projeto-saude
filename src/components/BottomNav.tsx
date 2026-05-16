"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, BookOpen, Camera } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { UserAvatar } from "@/components/UserAvatar";

export function BottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const linkClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 h-full px-3 min-w-0 flex-1 transition-colors ${
      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-sm border-t safe-bottom">
      <div className="max-w-4xl mx-auto flex items-center justify-around h-full px-2">
        <Link href="/dashboard" className={linkClass(isActive("/dashboard"))} prefetch>
          <Home className="size-5" />
          <span className="text-[10px] font-medium leading-none">{t("inicio")}</span>
        </Link>

        <Link href="/diario" className={linkClass(isActive("/diario"))} prefetch>
          <BookOpen className="size-5" />
          <span className="text-[10px] font-medium leading-none">{t("diario")}</span>
        </Link>

        {/* Botão central de câmera — abre direto a captura */}
        <Link
          href="/nutricao/registrar"
          className="flex flex-col items-center justify-center gap-0.5 h-full px-3 min-w-0 flex-1 transition-colors text-muted-foreground hover:text-foreground -mt-5"
        >
          <span className="size-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
            <Camera className="size-5" />
          </span>
          <span className="text-[10px] font-medium leading-none">{t("nutricao")}</span>
        </Link>

        <Link href="/insights" className={linkClass(isActive("/insights"))} prefetch>
          <MessageCircle className="size-5" />
          <span className="text-[10px] font-medium leading-none">Maya</span>
        </Link>

        <Link
          href="/perfil"
          className={linkClass(isActive("/perfil") || pathname.startsWith("/configurações"))}
          prefetch
        >
          <UserAvatar />
          <span className="text-[10px] font-medium leading-none">Perfil</span>
        </Link>
      </div>
    </nav>
  );
}
