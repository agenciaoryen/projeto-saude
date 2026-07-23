# Handoff — Módulo Metas (4 telas)

## Overview

Redesign completo do módulo de Metas do app **Projeto Saúde**. As 4 telas que o Claude Code gerou direto (sem design) estão funcionais mas visualmente iguais — todas com o mesmo header gradient verde-azul + cards com barrinha colorida de 5px no topo. Esta versão dá identidade clara a cada tela e segue a linguagem visual já aprovada nas outras partes do app (Dashboard Bento + planner).

**Direção final mista** (decisões já validadas em design):

| Tela | Direção | Por quê |
|---|---|---|
| `/metas` (lista) | **Editorial** | A lista pede respiro e hierarquia tipográfica — cada meta é um capítulo |
| `/metas/[id]` (detalhe) | **Bento** | Detalhe pede estrutura visual rica — roadmap, ações, comprometimento, todos coexistindo |
| `/metas/nova` (wizard) | **Bento** | Passo-a-passo merece estrutura clara, progresso visível, foco por step |
| `/metas/coach` (Maya chat) | **Editorial** | Conversa pede intimidade e respiro, não chrome de produto |

## About the design files

Os arquivos em `references/` são **referências visuais em JSX** — protótipos que mostram o look-and-feel intencional, **não** código de produção pra copiar diretamente. Recriar no codebase existente (`projeto-saude/`), reusando tokens OKLCH em `globals.css`, ícones `lucide-react`, sistema i18n em `lib/i18n.ts`, e a lógica de fetch/save que já existe nas pages atuais.

Abra `references/Metas Explorations.html` num browser pra ver os 4 artboards.

## Fidelity

**High-fidelity (hifi).**

---

## Tela 1 — Lista (`/metas`) — **Editorial**

Substitui o `<GoalCard>` empilhado por uma lista editorial onde cada meta é um "capítulo".

### Layout

```
┌──────────────────────────────────┐
│ VOLUME I · MMXXVI                │
│ O livro das metas    (italic)    │
│ 3 ativas · 1 pausada             │
│        ─── (rule) ───            │
│                                  │
│ I              💼 CARREIRA       │ ← order mono + area chip
│                                  │
│ Publicar meu livro até dezembro  │
│ "Pela Sofia. Pra ela me ver…"   │ ← why italic
│                                  │
│  62%  ████████░░░░░ 28d          │ ← number + line + days
│        Revisando capítulos 4-5   │
│                                  │
│ │ PRÓXIMO PASSO                  │ ← left border accent
│ │ Cap. 5 — revisão completa      │
│ ──────────────────────────────  │
│ II             💚 SAÚDE          │ ← (próximo capítulo)
│ ...                              │
└──────────────────────────────────┘
```

### Header editorial

```tsx
<div className="text-center px-6 pt-6 pb-2">
  <p className="m-0 font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">
    Volume I · {romanYear()} {/* MMXXVI */}
  </p>
  <h1 className="mt-1.5 text-[30px] font-bold italic tracking-tight leading-[1.05]">
    O livro das metas
  </h1>
  <p className="mt-1.5 text-xs text-muted-foreground">
    {activeCount} ativas{pausedCount > 0 && ` · ${pausedCount} pausada${pausedCount > 1 ? 's' : ''}`}
  </p>
  <div className="flex justify-center mt-3.5">
    <span className="w-11 h-px" style={{ background: 'oklch(.55 .08 80 / .35)' }} />
  </div>
</div>
```

### Meta spread (cada meta)

