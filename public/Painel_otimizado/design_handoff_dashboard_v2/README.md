# Handoff — Dashboard v2 "Bento" (refinada)

## Overview

Segunda iteração do dashboard de **Projeto Saúde**, agora com mais identidade visual e novos recursos. Substitui a versão "atmosférica" anterior. Mantém a filosofia "sem cards genéricos" mas adiciona **identidade por seção** — cada bloco tem sua textura/cor/comportamento próprios, e os blocos pessoais (Meu Porquê, Cuidados de hoje) vivem **inline na página**, sem container.

### Novidades funcionais (vs versão anterior)

1. **Meu Porquê** — nova seção entre Maya e Cuidados, com foto + frase em itálico + rotação automática entre os porquês cadastrados
2. **Cuidados de hoje** — agora inline (sem card), com layout repensado: número grande + barra de progresso lado a lado, chips com **rótulo do valor** (`💧 1.5L`, `😴 7h`, etc) — não só emoji
3. **Metas da semana** — nova seção, card azul cobalto, lista 3 metas com check-state
4. **Fio da Semana expandido** — agora inclui `mood_tag` e `feeling` (texto livre do check-in), substituindo "Últimos check-ins" (essa seção desaparece, fundiu aqui)
5. **Carrossel de descoberta** — auto-scroll a cada 5s, 3 slides com novidades / dicas / em breve. **Sem emoji**, com decoração abstrata em camadas
6. **Maya com personalidade** — aura respirando (animação CSS) + bolinha verde "online" no avatar
7. **Sem kebab** no topo — navegação 100% pela bottom-nav existente

## About the design files

Os arquivos em `references/` são **referências visuais em JSX** — protótipos que mostram o look-and-feel intencional, **não** código de produção pra copiar diretamente. A tarefa é **recriar este design no codebase existente** (`projeto-saude/`), reusando tokens OKLCH em `src/app/globals.css`, ícones `lucide-react`, sistema i18n em `src/lib/i18n.ts`, e os componentes existentes que já têm lógica (PorqueCard, MayaNudge, DayThread, etc).

Abra `references/Dashboard v2 Explorations.html` num browser pra ver as duas variantes lado a lado (A=Editorial, B=Bento). **Implementar a variante B**.

## Fidelity

**High-fidelity (hifi).**

---

## Architecture

A página atual (`src/app/(auth)/dashboard/page.tsx`) já faz todo o fetch necessário (`/api/check-ins`, `/api/preferences`, `/api/meals`, `/api/diary`) e calcula derivados (streak, totalKcal, etc). **Mantenha toda essa lógica**, só reescreva o **JSX** abaixo do `if (loading) ...`.

Estratégia recomendada:
- Reescrever o JSX inline da page (não criar novos componentes globais nessa primeira passada — depois de estabilizar, extrair se virar muito grande)
- Manter os componentes lógicos que têm fetch interno (`<MayaNudge>`, `<PorqueCard>` lógica) mas **substituir o JSX** que renderizam
- Criar `src/lib/dashboard-utils.ts` com helpers de mood color, energy color, NEGATIVE_MOODS array, etc

---

## Layout — ordem das seções

```
┌─────────────────────────────────────┐
│ BOA TARDE                           │
│ Ana                                 │
│ DOM · 17 MAI                        │
│                                     │
│ ┌─ MAYA CARD (gradient verde) ────┐│
│ │ [avatar 60px com aura + ●]      ││
│ │ MAYA · AGORA                     ││
│ │ [nudge text]                     ││
│ │ [Conversar com Maya →]           ││
│ └──────────────────────────────────┘│
│                                     │
│ MEU PORQUÊ                  • • •   │ ← rotation dots
│ [photo 74px]  "Pela Sofia..."       │
│                                     │
│ CUIDADOS DE HOJE              55%   │
│ 6 / 11   ████░░░░ 6 feitos · 5 pend │
│ [💧 1.5L] [😴 7h] [🧘 Pausa] ...    │
│ ✏ Editar check-in                   │
│                                     │
│ ┌─ METAS DA SEMANA (dark blue) ───┐│
│ │ ✓ Caminhar 3x esta semana        ││
│ │ ☐ Ler antes de dormir · 4/7 d    ││
│ │ ☐ Ligar pra Sofia no sábado      ││
│ └──────────────────────────────────┘│
│                                     │
│ ┌─ O FIO · 7 DIAS (teal) ─────────┐│
│ │ SEG 🌙 5/10 cansada Reunião...   ││
│ │ TER 😵 4/10 ansiosa —            ││
│ │ ... (7 linhas)                   ││
│ │ DOM 🌙 7/10 calma Em paz hoje ◀  ││
│ └──────────────────────────────────┘│
│                                     │
│ ┌─ CARROSSEL (auto 5s, dark) ─────┐│
│ │ NOVO                       ◎◎◯  ││
│ │ Fio da Semana com sentimentos    ││
│ │ Veja como você se sentiu cada... ││
│ │ [Ver →]                          ││
│ └──────────────────────────────────┘│
│ ● ─ ─    (dots)                     │
│                                     │
│ ┌─ NUTRIÇÃO ─┐  ┌─ EVOLUÇÃO ─┐     │
│ │ [83] 1420  │  │ 6.4 média  │     │
│ │ kcal · 3 ref│  │ ⋰⋰⋰⋰⋰⋰⋰    │     │
│ └────────────┘  └────────────┘     │
│                                     │
│       (bottom nav já existente)     │
└─────────────────────────────────────┘
```

