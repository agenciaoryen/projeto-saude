import { Card, CardContent } from "@/components/ui/card";
import { sumMacros } from "@/lib/meal-utils";
import type { Meal } from "@/types";

export function NutritionSummary({ meals, label }: { meals: Meal[]; label: string }) {
  const analyzed = meals.filter((m) => m.macros && m.status_analise === "analisado");
  const total = sumMacros(analyzed);
  const hasData = analyzed.length > 0;

  const totalG = total.carboidratos_g + total.proteinas_g + total.gorduras_g;
  const carbPct = totalG > 0 ? Math.round((total.carboidratos_g / totalG) * 100) : 0;
  const protPct = totalG > 0 ? Math.round((total.proteinas_g / totalG) * 100) : 0;
  const gordPct = totalG > 0 ? Math.round((total.gorduras_g / totalG) * 100) : 0;

  return (
    <Card className="rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{label}</p>
          {hasData && (
            <span className="text-[11px] text-muted-foreground">
              {analyzed.length} refeição{analyzed.length > 1 ? "ões" : ""} analisada{analyzed.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {!hasData ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma refeição analisada neste período.
          </p>
        ) : (
          <>
            {/* Calorias grandes */}
            <div className="text-center">
              <span className="text-3xl font-bold">{total.calorias_kcal}</span>
              <span className="text-sm text-muted-foreground ml-1">kcal</span>
            </div>

            {/* Barra de proporção */}
            <div className="flex h-3 rounded-full overflow-hidden bg-muted">
              {carbPct > 0 && (
                <div
                  className="bg-amber-400 transition-all"
                  style={{ width: `${carbPct}%` }}
                  title={`Carboidratos: ${carbPct}%`}
                />
              )}
              {protPct > 0 && (
                <div
                  className="bg-red-400 transition-all"
                  style={{ width: `${protPct}%` }}
                  title={`Proteínas: ${protPct}%`}
                />
              )}
              {gordPct > 0 && (
                <div
                  className="bg-yellow-500 transition-all"
                  style={{ width: `${gordPct}%` }}
                  title={`Gorduras: ${gordPct}%`}
                />
              )}
            </div>

            {/* Legenda */}
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div>
                <span className="inline-block size-2.5 rounded-full bg-amber-400 mr-1 align-middle" />
                <span className="text-muted-foreground">Carbs</span>
                <p className="font-medium">{total.carboidratos_g}g</p>
              </div>
              <div>
                <span className="inline-block size-2.5 rounded-full bg-red-400 mr-1 align-middle" />
                <span className="text-muted-foreground">Prot</span>
                <p className="font-medium">{total.proteinas_g}g</p>
              </div>
              <div>
                <span className="inline-block size-2.5 rounded-full bg-yellow-500 mr-1 align-middle" />
                <span className="text-muted-foreground">Gord</span>
                <p className="font-medium">{total.gorduras_g}g</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