```tsx
function MetaSpread({ goal, order, primary }: Props) {
  const hue = AREA_HUES[goal.area];
  return (
    <button
      onClick={() => router.push(`/metas/${goal.id}`)}
      className={`block w-full text-left px-6 py-6 ${goal.status === 'pausada' ? 'opacity-55' : ''}`}
      style={{ borderTop: '1px solid oklch(.55 .08 80 / .25)' }}
    >
      {/* Header: order numeral + area chip */}
      <div className="flex items-baseline justify-between mb-1.5">
        <span
          className="font-mono text-[32px] font-extrabold leading-[0.85] tracking-[-0.04em]"
          style={{ color: `oklch(.5 .14 ${hue})`, opacity: primary ? 1 : .55 }}
        >
          {order /* I, II, III... */}
        </span>
        <span
          className="text-[10px] font-bold tracking-[.14em] uppercase"
          style={{ color: `oklch(.4 .12 ${hue})` }}
        >
          {AREA_EMOJI[goal.area]} {AREA_LABEL[goal.area]}
        </span>
      </div>

      {/* Title */}
      <h2
        className={`m-0 mt-2 leading-tight tracking-tight text-pretty
                    ${primary ? 'text-[22px] font-bold' : 'text-lg font-semibold'}`}
      >
        {goal.title}
      </h2>

      {/* Why (italic) */}
      {goal.why_it_matters && (
        <p
          className={`mt-2 italic leading-[1.45] text-muted-foreground text-pretty
                      ${primary ? 'text-sm' : 'text-[13px]'}`}
        >
          "{goal.why_it_matters}"
        </p>
      )}

      {/* Progress: big number + line */}
      <div className="mt-4 grid grid-cols-[60px_1fr] gap-3.5 items-center">
        <span
          className="text-[26px] font-bold tracking-[-0.025em] leading-none tabular-nums"
          style={{ color: `oklch(.4 .14 ${hue})` }}
        >
          {progress}<span className="text-sm opacity-60">%</span>
        </span>
        <div>
          <div
            className="h-[3px] rounded-full overflow-hidden"
            style={{ background: `oklch(.5 .12 ${hue} / .15)` }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, oklch(.45 .14 ${hue}), oklch(.55 .14 ${hue}))`,
              }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
            <span className="italic">{currentStageTitle}</span>
            {daysLeft && (
              <span className="font-semibold" style={{ color: 'oklch(.42 .14 50)' }}>
                {daysLeft}d restantes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Next action — chapter teaser */}
      {nextAction && goal.status !== 'pausada' && (
        <p
          className="mt-3.5 pl-3 text-xs"
          style={{ borderLeft: `2px solid oklch(.5 .14 ${hue} / .5)` }}
        >
          <span
            className="block text-[9.5px] font-bold tracking-[.12em] uppercase mb-0.5"
            style={{ color: `oklch(.5 .12 ${hue})` }}
          >
            Próximo passo
          </span>
          <span>{nextAction.title}</span>
        </p>
      )}
    </button>
  );
}
```

### Ordering

Em vez de agrupar por status (ativas vs pausadas), **listar tudo em sequência de prioridade**, com pausadas no fim (esmaecidas com `opacity-55`):

```tsx
const orderedGoals = useMemo(() => {
  const active = goals.filter(g => g.status === 'ativa');
  const paused = goals.filter(g => g.status === 'pausada');
  // Urgentes primeiro (com daysLeft <= 30), depois resto
  active.sort((a, b) => {
    const aDays = a.target_date ? daysUntil(a.target_date) : 999;
    const bDays = b.target_date ? daysUntil(b.target_date) : 999;
    return aDays - bDays;
  });
  return [...active, ...paused];
}, [goals]);

// Roman numerals — manter sequência total (I, II, III, IV...)
const ROMANS = ['I','II','III','IV','V'];
```

### Footer + FAB

Footer com regra + frase italic em vez do FAB azul atual. FAB de criar nova meta vira **link no header** (`+ Adicionar`):

```tsx
{/* Trocar FAB pelo link superior */}
<button onClick={() => router.push('/metas/nova')}
        className="absolute top-4 right-5 inline-flex items-center gap-1 text-[12px] font-semibold"
        style={{ color: 'oklch(.45 .12 160)' }}>
  <Plus className="w-3.5 h-3.5" />
  Nova meta
</button>
```

(Manter limit indicator dos 5 slots, mas como subline no header em vez de barra grande.)

---

## Tela 2 — Detalhe (`/metas/[id]`) — **Bento**

Substitui o header gradient grande + cards empilhados de comprometimento + accordions de etapas, por um detalhe Bento com **roadmap vertical**.

### Layout

```
┌──────────────────────────────────┐
│ [←]                       [⋯]    │ ← floating
│                                  │
│ ┌─ HERO (área hue) ─────────────┐│
│ │ 💼 CARREIRA · DESTINO          ││
│ │ Publicar meu livro até dezembro││
│ │ "Pela Sofia. Pra ela…"         ││
│ │ 62 %       5/8 etapas · 28d   ││
│ │ ████████░░░░                  ││
│ └────────────────────────────────┘│
│                                  │
│ [🛡️ João Silva] [🏆 Lisboa] [⚠️] │ ← chips inline
│                                  │
│ MAPA DA META    + Adicionar etapa│
│  ●  Definir tema e estrutura     │ ← done, line-through
│  │  2/2 ações ✓                  │
│  ●  Escrever primeiros capítulos │
│  │  1/1 ações ✓                  │
│  ●  Revisar capítulos 1-3        │
│  │                                │
│ [4] Revisar capítulos 4 e 5     │ ← current, outlined
│  │  ┌─────────────────────────┐  │
│  │  │ ▢ ✓ Cap. 4 leitura      │  │ ← actions panel
│  │  │ ▢   Cap. 4 — segunda    │  │
│  │  │   [SE estiver cansada…] │  │ ← purple if-then
│  │  │ ▢   Cap. 5 revisão     │  │
│  │  │ + Adicionar ação        │  │
│  │  └─────────────────────────┘  │
│  ●  Capítulos finais             │ ← future, faded
│  ●  Capa e diagramação           │
│  ...                              │
│                                  │
│ [maya pill] Conversar sobre…  → │
└──────────────────────────────────┘
```

### Hero card (cor da área)

```tsx
const hue = AREA_HUES[goal.area];