---

## Background

Wrapper do dashboard inteiro:
```tsx
<div
  className="relative min-h-screen pb-28"
  style={{
    background: `
      radial-gradient(ellipse 80% 50% at 20% 0%, oklch(.95 .04 80 / .35) 0%, transparent 50%),
      linear-gradient(180deg, oklch(.97 .005 160) 0%, oklch(.94 .02 160) 100%)
    `,
  }}
>
```

---

## 1. Greeting

```tsx
<div className="px-5 pt-[22px] pb-1">
  <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
    {greetingTimeOfDay()} {/* "Bom dia" / "Boa tarde" / "Boa noite" */}
  </p>
  <h1 className="mt-1 text-[34px] font-bold tracking-tight leading-[1.05]">
    {firstName}
  </h1>
  <p className="mt-1 font-mono text-[11px] uppercase text-muted-foreground">
    {todayDisplay} {/* "DOM · 17 MAI" */}
  </p>
</div>
```

Helpers já existentes na page atual — só ajustar o formato de `todayDisplay`:
```tsx
const d = new Date();
const wk = d.toLocaleDateString("pt-BR", { weekday: "short" }).toUpperCase().replace(".", "");
const dn = d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).toUpperCase().replace(".", "");
setTodayDisplay(`${wk} · ${dn}`); // "DOM · 17 MAI"
```

**SEM kebab no topo.** A bottom-nav cuida da navegação.

---

## 2. Maya Card (hero verde)

Substitui `<MayaNudge>` no dashboard. A lógica de fetch continua igual (chama `/api/maya/nudge`), só muda o JSX.

```tsx
<div className="px-3.5 pt-4">
  <div
    className="relative rounded-[22px] border overflow-hidden p-[18px]"
    style={{
      background: `
        radial-gradient(circle at 100% 100%, oklch(.88 .12 160 / .35), transparent 60%),
        linear-gradient(135deg, oklch(.95 .02 160) 0%, oklch(.92 .04 160) 100%)
      `,
      borderColor: 'oklch(.5 .12 160 / .15)',
    }}
  >
    {/* Decorative rings */}
    <div className="absolute -right-12 -bottom-12 w-44 h-44 rounded-full border pointer-events-none"
         style={{ borderColor: 'oklch(.5 .12 160 / .15)' }} />
    <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full border pointer-events-none"
         style={{ borderColor: 'oklch(.5 .12 160 / .1)' }} />

    <div className="relative flex gap-3 items-start">
      <div className="relative flex-none">
        {/* Breathing aura */}
        <span className="absolute -inset-1.5 rounded-full pointer-events-none"
              style={{
                background: 'oklch(.78 .14 160 / .12)',
                animation: 'mayaBreathe 3s ease-in-out infinite',
              }} />
        <span className="block w-[60px] h-[60px] rounded-full overflow-hidden border-[2.5px] border-white relative shadow-lg">
          <Image src="/maya.png" alt="" width={60} height={60} className="object-cover" />
        </span>
        {/* Online dot */}
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-[2.5px] border-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold tracking-wider uppercase m-0"
           style={{ color: 'oklch(.4 .12 160)' }}>
          Maya · agora
        </p>
        <p className="mt-1 text-[14.5px] leading-[1.4] font-medium tracking-tight">
          {nudgeText}
        </p>
      </div>
    </div>

    <Button
      onClick={() => router.push('/insights')}
      className="mt-3 w-full h-[38px] rounded-xl text-[13px] font-semibold gap-1.5"
      style={{
        background: 'oklch(.4 .12 160)',
        boxShadow: '0 4px 12px -4px oklch(.4 .12 160 / .45)',
      }}
    >
      Conversar com Maya
      <ArrowRight className="w-3 h-3" />
    </Button>
  </div>
</div>
```

