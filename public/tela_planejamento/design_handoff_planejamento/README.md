# Handoff — Planejamento Semanal (Bento Planner)

## Overview

Redesign do **módulo de Planejamento Semanal** do app Projeto Saúde. A versão atual (gerada pelo Claude Code direto, sem design) tem todos os recursos funcionando — Pedras Principais, 9 áreas, tarefas por dia, revisão semanal, histórico — mas visualmente é o padrão "card com barra colorida no topo" repetido várias vezes, sem identidade.

Esta nova versão segue a **mesma linguagem do dashboard v2 (Bento)** já aprovado, e traz dois destaques visuais:

1. **Pedras com hierarquia**: 3 cards de tamanho diferente (I grande, II médio, III pequeno) — você vê a prioridade sem precisar ler os números
2. **Roda das áreas como radar/aranha**: SVG com 9 eixos, mostra a "forma" da semana num olhar — equilibrada, desbalanceada pra um lado, etc

## About the design files

Os arquivos em `references/` são **referências visuais em JSX** — protótipos que mostram o look-and-feel intencional, **não** código de produção pra copiar diretamente. A tarefa é **recriar este design no codebase existente** (`projeto-saude/`), reusando tokens OKLCH em `src/app/globals.css`, ícones `lucide-react`, e mantendo toda a lógica de fetch/save que já existe na page atual.

Abra `references/Planejamento Explorations.html` num browser pra ver — a artboard **A** é a aprovada.

## Fidelity

**High-fidelity (hifi).**

---

## Architecture

A page atual (`src/app/(auth)/planejamento/page.tsx`) já faz fetch dos dados, calcula derivados (conclusões, areas coverage, histórico). **Mantenha toda essa lógica**, só reescreva o **JSX**.

Sugiro extrair em sub-componentes locais (no mesmo arquivo) pra ficar legível:
- `<Pedra rank size text linkedGoal />`
- `<AreasRadar areas />` — SVG do radar
- `<WeekHeat days selectedDay onSelect />` — strip horizontal de 7 colunas
- `<SelectedDayTasks tasks />`
- `<HistoryRow week />`

---

## Layout — ordem das seções

```
┌─────────────────────────────────────┐
│ PLANEJAMENTO · SEMANA 20            │
│ Suas Pedras            (30px hero)  │
│ 13 MAI – 19 MAI · 12 de 20 ✓        │
│                                     │
│ PEDRAS DA SEMANA            ✏ Editar│
│ ┌─ I  Voltar a correr 3x… ───────┐ │
│ │     ↳ SAÚDE · MARATONA          │ │ ← maior
│ └─────────────────────────────────┘ │
│ ┌─ II  Fechar o cliente Visualis ┐  │
│ │      ↳ CARREIRA                 │  │ ← médio
│ └─────────────────────────────────┘  │
│ ┌─ III  Ligar pra Sofia… ─────────┐  │
│ └─────────────────────────────────┘  │ ← menor
│                                     │
│ ┌─ RODA DAS ÁREAS ───────────────┐ │
│ │ Roda das áreas    6 de 9 cob.  │ │
│ │           [radar SVG 280px]    │ │
│ │ Espiritualidade, Lazer e Outros│ │
│ │ estão sem tarefas esta semana. │ │
│ └────────────────────────────────┘  │
│                                     │
│ ┌─ SUA SEMANA ───────────────────┐ │
│ │ SEG TER QUA QUI SEX SÁB DOM    │ │
│ │  ●   ●   [●]  ─   ─   ─   ─    │ │
│ │ 4/4 3/5 2/4  0/3 0/2 0/1 0/1   │ │
│ │ ─────────────────────────────  │ │
│ │ Quarta · 4 itens · 2 feitos    │ │
│ │ ▢ ✓ Reunião 1:1 com Lucia      │ │
│ │ ● ✓ Tomar remédios da manhã    │ │
│ │ ▢ ○ Corrida 30min      ↑ Crescer│ │
│ │ ● ○ Ler 20min       ↻ Hábito   │ │
│ │ + Adicionar item               │ │
│ └────────────────────────────────┘ │
│                                     │
│ ┌─ REVISÃO DA SEMANA ────────────┐ │
│ │ 🏆  No domingo à noite, feche…  │ │
│ └────────────────────────────────┘  │
│                                     │
│ [maya pill] Maya pode ajudar… →     │
│                                     │
│ SEMANAS ANTERIORES                  │
│ 6–12 mai     Estabilizar… ★★★★☆    │
│ 29 abr–5 mai Voltar pra…  ★★★☆☆    │
│ 22–28 abr    Comecei…     ★★★★★    │
└─────────────────────────────────────┘
                              (bottom nav)
```

