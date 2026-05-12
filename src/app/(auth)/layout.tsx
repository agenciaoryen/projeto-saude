import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogoutButton } from "@/components/LogoutButton";

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
            🌱 Diário
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/check-in"
              className="inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-sm font-medium hover:bg-muted hover:text-foreground"
            >
              Check-in
            </Link>
            <Link
              href="/historico"
              className="inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-sm font-medium hover:bg-muted hover:text-foreground"
            >
              Histórico
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
                  render={<LogoutButton />}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6">
        {children}
      </main>

      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        🌱 Diário de Saúde Mental — feito com propósito
      </footer>
    </div>
  );
}