Adicionar no `globals.css` ou inline:
```css
@keyframes mayaBreathe {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.1); opacity: 1; }
}
```

---

## 3. Meu Porquê — inline, foto + frase

Substitui `<PorqueCard>` no dashboard.

```tsx
<div className="px-6 pt-[22px]">
  <div className="flex items-baseline justify-between mb-3">
    <p className="text-[10.5px] font-bold tracking-[.14em] uppercase m-0"
       style={{ color: 'oklch(.55 .12 20)' }}>
      Meu Porquê
    </p>
    {/* Rotation dots */}
    {porques.length > 1 && (
      <div className="flex gap-1">
        {porques.map((_, i) => (
          <span
            key={i}
            className="h-[5px] rounded-full transition-[width]"
            style={{
              width: i === porqueIdx ? 14 : 5,
              background: i === porqueIdx ? 'oklch(.55 .12 20)' : 'oklch(.5 .1 20 / .25)',
            }}
          />
        ))}
      </div>
    )}
  </div>

  <div className="grid grid-cols-[74px_1fr] gap-3.5 items-center">
    {/* Photo (or placeholder) */}
    <div className="w-[74px] h-[74px] rounded-2xl overflow-hidden flex-none flex items-center justify-center
                    bg-gradient-to-br from-orange-100 to-orange-200 border-2 border-white shadow-md">
      {currentPorque.photoUrl ? (
        <Image src={currentPorque.photoUrl} alt="" width={74} height={74} className="object-cover" />
      ) : (
        <UserIcon className="w-8 h-8" style={{ color: 'oklch(.45 .12 30 / .5)' }} />
      )}
    </div>
    <p className="m-0 text-[16.5px] leading-[1.4] tracking-tight italic font-medium text-pretty">
      &ldquo;{currentPorque.text}&rdquo;
    </p>
  </div>
</div>
```

**Rotação automática:** o componente já tem `porques: PorqueData[]`. Adicionar:
```tsx
const [porqueIdx, setPorqueIdx] = useState(0);
useEffect(() => {
  if (porques.length < 2) return;
  const t = setInterval(() => setPorqueIdx(i => (i + 1) % porques.length), 8000);
  return () => clearInterval(t);
}, [porques.length]);
```

**8 segundos** (não 5 como o carrossel) — é texto pessoal, precisa de tempo de leitura.

---

## 4. Cuidados de Hoje — inline, sem card

Layout profissional: número grande à esquerda, barra de progresso à direita com texto auxiliar.

```tsx
<div className="px-6 pt-8 relative">
  <div className="flex items-baseline justify-between mb-3.5">
    <p className="text-[10.5px] font-bold tracking-[.14em] uppercase m-0 text-amber-700">
      Cuidados de hoje
    </p>
    <span className="text-[11.5px] font-semibold text-amber-700 tabular-nums">
      {Math.round((positiveCount / totalHabits) * 100)}%
    </span>
  </div>

  {/* Hero row: big number + progress bar */}
  <div className="grid grid-cols-[auto_1fr] gap-[18px] items-center mb-4">
    <div className="flex items-baseline gap-1.5">
      <span className="text-[56px] font-bold tracking-[-0.035em] leading-[0.85] tabular-nums text-stone-900">
        {positiveCount}
      </span>
      <span className="text-[22px] text-muted-foreground font-normal leading-none">
        / {totalHabits}
      </span>
    </div>
    <div>
      <div className="h-1.5 rounded-full overflow-hidden bg-amber-100/55">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${(positiveCount / totalHabits) * 100}%`,
            background: 'linear-gradient(90deg,#d97706,#f59e0b)',
          }}
        />
      </div>
      <p className="m-0 mt-1.5 text-[10.5px] text-muted-foreground">
        {positiveCount} cuidados feitos · {totalHabits - positiveCount} pendentes
      </p>
    </div>
  </div>

  {/* Chips with value labels */}
  <div className="flex flex-wrap gap-1.5">
    {completedHabits.map(({ emoji, value }) => (
      <span
        key={emoji}
        className="px-3 py-1.5 rounded-full text-[12px] font-medium border bg-white/85 backdrop-blur-sm
                   inline-flex items-center gap-1 text-stone-900"
        style={{
          borderColor: 'oklch(.85 .05 80 / .5)',
          boxShadow: '0 1px 0 oklch(.25 .02 160 / .04)',
        }}
      >
        {emoji} {value}
      </span>
    ))}
  </div>

  <button
    onClick={() => router.push('/check-in')}
    className="mt-3.5 inline-flex items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer
               text-[12px] font-semibold text-amber-700"
  >
    <Edit3 className="w-3 h-3" />
    Editar check-in
  </button>