<div className="px-3.5 pt-16">
  <div
    className="relative rounded-[22px] overflow-hidden border p-[20px_22px]"
    style={{
      background: `linear-gradient(135deg, oklch(.95 .04 ${hue}) 0%, oklch(.88 .08 ${hue}) 100%)`,
      borderColor: `oklch(.5 .12 ${hue} / .2)`,
    }}
  >
    {/* Decorative shape */}
    <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full pointer-events-none"
         style={{ background: `radial-gradient(circle, oklch(.5 .12 ${hue} / .15), transparent 70%)` }} />

    <div className="relative">
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-[.08em] uppercase"
            style={{
              background: `oklch(.5 .12 ${hue} / .15)`,
              color: `oklch(.32 .12 ${hue})`,
            }}>
        {AREA_EMOJI[goal.area]} {AREA_LABEL[goal.area]} · {goal.type === 'destino' ? 'Destino' : 'Direção'}
      </span>

      <h1 className="mt-2.5 text-2xl font-bold tracking-tight leading-tight"
          style={{ color: `oklch(.18 .04 ${hue})` }}>
        {goal.title}
      </h1>

      {goal.why_it_matters && (
        <p className="mt-2 text-[13.5px] italic leading-[1.45] text-pretty"
           style={{ color: `oklch(.35 .06 ${hue})` }}>
          "{goal.why_it_matters}"
        </p>
      )}

      {/* Progress */}
      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-[36px] font-extrabold tracking-[-0.03em] tabular-nums leading-none"
                style={{ color: `oklch(.32 .14 ${hue})` }}>
            {progress}
          </span>
          <span className="text-lg font-medium"
                style={{ color: `oklch(.45 .1 ${hue})` }}>%</span>
          <span className="ml-auto text-[11px] tabular-nums"
                style={{ color: `oklch(.4 .08 ${hue})` }}>
            {doneStages}/{totalStages} etapas
            {daysLeft != null && ` · ${daysLeft}d`}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full overflow-hidden"
             style={{ background: `oklch(.5 .12 ${hue} / .2)` }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, oklch(.4 .14 ${hue}), oklch(.5 .16 ${hue}))`,
            }}
          />
        </div>
      </div>
    </div>
  </div>
</div>
```

### Comprometimento — **chips inline**, só se preenchido

Em vez do painel grande sempre visível, **3 chips lado a lado** que aparecem **apenas se preenchidos**:

```tsx
{(goal.guardian_name || goal.reward || goal.punishment) && (
  <div className="px-5 pt-3.5 flex flex-wrap gap-1.5">
    {goal.guardian_name && (
      <CommitChip type="guardian" label={goal.guardian_name} sub="Guardião" />
    )}
    {goal.reward && (
      <CommitChip type="reward" label={goal.reward} sub="Recompensa" />
    )}
    {goal.punishment && (
      <CommitChip type="punishment" label={goal.punishment} sub="Punição" />
    )}
  </div>
)}

function CommitChip({ type, label, sub }: ChipProps) {
  const COLORS = {
    guardian:   { bg: 'oklch(.93 .05 160)', fg: 'oklch(.35 .12 160)', icon: '🛡️' },
    reward:     { bg: 'oklch(.94 .08 85)',  fg: 'oklch(.42 .14 85)',  icon: '🏆' },
    punishment: { bg: 'oklch(.94 .06 15)',  fg: 'oklch(.42 .14 15)',  icon: '⚠️' },
  }[type];
  return (
    <div className="inline-flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-xl"
         style={{ background: COLORS.bg, border: `1px solid ${COLORS.fg}30` }}>
      <span className="text-[13px]">{COLORS.icon}</span>
      <div className="min-w-0">
        <p className="m-0 text-[9px] font-bold tracking-[.08em] uppercase opacity-70"
           style={{ color: COLORS.fg }}>{sub}</p>
        <p className="m-0 text-xs font-semibold truncate" style={{ color: COLORS.fg }}>{label}</p>
      </div>
    </div>
  );
}
```

