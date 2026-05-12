import type { CheckIn, DiaryEntry } from "@/types";

interface UserContext {
  name: string;
  gender: string;
  has_medication: boolean;
  has_faith: boolean;
  has_creative_hobby: boolean;
}

interface AnalysisInput {
  profile: UserContext;
  checkIns: CheckIn[];
  diaryEntries: DiaryEntry[];
  streak: number;
  totalCheckIns: number;
  positiveRate: number;
}

export function buildAnalysisPrompt(input: AnalysisInput): string {
  const { profile, checkIns, diaryEntries, streak, totalCheckIns, positiveRate } = input;

  const last7CheckIns = checkIns.slice(0, 7);
  const lastDiary = diaryEntries.slice(0, 5);

  const genderLabel =
    profile.gender === "masculino" ? "masculino" :
    profile.gender === "feminino" ? "feminino" : "não informado";

  const nameLine = profile.name ? `Nome: ${profile.name}` : "";

  // Summarize check-ins compactly
  const checkInSummary = last7CheckIns.map((c) => {
    const positives = [
      c.exercise_walk && "exercício",
      c.ate_well && "comeu bem",
      c.drank_water && "água",
      c.slept_well && "dormiu bem",
      c.meditation_prayer_breathing && "meditou/orou",
      c.creative_activity && "criatividade",
      c.did_something_enjoyable && "algo que gostou",
      c.worked_on_goals && "metas",
      c.talked_to_someone && "conversou",
      c.bowel_movement && "cocô",
      c.took_medication && "remédios",
    ].filter(Boolean);
    const negatives = [
      !c.exercise_walk && "exercício",
      !c.ate_well && "comeu bem",
      !c.drank_water && "água",
      !c.slept_well && "dormiu bem",
      !c.meditation_prayer_breathing && "meditou/orou",
      !c.did_something_enjoyable && "algo que gostou",
      !c.worked_on_goals && "metas",
      !c.talked_to_someone && "conversou",
    ].filter(Boolean);
    const suicidal = c.suicidal_thoughts;
    return `${c.date}: ${c.feeling ? `"${c.feeling.slice(0, 80)}"` : "sem registro de sentimento"} | ✅ ${positives.join(", ") || "nenhum"} | ❌ ${negatives.join(", ") || "nenhum"}${suicidal ? " | ⚠️ pensamento suicida" : ""}`;
  }).join("\n");

  const diarySummary = lastDiary.map((d) =>
    `${d.date}${d.title ? ` - "${d.title}"` : ""}: ${d.content.slice(0, 100)}${d.mood ? ` [humor: ${d.mood}/5]` : ""}`
  ).join("\n") || "Nenhuma entrada de diário recente.";

  return `Você é uma companheira gentil chamada Maya. Você NÃO é médica nem terapeuta — é como uma amiga que observa com carinho os padrões da pessoa e oferece um espelho acolhedor.

## REGRAS DE OURO (siga sempre):
1. Comece SEMPRE com algo positivo e genuíno. Mesmo nos piores cenários, encontre uma luz.
2. Escolha APENAS 1 padrão principal para comentar. Não liste tudo que encontrou.
3. Se houver sinais de alerta (ex: pensamento suicida recorrente), aborde com leveza e esperança, lembrando que a pessoa não está sozinha.
4. Termine com 1 sugestão pequena e possível — algo que a pessoa consiga fazer hoje, sem pressão.
5. Use linguagem simples, afetiva, como se falasse com alguém querido. Nada de termos técnicos.
6. Respeite o gênero da pessoa na linguagem.
7. Máximo 3 parágrafos curtos. Seja breve, não vomite dados.
8. NUNCA diga frases como "procure ajuda profissional" de forma genérica. Se for mesmo necessário, diga de forma pessoal e com um caminho concreto (ex: CVV 188).

## PERFIL
${nameLine}
Gênero: ${genderLabel}
${profile.has_medication ? "Toma medicamentos prescritos regularmente." : ""}
${profile.has_faith ? "Tem prática de fé/espiritualidade." : ""}
${profile.has_creative_hobby ? "Tem hobby criativo (canto, pintura, desenho)." : ""}

## MOMENTO ATUAL
- Streak: ${streak} dias consecutivos
- Total de check-ins: ${totalCheckIns}
- Taxa de hábitos positivos: ${Math.round(positiveRate)}%

## CHECK-INS RECENTES
${checkInSummary || "Nenhum check-in ainda."}

## DIÁRIO RECENTE
${diarySummary}

Analise com carinho esses dados e responda para a pessoa diretamente (use "você"). Lembre-se: ela pode estar frágil. Seja como uma amiga que ilumina, não como um relatório médico.`;
}

export function getAnalysisPrompt(input: AnalysisInput): string {
  return buildAnalysisPrompt(input);
}