</div>
```

### Chip values (não só emoji)

Mapear cada hábito pra um rótulo com o **valor real**, não só "sim":

| Habit | Emoji | Value example |
|---|---|---|
| `drank_water` | 💧 | `${water_cups}L` (já é número no DB) |
| `slept_well` | 😴 | `7h` (ou usar `sleep_hours` se existir) |
| `meditation_prayer_breathing` | 🧘 | `Pausa` |
| `talked_to_someone` | 🗣️ | `Conversa` |
| `took_medication` | 💊 | `Remédios` |
| `ate_well` (auto from meals) | 🍽️ | `Comeu bem` |
| `exercise_walk` | 🏃 | `Caminhou` |
| `did_something_enjoyable` | 😊 | `Gostou` |

Helper:
```tsx
const HABIT_CHIP_LABEL: Record<string, (form: CheckIn) => string> = {
  drank_water: (f) => f.water_cups ? `${(f.water_cups * 0.25).toFixed(1).replace('.0','')}L` : 'Água',
  slept_well: (f) => 'Sono',
  meditation_prayer_breathing: () => 'Pausa',
  talked_to_someone: () => 'Conversa',
  took_medication: () => 'Remédios',
  ate_well: () => 'Comeu bem',
  exercise_walk: () => 'Caminhou',
  did_something_enjoyable: () => 'Gostou',
  creative_activity: () => 'Criatividade',
  worked_on_goals: () => 'Metas',
  bowel_movement: () => 'Banheiro',
};

const completedHabits = enabledHabits
  .filter(k => todayCheckIn?.[k] === true)
  .map(k => ({ emoji: QUESTION_EMOJI[k], value: HABIT_CHIP_LABEL[k]?.(todayCheckIn!) ?? k }));
```

`QUESTION_EMOJI` já existe (vi no código atual). Reusar.

---

## 5. Metas da Semana — card dark blue (NOVO)

**Backend novo necessário.** Modelo sugerido:

```ts
// src/types/index.ts
export interface WeeklyGoal {
  id: string;
  user_id: string;
  text: string;          // "Caminhar 3x esta semana"
  done: boolean;
  progress_current?: number; // 2
  progress_total?: number;   // 3
  week_start: string;        // "2026-05-13" (segunda da semana)
  created_at: string;
}
```

Endpoint: `GET /api/goals?week_start=YYYY-MM-DD`, `POST /api/goals`, `PATCH /api/goals/:id` (toggle done).

**Por ora**, fazer o card consumir dados mock até o backend existir, ou esconder o card se `goals.length === 0`.

```tsx
<div className="px-3.5 pt-8">
  <div
    className="relative rounded-[18px] overflow-hidden text-white px-[18px] py-4"
    style={{
      background: `
        radial-gradient(circle at 100% 0, oklch(.45 .18 260 / .35), transparent 50%),
        linear-gradient(160deg, oklch(.28 .14 260) 0%, oklch(.2 .1 260) 100%)
      `,
      boxShadow: '0 8px 24px -12px oklch(.22 .12 260 / .55)',
    }}
  >
    <div className="flex items-baseline justify-between">
      <p className="m-0 text-[10px] font-bold tracking-[.12em] uppercase text-white/60">
        Metas da semana
      </p>
      <span className="text-[10.5px] text-white/55">
        {doneCount} de {goals.length} ✓
      </span>
    </div>
    <ul className="list-none p-0 m-0 mt-3 flex flex-col gap-2">
      {goals.map((g) => (
        <li key={g.id} className="flex items-center gap-2.5">
          <button
            onClick={() => toggleGoal(g.id)}
            className="w-[18px] h-[18px] rounded-md flex-none flex items-center justify-center cursor-pointer border-0"
            style={{
              background: g.done ? '#22c55e' : 'transparent',
              border: g.done ? 'none' : '1.5px solid rgba(255,255,255,.4)',
            }}
          >
            {g.done && <Check className="w-2.5 h-2.5 stroke-white stroke-[3]" />}
          </button>
          <span
            className="flex-1 text-[13.5px] font-medium tracking-tight"
            style={{
              color: g.done ? 'rgba(255,255,255,.55)' : '#fff',
              textDecoration: g.done ? 'line-through' : 'none',
            }}
          >
            {g.text}
          </span>
          {g.progress_total && (
            <span className="text-[10.5px] text-white/55">
              {g.progress_current} de {g.progress_total} dias
            </span>
          )}
        </li>
      ))}
    </ul>
    {goals.length === 0 && (
      <button className="mt-3 text-[12px] text-white/70 underline">
        + Adicionar primeira meta
      </button>
    )}
  </div>