Se **nada** preenchido, mostrar uma linha sutil com CTA pra adicionar:
```tsx
{!goal.guardian_name && !goal.reward && !goal.punishment && (
  <button onClick={openCommitmentEdit}
          className="mx-5 mt-3.5 px-3.5 py-2 rounded-xl text-[11.5px] font-semibold inline-flex items-center gap-1.5"
          style={{
            background: 'transparent',
            border: '1.5px dashed oklch(.5 .12 160 / .3)',
            color: 'oklch(.45 .12 160)',
          }}>
    <Plus className="w-3 h-3" />
    Adicionar comprometimento (guardião, recompensa, punição)
  </button>
)}
```

### Roadmap vertical

Substitui o accordion atual por uma timeline conectada verticalmente.

```tsx
function Stage({ stage, index, isCurrent }: StageProps) {
  const isDone = stage.status === 'concluida';
  const hue = AREA_HUES[goal.area];

  return (
    <div className="grid grid-cols-[30px_1fr] gap-3 relative" style={{ minHeight: isCurrent ? 'auto' : 50 }}>
      {/* Vertical connector + node */}
      <div className="relative flex justify-center">
        {!isLast && (
          <span className="absolute top-[30px] -bottom-4 w-[2px] left-1/2 -translate-x-1/2"
                style={{ background: isDone ? `oklch(.5 .14 ${hue})` : `oklch(.5 .12 ${hue} / .2)` }} />
        )}
        <button
          onClick={() => toggleStage(stage.id, stage.status)}
          className="relative z-1 w-[30px] h-[30px] rounded-full flex items-center justify-center font-mono font-extrabold text-xs cursor-pointer"
          style={{
            background: isDone ? `oklch(.5 .14 ${hue})` : isCurrent ? '#fff' : `oklch(.5 .12 ${hue} / .1)`,
            border: isCurrent ? `2.5px solid oklch(.5 .14 ${hue})` : 'none',
            color: isDone ? '#fff' : isCurrent ? `oklch(.4 .14 ${hue})` : `oklch(.5 .1 ${hue} / .6)`,
            boxShadow: isCurrent ? `0 0 0 5px oklch(.5 .14 ${hue} / .15)` : 'none',
          }}
        >
          {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : index + 1}
        </button>
      </div>

      {/* Stage content */}
      <div className={`min-w-0 ${isLast ? '' : 'pb-6'}`}>
        <p
          className={`m-0 mt-1 leading-tight tracking-tight
                      ${isCurrent ? 'text-[15px] font-bold' : 'text-[13.5px] font-medium'}`}
          style={{
            color: isDone ? 'var(--muted-foreground)' : isCurrent ? `oklch(.2 .04 ${hue})` : 'var(--foreground)',
            textDecoration: isDone ? 'line-through' : 'none',
          }}
        >
          {stage.title}
        </p>

        {isCurrent && (
          <StageActions stage={stage} hue={hue} />
        )}

        {isDone && stage.goal_actions?.length > 0 && (
          <p className="m-0 mt-0.5 text-[10.5px] text-muted-foreground">
            {doneActions}/{totalActions} ações ✓
          </p>
        )}
      </div>
    </div>
  );
}
```

### Actions panel (etapa atual)

