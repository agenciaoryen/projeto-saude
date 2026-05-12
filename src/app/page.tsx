import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-secondary/30">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-3">
          <div className="text-5xl">🌱</div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Diário de Saúde Mental
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Um espaço para você se acompanhar com carinho. Pequenos check-ins
            diários que ajudam a perceber padrões, celebrar vitórias e se
            conhecer melhor.
          </p>
        </div>

        <Card className="text-left">
          <CardHeader className="pb-2">
            <p className="text-sm font-medium text-primary">
              ✨ O que você vai encontrar:
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• 15 perguntas simples de responder</li>
              <li>• Leva menos de 3 minutos por dia</li>
              <li>• Acompanhe sua evolução ao longo do tempo</li>
              <li>• Seus dados são só seus — privacidade total</li>
              <li>• 100% gratuito</li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <Link
            href="/cadastro"
            className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground h-9 px-5 text-sm font-medium hover:bg-primary/80"
          >
            Começar agora
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-background hover:bg-muted h-9 px-5 text-sm font-medium"
          >
            Já tenho conta
          </Link>
        </div>
      </div>
    </main>
  );
}