</div>
```

---

## 6. O Fio da Semana — expandido

Substitui `<DayThread>`. **Inclui agora**: dia, sono (emoji), energia (cor), mood_tag (chip), feeling (texto livre do check-in).

```tsx
<div className="px-3.5 pt-2.5">
  <div
    className="rounded-[18px] px-4 pt-4 pb-[18px] border shadow-sm"
    style={{
      background: 'linear-gradient(180deg, #fff, oklch(.96 .02 180))',
      borderColor: 'oklch(.5 .12 180 / .12)',
    }}
  >
    <div className="flex items-baseline justify-between mb-3">
      <p className="m-0 text-[10px] font-bold tracking-[.12em] uppercase text-cyan-700">
        O Fio · 7 dias
      </p>
      <span className="text-[10.5px] text-muted-foreground">
        Energia média {avgEnergy.toFixed(1)}
      </span>
    </div>
    <div className="flex flex-col gap-1.5">
      {last7Days.map((day) => (
        <FioRow key={day.date} day={day} />
      ))}
    </div>
  </div>
</div>
```

### `FioRow` helper

```tsx
const NEGATIVE_MOODS = ['ansiosa','triste','cansada','sobrecarregada','irritada','frustrada'];

function energyColor(e: number): string {
  if (e >= 7) return '#059669';
  if (e >= 5) return '#b45309';
  return '#dc2626';
}

function FioRow({ day }: { day: DayData }) {
  const isToday = day.date === getLocalDate();
  const moodTag = day.mood_tags?.[0]; // first one only; "+N" if more
  const moodNeg = moodTag && NEGATIVE_MOODS.includes(moodTag);
  const extraMoods = (day.mood_tags?.length ?? 0) - 1;

  return (
    <div
      className="grid grid-cols-[32px_14px_38px_1fr] gap-2 items-center px-2 py-1 rounded-lg"
      style={{ background: isToday ? 'oklch(.5 .12 180 / .08)' : 'transparent' }}
    >
      <span
        className="text-[10.5px] tracking-wider uppercase"
        style={{
          fontWeight: isToday ? 700 : 600,
          color: isToday ? 'oklch(.35 .12 180)' : 'var(--muted-foreground)',
        }}
      >
        {weekdayShort(day.date)} {/* seg/ter/qua... */}
      </span>
      <span className="text-[13px] leading-none" style={{ opacity: day.slept_well ? 1 : 0.4 }}>
        {day.slept_well ? '🌙' : '😵'}
      </span>
      <span
        className="text-[12px] font-bold tabular-nums"
        style={{ color: energyColor(day.energy_level ?? 5) }}
      >
        {day.energy_level ?? '—'}/10
      </span>
      <div className="min-w-0 flex items-center gap-1.5">
        {moodTag && (
          <span
            className="px-1.5 py-px rounded-full text-[9.5px] font-semibold flex-none"
            style={{
              background: moodNeg ? 'oklch(.92 .05 30 / .6)' : 'oklch(.88 .08 160 / .5)',
              color: moodNeg ? 'oklch(.4 .1 30)' : 'oklch(.32 .1 160)',
            }}
          >
            {moodTag}{extraMoods > 0 && ` +${extraMoods}`}
          </span>
        )}
        <span className="text-[11px] text-muted-foreground truncate">
          {day.feeling || '—'}
        </span>
      </div>
    </div>
  );
}
```

### Dados do Fio

`last7Days` precisa cruzar check-ins + sleep + feeling. A page atual já tem `checkIns`. Calcular:

```tsx
const last7Days = useMemo(() => {
  const today = new Date();
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const date = d.toISOString().slice(0, 10);
    const c = checkIns.find((x) => x.date === date);
    return {
      date,
      energy_level: c?.energy_level,
      mood_tags: c?.mood_tags ?? [],
      slept_well: c?.slept_well ?? false,
      feeling: c?.feeling ?? '',
    };
  });
}, [checkIns]);