```tsx
function StageActions({ stage, hue }: ActionPanelProps) {
  return (
    <div
      className="mt-3 p-3.5 rounded-2xl bg-white shadow-md"
      style={{
        border: `1px solid oklch(.5 .12 ${hue} / .15)`,
        boxShadow: `0 4px 14px -6px oklch(.5 .12 ${hue} / .2)`,
      }}
    >
      {actions.map((action, i) => (
        <ActionRow key={action.id} action={action} hue={hue} isFirst={i === 0} />
      ))}
      <button className="mt-2.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-semibold inline-flex items-center gap-1.5"
              style={{
                background: 'transparent',
                border: `1.5px dashed oklch(.5 .14 ${hue} / .35)`,
                color: `oklch(.4 .14 ${hue})`,
              }}>
        <Plus className="w-3 h-3" /> Adicionar ação
      </button>
    </div>
  );
}

function ActionRow({ action, hue, isFirst }: ActionRowProps) {
  return (
    <div className="flex items-start gap-2.5 py-1.5"
         style={{ borderTop: isFirst ? 'none' : '1px solid oklch(.5 .12 160 / .08)' }}>
      <button
        onClick={() => toggleAction(action.id)}
        className="w-[18px] h-[18px] rounded-md flex-none mt-0.5 flex items-center justify-center"
        style={{
          background: action.done ? `oklch(.5 .14 ${hue})` : 'transparent',
          border: action.done ? 'none' : `1.5px solid oklch(.5 .14 ${hue} / .4)`,
        }}
      >
        {action.done && <Check className="w-2.5 h-2.5 stroke-white stroke-[3]" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="m-0 text-[13px] leading-snug font-medium"
           style={{
             color: action.done ? 'var(--muted-foreground)' : 'var(--foreground)',
             textDecoration: action.done ? 'line-through' : 'none',
           }}>
          {action.title}
        </p>
        {action.if_then && !action.done && (
          <div className="mt-1.5 inline-flex flex-wrap items-center gap-1 px-2 py-1 rounded-md"
               style={{ background: 'oklch(.95 .04 270)', border: '1px solid oklch(.6 .12 270 / .2)' }}>
            <span className="text-[9px] font-extrabold tracking-[.08em]"
                  style={{ color: 'oklch(.4 .14 270)' }}>
              SE
            </span>
            <span className="text-[11px] leading-snug" style={{ color: 'oklch(.3 .08 270)' }}>
              {action.if_then}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Maya pill no fim

Substitui o CTA Coach gradient grande:
```tsx
<div className="px-6 pt-5">
  <button onClick={() => router.push(`/metas/coach?context=${goal.id}`)}
          className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border rounded-full
                     pl-2 pr-3.5 py-2 cursor-pointer text-[12.5px] font-medium"
          style={{ borderColor: 'oklch(.5 .12 220 / .2)' }}>
    <span className="w-[22px] h-[22px] rounded-full overflow-hidden border border-white flex-none">
      <Image src="/maya.png" alt="" width={22} height={22} className="w-full h-full object-cover" />
    </span>
    Conversar sobre essa meta com Maya
    <ArrowRight className="w-3 h-3 text-muted-foreground -ml-0.5" />
  </button>
</div>
```

---

## Tela 3 — Wizard `/metas/nova` — **Bento step-by-step**

A page atual já tem 5 steps (Área → Definir → Etapa → Guardião → Pacto). Manter os steps, redesenhar visualmente.

### Padrão geral

Mesma chrome que o **Check-in Ritual**: progress dots no topo, step counter mono, conteúdo com padding generoso, bottom nav.

```tsx
<div className="relative min-h-screen pb-28"
     style={{
       background: `
         radial-gradient(ellipse 80% 50% at 50% 0%, oklch(.96 .03 ${HUE} / .45) 0%, transparent 60%),
         linear-gradient(180deg, oklch(.97 .005 160) 0%, oklch(.94 .02 160) 100%)
       `,
       transition: 'background .5s ease', /* hue muda quando seleciona área */
     }}>

  {/* Close button (top-left) */}
  <button onClick={() => router.back()} className="absolute top-4 left-4 ...">
    <X className="w-4 h-4" />
  </button>

  {/* Progress dots */}
  <div className="absolute top-[22px] left-16 right-16 z-9 flex gap-1">
    {[0,1,2,3,4].map(i => (
      <div key={i} className="flex-1 h-[3px] rounded-full transition-colors"
           style={{ background: i <= step ? `oklch(.45 .14 ${HUE})` : `oklch(.5 .12 ${HUE} / .15)` }} />
    ))}
  </div>
  <p className="absolute top-14 inset-x-0 text-center font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground m-0">
    Nova meta · passo {String(step + 1).padStart(2, '0')} de 05
  </p>

  {/* Content */}
  <div className="px-6 pt-[100px]">
    {step === 0 && <StepArea ... />}
    {step === 1 && <StepDefine ... />}
    {step === 2 && <StepFirstStage ... />}
    {step === 3 && <StepGuardian ... />}
    {step === 4 && <StepStakes ... />}
  </div>

  {/* Bottom nav */}
  <div className="absolute bottom-7 left-6 right-6 flex justify-between items-center">
    <button onClick={back} className="bg-transparent border-0 text-[13px] text-muted-foreground">
      {step > 0 ? '← Voltar' : ''}
    </button>
    <Button onClick={next}
            className="h-12 px-[22px] rounded-2xl text-sm font-semibold gap-1.5"
            style={{
              background: `oklch(.45 .14 ${HUE})`,
              boxShadow: `0 4px 14px -4px oklch(.45 .14 ${HUE} / .5)`,
            }}>
      {step < 4 ? 'Continuar' : 'Criar meta'}
      <ArrowRight className="w-3.5 h-3.5" />
    </Button>
  </div>
