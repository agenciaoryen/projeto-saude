import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoutButton } from "@/components/LogoutButton";
import { BottomNav } from "@/components/BottomNav";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="font-semibold text-primary text-lg flex items-center gap-2">
            🌱 Diario
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    EU
                  </AvatarFallback>
                </Avatar>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                render={
                  <Link
                    href="/configuracoes"
                    className="w-full text-left px-2 py-1.5 text-sm block"
                  >
                    Configuracoes
                  </Link>
                }
              />
              <DropdownMenuItem
                render={<LogoutButton />}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 pb-28">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