---

## Background

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

Mesmo do dashboard.

---

## 1. Greeting

```tsx
<div className="px-5 pt-[22px] pb-1">
  <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
    Planejamento · Semana {weekNumber}
  </p>
  <h1 className="mt-1 text-[30px] font-bold tracking-tight leading-[1.05]">
    Suas Pedras
  </h1>
  <p className="mt-1 font-mono text-[11px] uppercase text-muted-foreground">
    {weekRange} · {completedCount} de {totalCount} ✓
  </p>
</div>
```

`weekRange` = `"13 MAI – 19 MAI"` (datas da segunda a domingo abreviadas).

---

## 2. Pedras Principais

Substitui o card "Pedras Principais" atual com hierarquia visual de tamanho.

```tsx
type PedraProps = {
  rank: 'I' | 'II' | 'III';
  size: 'lg' | 'md' | 'sm';
  text: string;
  linkedGoal?: string;
};

const PEDRA_SIZES = {
  lg: { num: 32, py: 16, fs: 16,    accent: 'oklch(.42 .14 220)', bg: 'linear-gradient(135deg, oklch(.95 .06 220) 0%, oklch(.92 .08 210) 100%)' },
  md: { num: 26, py: 13, fs: 14.5,  accent: 'oklch(.5 .12 220)',  bg: 'linear-gradient(135deg, oklch(.96 .04 220) 0%, oklch(.94 .055 215) 100%)' },
  sm: { num: 22, py: 11, fs: 13.5,  accent: 'oklch(.55 .1 220)',  bg: 'linear-gradient(135deg, oklch(.97 .03 220) 0%, oklch(.95 .04 220) 100%)' },
};

function Pedra({ rank, size, text, linkedGoal }: PedraProps) {
  const s = PEDRA_SIZES[size];
  return (
    <div
      className="grid items-center mb-2 rounded-2xl border px-4 relative overflow-hidden"
      style={{
        gridTemplateColumns: `${s.num + 22}px 1fr`,
        gap: '14px',
        paddingTop: s.py,
        paddingBottom: s.py,
        background: s.bg,
        borderColor: 'oklch(.5 .12 220 / .15)',
      }}
    >
      <span
        className="font-mono font-extrabold leading-[0.9] tracking-[-0.04em] opacity-65"
        style={{ fontSize: s.num, color: s.accent }}
      >
        {rank}
      </span>
      <div className="min-w-0">
        <p
          className="m-0 font-semibold leading-[1.3] tracking-tight"
          style={{ fontSize: s.fs, color: 'oklch(.2 .04 220)' }}
        >
          {text}
        </p>
        {linkedGoal && (
          <p
            className="m-0 mt-0.5 text-[10.5px] font-bold tracking-[.06em] uppercase opacity-80"
            style={{ color: s.accent }}
          >
            ↳ {linkedGoal}
          </p>
        )}
      </div>
    </div>
  );
}
```

Usage:
```tsx
<div className="px-3.5 pt-[18px]">
  <div className="flex items-baseline justify-between mb-2.5 px-1.5">
    <p className="text-[10.5px] font-bold tracking-[.14em] uppercase m-0"
       style={{ color: 'oklch(.45 .12 220)' }}>
      Pedras da semana
    </p>
    <button className="bg-transparent border-0 p-0 cursor-pointer text-[11px] font-semibold inline-flex items-center gap-1"
            style={{ color: 'oklch(.45 .12 220)' }}>
      <Edit3 className="w-3 h-3" /> Editar
    </button>
  </div>
  {pedras[0] && <Pedra rank="I"   size="lg" text={pedras[0].text} linkedGoal={pedras[0].linkedGoal} />}
  {pedras[1] && <Pedra rank="II"  size="md" text={pedras[1].text} linkedGoal={pedras[1].linkedGoal} />}
  {pedras[2] && <Pedra rank="III" size="sm" text={pedras[2].text} linkedGoal={pedras[2].linkedGoal} />}
</div>
```