</div>
```

### Step 0 — Área (8 tiles bento)

Grid 2×4, cada tile com emoji + label + descrição curta. Selecionado vira card colored com check no canto.

```tsx
<h1 className="text-[28px] font-bold tracking-tight leading-[1.1] text-balance m-0">
  Que área da sua vida?
</h1>
<p className="mt-2 mb-6 text-[13px] text-muted-foreground leading-[1.5]">
  Toda meta vive em uma área. Escolha a principal.
</p>

<div className="grid grid-cols-2 gap-2">
  {AREAS.map((a) => {
    const sel = area === a.value;
    return (
      <button key={a.value}
              onClick={() => setArea(a.value)}
              className="relative text-left rounded-2xl px-3 pt-3.5 pb-3 cursor-pointer transition-all"
              style={{
                background: sel
                  ? `linear-gradient(135deg, oklch(.96 .04 ${a.hue}) 0%, oklch(.92 .07 ${a.hue}) 100%)`
                  : 'oklch(1 0 0 / .55)',
                border: sel ? `2px solid oklch(.45 .14 ${a.hue})` : '2px solid oklch(.5 .12 160 / .1)',
              }}>
        <span className="block text-[22px] mb-1.5">{a.emoji}</span>
        <p className="m-0 text-[13px] font-bold tracking-tight"
           style={{ color: sel ? `oklch(.2 .04 ${a.hue})` : 'var(--foreground)' }}>
          {a.label}
        </p>
        <p className="m-0 mt-0.5 text-[10.5px]"
           style={{ color: sel ? `oklch(.4 .08 ${a.hue})` : 'var(--muted-foreground)' }}>
          {a.desc}
        </p>
        {sel && (
          <span className="absolute top-2.5 right-2.5 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                style={{ background: `oklch(.45 .14 ${a.hue})` }}>
            <Check className="w-2.5 h-2.5 stroke-white stroke-[3]" />
          </span>
        )}
      </button>
    );
  })}
</div>
```

### Step 1 — Definir (título + porquê + descrição + data)

Form livre, sem cards individuais. Eyebrow + input grande pra título, textarea pro porquê, etc. Manter validações atuais.

### Step 2 — Primeira etapa

Visual de "primeira pedra" — número grande "1" + input pro título. Manter o texto explicativo de quebrar metas em etapas.

### Step 3 — Guardião

Ícone Shield grande + 2 inputs (nome + contato). Link "Pular" embaixo.

### Step 4 — Recompensa / Punição

2 cards lado a lado: amber pra recompensa, rose pra punição. Cada um com seu input. Texto motivacional já existente. Link "Pular".

### Final step button

Em vez de gradient verde-azul: **gradient da área selecionada**:
```tsx
background: `linear-gradient(135deg, oklch(.45 .14 ${HUE}), oklch(.55 .14 ${HUE}))`
```

---

## Tela 4 — Maya Coach (`/metas/coach`) — **Editorial**

Substitui o chat com header gradient + bubbles arredondadas grandes por uma vibe mais íntima/editorial.

### Header

Cream-papel translucent, avatar pequeno com aura sutil + status dot online:
```tsx
<div className="px-5 py-4 flex items-center gap-3 flex-none border-b"
     style={{
       background: 'oklch(.99 .005 80 / .7)',
       backdropFilter: 'blur(8px)',
       borderColor: 'oklch(.55 .08 80 / .15)',
     }}>
  <button onClick={() => router.back()}
          className="w-[34px] h-[34px] rounded-full bg-white/70 flex items-center justify-center">
    <ChevronLeft className="w-4 h-4" />
  </button>
  <div className="relative flex-none">
    <span className="absolute -inset-1 rounded-full" style={{ background: 'oklch(.78 .14 160 / .12)' }} />
    <span className="block w-[38px] h-[38px] rounded-full overflow-hidden border-2 border-white relative">
      <Image src="/maya.png" alt="" width={38} height={38} className="object-cover" />
    </span>
    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
  </div>
  <div className="flex-1 min-w-0">
    <p className="m-0 text-[15px] font-bold tracking-tight">Maya</p>
    <p className="m-0 text-[11px] text-muted-foreground italic">
      {loading ? 'pensando…' : 'sua coach de metas · presente'}
    </p>
  </div>