const avgEnergy = last7Days
  .filter(d => d.energy_level != null)
  .reduce((sum, d, _, arr) => sum + (d.energy_level! / arr.length), 0);
```

### Remover "Últimos check-ins"

Esta seção **fundiu no Fio**. Remover o `<UltimosCheckins>` ou bloco equivalente do dashboard. Se a página `/historico` ainda usa, manter lá.

---

## 7. Carrossel de Descoberta (NOVO)

Auto-scroll a cada **5 segundos**, fade entre slides. **Sem emoji** — usar a `CarouselArtwork` (geometria abstrata em camadas).

```tsx
const CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    eyebrow: 'NOVO',
    title: 'Fio da Semana com sentimentos',
    body: 'Veja como você se sentiu cada dia.',
    cta: 'Ver',
    ctaHref: '/historico',
    bg: 'linear-gradient(135deg,#312e81 0%,#1e1b4b 100%)',
    accent: 'oklch(.55 .2 280)',
  },
  {
    eyebrow: 'LEMBRETE',
    title: 'Conversar com Maya é gratuito sempre',
    body: 'Ela está acordada quando você precisar.',
    cta: 'Conversar',
    ctaHref: '/insights',
    bg: 'linear-gradient(135deg,#065f46 0%,#022c22 100%)',
    accent: 'oklch(.55 .15 160)',
  },
  {
    eyebrow: 'EM BREVE',
    title: 'Meditações guiadas pela Maya',
    body: 'Sessões curtas, dia ou noite.',
    cta: 'Avise-me',
    bg: 'linear-gradient(135deg,#7c2d12 0%,#431407 100%)',
    accent: 'oklch(.55 .2 40)',
  },
];