**Importante:** I/II/III em `font-mono` — o tipograma deve ser monospaced pra ficar editorial. Aplicar via `font-mono` (Tailwind) ou `var(--font-mono)`.

`linkedGoal` é um campo opcional — se a pedra foi criada a partir de um goal de longo prazo (ex.: "Maratona"), aparece como sublinha. Adicionar coluna `linked_goal_id` (e join) ou armazenar como string livre — escolha do back.

---

## 3. Roda das Áreas (Radar)

Substitui o card "Cobertura das 9 áreas" com chips. Vira um **SVG radar/aranha**.

```tsx
const AREAS = [
  { key: 'saude',           label: 'Saúde',           emoji: '💚', hue: 160 },
  { key: 'carreira',        label: 'Carreira',        emoji: '💼', hue: 220 },
  { key: 'financas',        label: 'Finanças',        emoji: '💰', hue: 85 },
  { key: 'relacionamentos', label: 'Relac.',          emoji: '❤️', hue: 15 },
  { key: 'desenvolvimento', label: 'Desenv.',         emoji: '🧠', hue: 270 },
  { key: 'familia',         label: 'Família',         emoji: '🏡', hue: 40 },
  { key: 'lazer',           label: 'Lazer',           emoji: '🌊', hue: 185 },
  { key: 'espiritualidade', label: 'Espirit.',        emoji: '✨', hue: 300 },
  { key: 'outros',          label: 'Outros',          emoji: '⚪', hue: 200 },
];

function AreasRadar({ taskCountsByArea }: { taskCountsByArea: Record<string, number> }) {
  const N = AREAS.length;
  const MAX = 5; // 5 tarefas = eixo cheio
  const cx = 140, cy = 140, R = 92;

  const point = (i: number, value: number): [number, number] => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    const r = R * Math.min(value / MAX, 1);
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };
  const ringPoint = (i: number, ratio: number): [number, number] => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    return [cx + R * ratio * Math.cos(angle), cy + R * ratio * Math.sin(angle)];
  };
  const labelPoint = (i: number): [number, number] => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    const r = R + 22;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  const polyPoints = AREAS
    .map((a, i) => point(i, taskCountsByArea[a.key] ?? 0).join(','))
    .join(' ');

  return (
    <svg viewBox="0 0 280 280" className="w-full max-w-[280px] mx-auto block">
      {/* 4 concentric polygons (web) */}
      {[1, 0.75, 0.5, 0.25].map((r, idx) => (
        <polygon key={idx}
          points={AREAS.map((_, i) => ringPoint(i, r).join(',')).join(' ')}
          fill="none" stroke="oklch(.5 .12 180 / .12)" strokeWidth="1" />
      ))}
      {/* Axis lines */}
      {AREAS.map((_, i) => {
        const [x, y] = ringPoint(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="oklch(.5 .12 180 / .12)" strokeWidth="1" />;
      })}
      {/* Filled polygon — shape of the week */}
      <polygon
        points={polyPoints}
        fill="oklch(.5 .12 180 / .22)"
        stroke="oklch(.35 .14 180)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Vertex dots (only for non-zero areas) */}
      {AREAS.map((a, i) => {
        const v = taskCountsByArea[a.key] ?? 0;
        if (v === 0) return null;
        const [x, y] = point(i, v);
        return <circle key={a.key} cx={x} cy={y} r="3"
                       fill="#fff" stroke="oklch(.35 .14 180)" strokeWidth="1.5" />;
      })}
      {/* Area labels around the perimeter */}
      {AREAS.map((a, i) => {
        const [lx, ly] = labelPoint(i);
        const isZero = (taskCountsByArea[a.key] ?? 0) === 0;
        return (
          <g key={a.key + 'lbl'} transform={`translate(${lx} ${ly})`}>
            <text textAnchor="middle" dominantBaseline="middle" dy="-6"
                  fontSize="14" opacity={isZero ? .4 : 1}>
              {a.emoji}
            </text>
            <text textAnchor="middle" dominantBaseline="middle" dy="8"
                  fontSize="9" fontWeight="700"
                  fill={isZero ? 'oklch(.7 .02 160)' : `oklch(.45 .14 ${a.hue})`}
                  style={{ letterSpacing: '.05em' }}
                  className="uppercase">
              {a.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
```