</div>
```

### Empty state — editorial

Não usa header gradient grande nem ícone Sparkles em círculo gradient. Em vez disso, eyebrow mono + título italic + lista de prompts em linhas separadas por rules.

```tsx
{messages.length === 0 && (
  <div className="text-center py-5 pb-7">
    <p className="m-0 mb-1 font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">
      Uma conversa
    </p>
    <h2 className="m-0 text-2xl font-bold italic tracking-tight">Como posso ajudar?</h2>
    <p className="mx-8 mt-2 text-[12.5px] leading-[1.5] text-muted-foreground">
      Eu vejo suas metas, seu diário e seus check-ins. Pode me perguntar qualquer coisa.
    </p>

    <div className="flex justify-center my-[22px]">
      <span className="w-11 h-px" style={{ background: 'oklch(.55 .08 80 / .35)' }} />
    </div>

    <p className="m-0 mb-2.5 text-[10px] font-bold tracking-[.14em] uppercase text-muted-foreground">
      Talvez você queira começar com
    </p>

    {STARTERS.map((p, i) => (
      <button key={i}
              onClick={() => send(p)}
              className="w-full text-left flex justify-between items-center px-1 py-3.5 cursor-pointer
                         text-[14px] italic font-medium"
              style={{
                borderTop: '1px solid oklch(.55 .08 80 / .2)',
                borderBottom: i === STARTERS.length - 1 ? '1px solid oklch(.55 .08 80 / .2)' : 'none',
                background: 'transparent',
              }}>
        "{p}"
        <ChevronRight className="w-3 h-3 text-muted-foreground" />
      </button>
    ))}
  </div>
)}
```

### Messages — Maya **sem balão**

Diferencial visual: msgs do **user** continuam em bubble (verde marca), msgs da **Maya** ficam em **texto livre + avatarzinho à esquerda** (como uma citação em conversa). Faz a Maya parecer mais "voz" que "interface".

```tsx
{messages.map((msg) => msg.role === 'user' ? (
  <div key={msg.id} className="flex justify-end mb-3.5">
    <div className="max-w-[80%] px-3.5 py-2.5 text-white text-sm leading-[1.55]"
         style={{
           background: 'oklch(.45 .14 160)',
           borderRadius: '16px 16px 4px 16px',
         }}>
      {msg.content}
    </div>
  </div>
) : (
  <div key={msg.id} className="grid grid-cols-[32px_1fr] gap-2.5 mb-3.5">
    <span className="w-[26px] h-[26px] rounded-full overflow-hidden border border-white">
      <Image src="/maya.png" alt="" width={26} height={26} className="object-cover" />
    </span>
    <div className="text-sm leading-[1.55] text-foreground whitespace-pre-wrap">
      {msg.content}
    </div>
  </div>
))}
```

### Input

Mais limpo, sem gradient grande:
```tsx
<div className="px-4 py-3 flex gap-2.5 items-center flex-none border-t"
     style={{
       background: 'oklch(.99 .005 80 / .85)',
       backdropFilter: 'blur(8px)',
       borderColor: 'oklch(.55 .08 80 / .2)',
     }}>
  <div className="flex-1 rounded-full bg-white px-4 py-2.5"
       style={{ border: '1px solid oklch(.55 .08 80 / .25)' }}>
    <input placeholder="Escreva para Maya…"
           className="w-full border-none bg-transparent outline-none text-sm" />
  </div>
  <button className="w-11 h-11 rounded-full flex-none flex items-center justify-center cursor-pointer"
          style={{
            background: 'oklch(.45 .14 160)',
            boxShadow: '0 4px 12px -4px oklch(.45 .14 160 / .45)',
          }}>
    <Send className="w-4 h-4 stroke-white stroke-2" />
  </button>