function CarouselDescoberta() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % CAROUSEL_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="px-3.5 pt-2.5 relative">
      <div className="rounded-[18px] overflow-hidden min-h-[144px] relative">
        {CAROUSEL_SLIDES.map((s, i) => (
          <div
            key={i}
            className="px-[22px] py-5 text-white transition-opacity duration-500 min-h-[144px] overflow-hidden"
            style={{
              position: i === idx ? 'relative' : 'absolute',
              inset: 0,
              background: s.bg,
              opacity: i === idx ? 1 : 0,
            }}
          >
            <CarouselArtwork accent={s.accent} />
            <div className="relative max-w-[78%]">
              <p className="m-0 text-[10px] font-bold tracking-[.14em] uppercase text-white/65">
                {s.eyebrow}
              </p>
              <h3 className="mt-1.5 mb-1.5 text-[18px] font-bold leading-tight tracking-tight text-balance">
                {s.title}
              </h3>
              <p className="m-0 mb-3 text-[12px] leading-snug text-white/75">
                {s.body}
              </p>
              <button
                onClick={() => s.ctaHref && router.push(s.ctaHref)}
                className="px-3.5 py-1.5 rounded-full bg-white/[.18] backdrop-blur-md border border-white/30
                           text-[11.5px] font-semibold inline-flex items-center gap-1.5"
              >
                {s.cta}
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-2">
        {CAROUSEL_SLIDES.map((_, i) => (
          <span
            key={i}
            className="h-[5px] rounded-full transition-[width] duration-300"
            style={{
              width: i === idx ? 16 : 5,
              background: i === idx ? 'var(--foreground)' : 'oklch(.5 .12 160 / .2)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function CarouselArtwork({ accent }: { accent: string }) {
  return (
    <>
      <div
        className="absolute -right-12 -top-12 w-44 h-44 rounded-full pointer-events-none opacity-[.35]"
        style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 70%)` }}
      />
      <div className="absolute -right-7 top-4 w-32 h-32 rounded-full border border-white/[.18] pointer-events-none" />
      <div className="absolute -right-3 top-9 w-20 h-20 rounded-full border border-white/[.12] pointer-events-none" />
      <div className="absolute right-5 top-5 w-14 h-14 rounded-full bg-white/[.08] backdrop-blur-md border border-white/20 pointer-events-none" />
    </>
  );
}
```

### ⚠️ Caveat importante — Carrossel precisa de arte real

A decoração atual é **abstrata em camadas** (glow + 2 anéis + 1 disco) — funciona como placeholder elegante mas **não é a versão final**. Pra ficar realmente premium, recomendo:

- **Opção 1 (rápida):** ícones customizados com `lucide-react` ou SVG inline temáticos pra cada slide (ex.: linha-do-tempo pra "Fio", balão de fala pra "Maya", lótus pra "Meditações")
- **Opção 2 (ideal):** ilustrações pequenas (~120×120) feitas por designer, ou fotos editoriais croppadas. Pode usar **IA generativa** (Midjourney/DALL-E) com prompts consistentes com a marca verde-cream — flagar pro fundador
- **Opção 3 (avançada):** animações Lottie por slide, vibe Headspace

Por enquanto, deixar a `CarouselArtwork` abstrata e adicionar prop opcional `image?: string` que se presente substitui a decoração.

### Backend do Carrossel

Os slides podem vir de:
- Hardcode (mais simples — atualizar com deploys)
- `/api/announcements` (mais flexível — fundador edita via admin)
- LocalStorage com flag "already seen" pra não mostrar o mesmo slide direto sempre

Sugerido pra v1: **hardcode**, com flag `dismissed: string[]` no localStorage.

---

## 8. Nutrição + Evolução — par no rodapé

```tsx
<div className="px-3.5 pt-2.5 grid grid-cols-2 gap-2.5">
  {/* Nutrição */}
  <div
    className="rounded-[18px] px-3.5 pt-3.5 pb-4 border shadow-sm"
    style={{
      background: 'linear-gradient(180deg, #fff, oklch(.96 .03 30))',
      borderColor: 'oklch(.5 .12 30 / .12)',
    }}
  >
    <p className="m-0 text-[9.5px] font-bold tracking-[.12em] uppercase text-rose-700">
      Nutrição
    </p>
    <div className="flex items-center gap-2.5 mt-2">
      <NutritionRing score={nutritionScore} size={48} />
      <div className="flex-1 min-w-0">
        <div className="text-[20px] font-bold tracking-tight leading-none tabular-nums">
          {totalKcal}
        </div>
        <div className="text-[10.5px] text-muted-foreground mt-0.5">
          kcal · {mealCount} ref
        </div>
      </div>
    </div>
    <div className="mt-2.5 flex gap-1.5 text-[10px] text-muted-foreground tabular-nums">
      <span>C {macros.carbs}g</span>
      <span>P {macros.protein}g</span>
      <span>G {macros.fat}g</span>
    </div>
  </div>

  {/* Evolução */}
  <div className="rounded-[18px] bg-white px-3.5 pt-3.5 pb-4 border shadow-sm flex flex-col"
       style={{ borderColor: 'oklch(.5 .12 160 / .12)' }}>
    <p className="m-0 text-[9.5px] font-bold tracking-[.12em] uppercase"
       style={{ color: 'oklch(.4 .12 160)' }}>
      Evolução · 14d
    </p>
    <div className="flex items-baseline gap-1.5 mt-2">
      <span className="text-[20px] font-bold tracking-tight leading-none tabular-nums">
        {avgEnergy14d.toFixed(1)}
      </span>
      <span className="text-[10.5px] text-muted-foreground">média · {trend}</span>
    </div>
    <div className="mt-auto pt-2">
      <SparkSmall data={energy14d} />
    </div>
  </div>
</div>
```

`<NutritionRing>` e `<SparkSmall>` ver código de referência (linhas finais do JSX).

---

## Tokens & spacing

| Item | Valor |
|---|---|
| Page padding lateral (inline blocks) | `px-6` (Cuidados, Meu Porquê) |
| Page padding lateral (cards) | `px-3.5` (Maya, Metas, Fio, Carrossel, Nutri+Evo) |
| Section vertical gap | `pt-8` entre blocos principais; `pt-2.5` dentro de grupos |
| Eyebrow type | `text-[10-11px] font-bold tracking-[.12-.14em] uppercase` |
| Big number (Cuidados) | `text-[56px] font-bold tracking-[-0.035em] tabular-nums` |
| Card border radius | `rounded-[18px]` (small), `rounded-[22px]` (Maya hero) |
| Card border | `1px solid oklch(.5 .12 <hue> / .12-.15)` — hue varia por seção |
| Card shadow | `0 1px 2px oklch(.25 .02 160 / .04)` (subtle), `0 8px 24px -12px <accent>` (Metas dark) |

### Color identity por seção

| Seção | Hue base | Background | Border |
|---|---|---|---|
| Maya | verde (.12 160) | gradient verde-claro | `oklch(.5 .12 160 / .15)` |
| Meu Porquê | warm (.12 20-30) | (sem card) | — |
| Cuidados | âmbar (.05-.18 80) | (sem card) | — |
| Metas | azul cobalto (.14 260) | dark blue gradient | sombra `oklch(.22 .12 260 / .55)` |
| Fio | teal (.12 180) | white → `oklch(.96 .02 180)` | `oklch(.5 .12 180 / .12)` |
| Carrossel | varia por slide | dark gradient (indigo/emerald/orange) | nenhum |
| Nutrição | rosa (.12 30) | white → `oklch(.96 .03 30)` | `oklch(.5 .12 30 / .12)` |
| Evolução | verde marca (.12 160) | white | `oklch(.5 .12 160 / .12)` |

---

## Implementation order

1. **Wrapper + background gradient** — substituir o `<div className="space-y-6">` atual
2. **Greeting** sem kebab, formato novo de data
3. **Maya Card** com aura respirando + online dot
4. **Meu Porquê** inline (refazer só o JSX do `<PorqueCard>`, mantém a lógica de fetch)
5. **Cuidados de Hoje** inline com layout novo (chips com valor real)
6. **Metas da Semana** — bloquear no front com mock até o backend existir
7. **Fio da Semana** expandido com mood_tags + feeling
8. **Remover "Últimos check-ins"** se existir
9. **Carrossel** com auto-scroll
10. **Nutrição + Evolução** pair no fim

---

## Testes manuais

- [ ] Greeting muda com a hora (0-12 Bom dia, 12-18 Boa tarde, 18-24 Boa noite)
- [ ] Meu Porquê rotaciona automaticamente a cada 8s entre os porques cadastrados
- [ ] Cuidados: chips com valor mostram só hábitos completados
- [ ] Cuidados: barra de progresso anima de 0% pro % real ao carregar (transition)
- [ ] Metas: toggle do checkbox marca/desmarca + atualiza counter "X de Y ✓"
- [ ] Fio: hoje destacado, mood chips com cor por valência (negativa âmbar / positiva verde)
- [ ] Fio: dias sem check-in mostram "—" no feeling e energy
- [ ] Carrossel: auto-avança a cada 5s, dots refletem o slide atual
- [ ] Carrossel: clique no botão "Ver/Conversar/Avise-me" navega pra rota correta
- [ ] Nutrição: NutritionRing reflete `nutritionScore` (0-100)
- [ ] Evolução: sparkline reflete `energy14d` array
- [ ] Sem scroll horizontal acidental no mobile (390px)
- [ ] Bottom-nav existente continua funcionando — confere que o `pb-28` no wrapper deixa espaço pra ela
- [ ] Dark mode não desenhado — combinar com fundador antes

---

## Caveats

- **Dark mode não foi desenhado.** Os gradients e cores assumem fundo claro. Combinar antes.
- **Carrossel precisa de arte real** — a decoração geométrica é placeholder elegante. Sugiro contratar ilustrações pequenas ou usar IA generativa pra ter visual final consistente. Veja seção "Caveat importante — Carrossel precisa de arte real" acima.
- **Maya com personalidade tipo Duo** — a referência mencionada (Duolingo) usa personagem ilustrado com poses/expressões. A Maya hoje é foto realista. Pra ter "vida" de mascote precisaria gerar variações ilustradas (Maya acenando, Maya com cara de "viu seu check-in", Maya pensando). Por enquanto, a "personalidade" vem só de **aura respirando + online dot + tom de voz**. Decisão estratégica pendente.
- **Metas da semana é backend novo** — schema sugerido na seção 5. Frontend pode trabalhar com mock até o endpoint existir.
- **Sem kebab no topo** — confirmar que a bottom-nav existente cobre todas as ações que estavam no kebab (logout, configurações, etc).
- **`feeling` e `mood_tags` no Fio** dependem desses campos existirem em `CheckIn`. Vi no código que sim, mas dias antigos podem ter `mood_tags: null` ou vazio — tratar graciosamente.
- **Auto-rotate do "Meu Porquê"** é uma interpretação minha — o `PorqueCard` original talvez não rotacione sozinho. Conferir com o fundador se é o comportamento desejado, ou se deve ficar estático com setas de navegação.

---

## Files in `references/`

| Arquivo | O que é |
|---|---|
| `Dashboard v2 Explorations.html` | Canvas com as duas variantes (A=Editorial, B=Bento). Implementar a **B** |
| `DashboardBento.jsx` | Implementação JSX da variante final (apenas referência visual — não copiar direto) |
| `Maya.png` | Avatar da Maya — copiar pra `public/maya.png` se ainda não estiver lá |