Wrapper card:
```tsx
<div className="px-3.5 pt-6">
  <div
    className="relative rounded-[22px] border overflow-hidden p-[18px]"
    style={{
      background: `
        radial-gradient(circle at 50% 100%, oklch(.92 .08 180 / .35), transparent 60%),
        linear-gradient(180deg, #fff 0%, oklch(.97 .015 180) 100%)
      `,
      borderColor: 'oklch(.5 .12 180 / .12)',
    }}
  >
    <div className="flex items-baseline justify-between">
      <p className="text-[10.5px] font-bold tracking-[.12em] uppercase m-0"
         style={{ color: 'oklch(.35 .14 180)' }}>
        Roda das áreas
      </p>
      <span className="text-[10.5px] text-muted-foreground">
        {coveredCount} de 9 cobertas
      </span>
    </div>
    <AreasRadar taskCountsByArea={taskCountsByArea} />
    {zeroAreas.length > 0 && (
      <p className="m-0 mt-2.5 text-[11px] text-muted-foreground text-center italic text-pretty">
        {formatAreaList(zeroAreas)} {zeroAreas.length === 1 ? 'está' : 'estão'} sem tarefas esta semana.
      </p>
    )}
  </div>
</div>
```

`taskCountsByArea` = `{ saude: 5, carreira: 4, ..., outros: 0 }` — agregar contando tarefas (não hábitos recorrentes) por `area` no banco.

---

## 4. Sua Semana (Heat strip + dia selecionado)

Substitui os accordions empilhados por **strip horizontal de 7 colunas** + foco no dia selecionado.

### WeekHeat — 7 mini-colunas

Cada dia tem:
- Label (SEG, TER, QUA...)
- "Heat dots" verticais: 1 ponto por tarefa, preenchido se feita
- Contador "X/Y" embaixo

```tsx
function WeekHeat({ days, selectedIdx, onSelect }: WeekHeatProps) {
  return (
    <div className="grid grid-cols-7 gap-1 px-2.5">
      {days.map((day, i) => {
        const sel = i === selectedIdx;
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className="flex flex-col items-center gap-1.5 py-2 pb-1.5 rounded-xl cursor-pointer transition-colors"
            style={{
              background: sel ? 'oklch(.5 .12 160 / .12)' : 'transparent',
              border: `1.5px solid ${sel ? 'oklch(.5 .12 160 / .5)' : 'transparent'}`,
            }}
          >
            <span
              className="text-[10px] font-bold tracking-wider uppercase"
              style={{
                color: day.isToday
                  ? 'oklch(.35 .14 160)'
                  : sel
                  ? 'oklch(.4 .12 160)'
                  : 'var(--muted-foreground)',
              }}
            >
              {day.label /* SEG, TER... */}
            </span>
            {/* Heat dots — cap at 5, show "+N" if more */}
            <div className="flex flex-col gap-0.5 items-center">
              {Array.from({ length: Math.min(Math.max(day.total, 1), 5) }).map((_, j) => (
                <span
                  key={j}
                  className="w-1 h-1 rounded-full"
                  style={{
                    background:
                      j < day.done
                        ? 'oklch(.5 .12 160)'
                        : day.total > 0
                        ? 'oklch(.5 .12 160 / .25)'
                        : 'oklch(.5 .12 160 / .08)',
                  }}
                />
              ))}
            </div>
            <span
              className="text-[9.5px] font-semibold tabular-nums"
              style={{
                color:
                  day.total === 0
                    ? 'var(--muted-foreground)'
                    : 'var(--foreground)',
              }}
            >
              {day.done}/{day.total}
            </span>
          </button>
        );
      })}
    </div>
  );
}
```

### Dia selecionado (tasks)

Hábitos e tarefas com símbolos diferentes — esse é um dos pontos visuais importantes do redesign.

```tsx
const AREA_COLORS: Record<string, { hue: number; emoji: string }> = {
  saude:           { hue: 160, emoji: '💚' },
  carreira:        { hue: 220, emoji: '💼' },
  financas:        { hue: 85,  emoji: '💰' },
  relacionamentos: { hue: 15,  emoji: '❤️' },
  desenvolvimento: { hue: 270, emoji: '🧠' },
  familia:         { hue: 40,  emoji: '🏡' },
  lazer:           { hue: 185, emoji: '🌊' },
  espiritualidade: { hue: 300, emoji: '✨' },
  outros:          { hue: 200, emoji: '⚪' },
};

function TaskRow({ task, onToggle }: TaskRowProps) {
  const c = AREA_COLORS[task.area] ?? AREA_COLORS.outros;
  const isHabit = task.type === 'habit';

  return (
    <div
      className="flex items-center gap-2.5 rounded-xl border px-3 py-2.5"
      style={{
        background: task.done ? 'oklch(.97 .015 160)' : '#fff',
        borderColor: `oklch(.5 .12 ${c.hue} / .12)`,
      }}
    >
      <button
        onClick={() => onToggle(task.id)}
        className="w-5 h-5 flex-none cursor-pointer flex items-center justify-center border-0"
        style={{
          borderRadius: isHabit ? '9999px' : '6px',
          background: task.done ? `oklch(.45 .12 ${c.hue})` : 'transparent',
          border: task.done ? 'none' : `1.5px solid oklch(.5 .12 ${c.hue} / .4)`,
        }}
      >
        {task.done && <Check className="w-2.5 h-2.5 stroke-white stroke-[3]" />}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className="m-0 text-[13px] font-medium tracking-tight truncate"
          style={{
            color: task.done ? 'var(--muted-foreground)' : 'var(--foreground)',
            textDecoration: task.done ? 'line-through' : 'none',
          }}
        >
          {task.text}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px]">{c.emoji}</span>
          {task.time && (
            <span className="text-[10px] font-mono text-muted-foreground">{task.time}</span>
          )}
          {task.growth && (
            <span
              className="px-1.5 py-px rounded-full text-[8.5px] font-bold tracking-wider uppercase"
              style={{
                background: `oklch(.92 .08 ${c.hue} / .6)`,
                color: `oklch(.4 .14 ${c.hue})`,
              }}
            >
              ↑ Crescer
            </span>
          )}
          {isHabit && (
            <span className="px-1.5 py-px rounded-full text-[8.5px] font-bold tracking-wider uppercase
                             bg-stone-100 text-muted-foreground">
              ↻ Hábito
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Símbolos:**
- Hábito recorrente: check **circular**, badge `↻ Hábito`
- Tarefa: check **quadrado** (`border-radius: 6px`), badge `↑ Crescer` se tem flag de growth

### Hábitos recorrentes no planner

A page atual mostra **tarefas**. Hábitos vivem no check-in. Recomendo:
- **Materializar hábitos como itens diários no planner** — tirar dos preferences do usuário e injetar como linha sintética em cada dia
- Não persistir no DB de tarefas — gerados on-the-fly por dia
- Toggle do hábito no planner deve marcar no check-in do dia correspondente

Se isso for grande demais agora, **flag pra v2** e deixar só tarefas no planner por ora.

### Container

```tsx
<div className="px-3.5 pt-5">
  <div className="rounded-[22px] bg-white border px-1 pt-4 pb-3 shadow-sm"
       style={{ borderColor: 'oklch(.5 .12 160 / .12)' }}>
    <p className="m-0 px-3.5 mb-3 text-[10.5px] font-bold tracking-[.12em] uppercase"
       style={{ color: 'oklch(.4 .12 160)' }}>
      Sua semana
    </p>
    <WeekHeat days={weekDays} selectedIdx={selectedDay} onSelect={setSelectedDay} />
    <div className="px-3.5 pt-3.5 mt-3 border-t" style={{ borderColor: 'oklch(.5 .12 160 / .08)' }}>
      <p className="m-0 mb-2.5 text-[11px] font-bold tracking-tight">
        {DAY_NAMES_FULL[selectedDay]} ·{' '}
        <span className="text-muted-foreground font-medium">
          {currentDay.total} itens · {currentDay.done} feitos
        </span>
      </p>
      <div className="flex flex-col gap-1.5">
        {currentDay.tasks.map(t => <TaskRow key={t.id} task={t} onToggle={toggleTask} />)}
      </div>
      <button
        onClick={() => openAddTaskFor(selectedDay)}
        className="mt-2.5 w-full px-3.5 py-2.5 rounded-xl cursor-pointer text-[12px] font-semibold
                   inline-flex items-center justify-center gap-1.5"
        style={{
          background: 'oklch(.95 .04 160)',
          border: '1.5px dashed oklch(.5 .12 160 / .35)',
          color: 'oklch(.4 .12 160)',
        }}
      >
        <Plus className="w-3 h-3 stroke-[2]" />
        Adicionar item
      </button>
    </div>
  </div>
</div>
```

---

## 5. Revisão da Semana (estado de espera)

Card âmbar warm sinalizando que a revisão estará disponível domingo à noite.

```tsx
<div className="px-3.5 pt-5">
  <div
    className="rounded-[18px] p-4 flex gap-3.5 items-center border"
    style={{
      background: `
        radial-gradient(circle at 100% 0, oklch(.92 .1 60 / .35), transparent 55%),
        linear-gradient(180deg, oklch(.98 .02 70) 0%, oklch(.96 .04 60) 100%)
      `,
      borderColor: 'oklch(.78 .1 60 / .35)',
    }}
  >
    <div
      className="w-[46px] h-[46px] rounded-full flex-none flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, oklch(.85 .15 60), oklch(.7 .18 50))',
        boxShadow: '0 4px 12px -4px oklch(.6 .18 50 / .4)',
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
        <path d="m12 2 2.4 7.4H22l-6.2 4.6 2.4 7.4-6.2-4.6L5.8 21.4l2.4-7.4L2 9.4h7.6L12 2Z"/>
      </svg>
    </div>
    <div className="flex-1 min-w-0">
      <p className="m-0 text-[10px] font-bold tracking-[.12em] uppercase"
         style={{ color: 'oklch(.45 .14 50)' }}>
        Revisão da semana
      </p>
      <p className="m-0 mt-0.5 text-[13px] leading-snug">
        {reviewState === 'pending'
          ? 'No domingo à noite, feche a semana com 4 perguntas. Leva 3 min.'
          : reviewState === 'available'
          ? 'A semana acabou. Pronta pra revisar?'
          : `Revisão completa · ${reviewScore}/5 ★`}
      </p>
    </div>
    {reviewState === 'available' && (
      <ChevronRight className="w-4 h-4 text-amber-700 flex-none" />
    )}
  </div>
</div>
```

`reviewState`:
- `pending` se hoje < domingo
- `available` se hoje >= domingo e ainda não feita
- `done` se feita

---

## 6. Maya pill (no fim, contextual)

Não é CTA pesado — é uma pílula sutil oferecendo ajuda contextual.

```tsx
<div className="px-6 pt-[18px]">
  <button
    onClick={() => router.push('/insights?context=plan')}
    className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border rounded-full
               pl-2 pr-3.5 py-2 cursor-pointer text-[12.5px] font-medium tracking-tight"
    style={{ borderColor: 'oklch(.5 .12 160 / .2)' }}
  >
    <span className="w-[22px] h-[22px] rounded-full overflow-hidden border border-white flex-none">
      <Image src="/maya.png" alt="" width={22} height={22} className="w-full h-full object-cover" />
    </span>
    {mayaPillText}
    <ArrowRight className="w-3 h-3 text-muted-foreground -ml-0.5" />
  </button>
</div>
```

`mayaPillText` muda conforme contexto:
- "Maya pode ajudar a equilibrar a roda" — se algumas áreas estão a zero
- "Conversar com Maya sobre suas pedras" — caso padrão
- "Refletir sobre a semana passada com Maya" — depois da revisão

---

## 7. Histórico

Lista compacta — sem cards, só linhas com divisores. Cada linha: label da semana, foco principal, 5 estrelas.

```tsx
<div className="px-6 pt-6">
  <p className="m-0 mb-2.5 text-[10.5px] font-bold tracking-[.14em] uppercase text-muted-foreground">
    Semanas anteriores
  </p>
  {history.map((w, i) => (
    <button
      key={w.id}
      onClick={() => router.push(`/planejamento/${w.id}`)}
      className="w-full flex items-center gap-3 py-2.5 border-t-0 text-left cursor-pointer"
      style={{ borderTop: i === 0 ? 'none' : '1px solid oklch(.5 .12 160 / .1)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="m-0 text-[11px] font-semibold text-muted-foreground tabular-nums">
          {w.dateRange /* "6–12 mai" */}
        </p>
        <p className="m-0 mt-0.5 text-[13px] truncate">{w.focusText}</p>
      </div>
      <div className="flex gap-px flex-none">
        {Array.from({ length: 5 }).map((_, j) => (
          <span key={j} className="text-[11px]"
                style={{
                  color: j < w.score ? 'oklch(.6 .18 60)' : 'oklch(.5 .12 160 / .2)',
                }}>
            ★
          </span>
        ))}
      </div>
    </button>
  ))}
</div>
```

---

## Tokens & spacing

| Item | Valor |
|---|---|
| Page padding lateral (cards) | `px-3.5` |
| Page padding lateral (inline blocks: Maya pill, Histórico) | `px-6` |
| Section vertical gap | `pt-5` a `pt-6` |
| Eyebrow type | `text-[10-11px] font-bold tracking-[.12-.14em] uppercase` |
| Card border radius | `rounded-2xl` (16px) Pedras, `rounded-[18px]` Revisão, `rounded-[22px]` Roda & Semana |
| Roman numerals | `font-mono font-extrabold` — 32/26/22px com `opacity-65` |
| Heat dot | 4×4px, `rounded-full` |
| Task check (habit) | 20×20, `rounded-full` |
| Task check (task) | 20×20, `rounded-md` (6px) |
| Pedra accent hue | `220` (azul cobalto) |
| Roda accent hue | `180` (teal) |
| Sua semana accent hue | `160` (verde marca) |
| Revisão accent hue | `50–60` (warm amber) |

---

## Implementation order

1. **Wrapper + background gradient** — copiar do dashboard v2
2. **Greeting** com weekNumber + weekRange + counter
3. **Pedras** componente com 3 tamanhos
4. **AreasRadar** SVG — o componente novo mais complexo, fazer com calma
5. **WeekHeat** strip + **TaskRow** com símbolos diferentes habit/task
6. **Revisão** card com 3 estados (pending/available/done)
7. **Maya pill** com texto contextual
8. **Histórico** lista editorial
9. **Hábitos recorrentes** materializados no planner — pode ficar como v2

---

## Testes manuais

- [ ] Greeting mostra semana + range + counter corretos
- [ ] Pedras: I/II/III, hierarquia visível, `linkedGoal` aparece quando existe
- [ ] Radar: shape se ajusta a `taskCountsByArea`; áreas com 0 tarefas ficam esmaecidas e listadas no caption
- [ ] WeekHeat: hoje destacado, clique seleciona dia e atualiza tasks abaixo
- [ ] Tasks: hábito = círculo, tarefa = quadrado; toggle marca/desmarca
- [ ] Tasks: badge "↑ Crescer" só em growth-tasks; badge "↻ Hábito" só em recorrentes
- [ ] Revisão: 3 estados (pending/available/done) com copy/visual correto
- [ ] Histórico: clique navega pra `/planejamento/[id]`
- [ ] Sem scroll horizontal acidental no mobile
- [ ] Bottom-nav existente continua funcionando
- [ ] Dark mode não desenhado — combinar antes

---

## Caveats

- **Dark mode** não foi desenhado. Combinar com o fundador antes de implementar.
- **Hábitos no planner** — recomendação é materializar como linhas sintéticas geradas a partir dos `enabled_questions` do usuário. Pode ser complexo na primeira passada — flag como v2 se preferir.
- **`linkedGoal`** das Pedras precisa de modelagem nova (FK pra goal de longo prazo ou string livre). A page atual só tem texto.
- **WeekHeat com >5 tarefas no dia**: hoje a UI mostra no máximo 5 dots — adicionar "+N" indicator ou substituir por barra horizontal se ficar comum.
- **Revisão `done` state**: a UI mostra "X/5 ★". Se a review tem texto + estrelas, considerar adicionar `View →` pra abrir a entrada.
- **Performance do radar**: SVG simples, sem problema. Mas se a página tiver muitas re-renders, memoizar o polygon points.

---

## Files in `references/`

| Arquivo | O que é |
|---|---|
| `Planejamento Explorations.html` | Canvas com 2 variantes (A=Bento aprovada, B=Editorial). Implementar a **A** |
| `PlanBento.jsx` | Implementação JSX da variante final (referência visual — não copiar direto) |
| `Maya.png` | Avatar — copiar pra `public/maya.png` se ainda não estiver lá |