</div>
```

---

## Constants — share across screens

Criar `src/lib/goals-design.ts`:

```ts
export const AREA_CONFIG = {
  saude:           { label: 'Saúde',            emoji: '💚', hue: 160 },
  carreira:        { label: 'Carreira',         emoji: '💼', hue: 220 },
  financas:        { label: 'Finanças',         emoji: '💰', hue: 85  },
  relacionamentos: { label: 'Relacionamentos',  emoji: '❤️', hue: 15  },
  desenvolvimento: { label: 'Desenvolvimento',  emoji: '🧠', hue: 270 },
  familia:         { label: 'Família',          emoji: '🏡', hue: 40  },
  lazer:           { label: 'Lazer',            emoji: '🌊', hue: 185 },
  espiritualidade: { label: 'Espiritualidade',  emoji: '✨', hue: 300 },
} as const;

export const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export function areaColor(area: string, l = .5, c = .12, a = 1) {
  const hue = AREA_CONFIG[area]?.hue ?? 160;
  return `oklch(${l} ${c} ${hue} / ${a})`;
}

export function romanYear(): string {
  const y = new Date().getFullYear();
  // simple conversion for years 1000-2999
  // MMXXVI = 2026
  const M = Math.floor(y / 1000);
  const rest = y % 1000;
  const C = Math.floor(rest / 100);
  const restC = rest % 100;
  const X = Math.floor(restC / 10);
  const I = restC % 10;
  // ... full impl
  return 'MMXXVI'; // simplified
}
```

---

## Implementation order

1. **Constants** em `lib/goals-design.ts`
2. **Lista editorial** — substitui o GoalCard atual
3. **Detalhe Bento** — hero + chips + roadmap + actions panel
4. **Wizard Bento** — chrome + 5 steps
5. **Coach Editorial** — header + empty state + msg style

---

## Testes manuais

- [ ] Lista: metas urgentes (≤30 dias) aparecem primeiro; pausadas no fim com opacity-55
- [ ] Lista: numeração I/II/III continua em sequência (não reseta entre ativas/pausadas)
- [ ] Lista: clique numa meta abre `/metas/[id]` (mantém comportamento atual)
- [ ] Detalhe: comprometimento aparece como chips se preenchido, senão CTA "Adicionar comprometimento"
- [ ] Detalhe: roadmap mostra etapa atual com painel branco abaixo
- [ ] Detalhe: toggle de stage marca como concluída; quando todas, confetti dispara (mantém)
- [ ] Detalhe: SE-ENTÃO continua disponível na ação, com visual roxo destacado
- [ ] Wizard: background muda de hue quando seleciona área (transition .5s)
- [ ] Wizard: validações continuam (título ≥3 chars, porquê ≥10)
- [ ] Wizard: botão "Criar meta" no último step usa gradient da área
- [ ] Coach: empty state com starters como linhas editoriais
- [ ] Coach: mensagens da Maya sem balão (texto + avatar)
- [ ] Coach: input enter envia, shift-enter quebra linha
- [ ] Dark mode não desenhado — combinar antes

---

## Caveats

- **Dark mode** não foi desenhado pra nenhuma das 4 telas.
- **`romanYear()`** simplificada — implementação completa de roman numerals pra 1000-2999 fica como exercício rápido. Pra agora, hardcoded.
- **Mensagens da Maya sem balão** é uma quebra de padrão de chat — testar com usuários se passa "natural" ou "estranho". Se estranho, voltar pra balão claro com border sutil.
- **Lista sem agrupamento explícito** (vs atual que tem "Ativas" e "Pausadas") — pausadas só aparecem com opacity. Se ficar confuso na prática, adicionar header pequeno antes da primeira pausada: "PAUSADAS" em mono uppercase.
- **`coach?context=${goal.id}`** — query param novo pro coach saber qual meta abrir conversa. Backend do `/api/goals/chat` precisaria considerar esse contexto. Por ora, frontend só passa o param.
- **Decision menu (kebab no detalhe)** continua igual ao atual — não redesenhei. Mantém Editar / Pausar / Concluir / Arquivar.

---

## Files in `references/`

| Arquivo | O que é |
|---|---|
| `Metas Explorations.html` | Canvas com 4 artboards do design final |
| `MetasListaEditorial.jsx` | Lista — referência visual |
| `MetaDetalhe.jsx` | Detalhe Bento — referência visual |
| `MetaWizard.jsx` | Wizard — só step 0 desenhado, outros descritos no README |
| `MayaCoachEditorial.jsx` | Coach Editorial — referência visual |
| `Maya.png` | Avatar — copiar pra `public/maya.png` se ainda não estiver lá |
