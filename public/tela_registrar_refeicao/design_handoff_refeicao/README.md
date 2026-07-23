# Handoff — Registrar Refeição (Bento foto-first)

## Overview

Redesign de `src/app/(auth)/nutricao/registrar/page.tsx` do app **Projeto Saúde**. A versão atual tem todos os recursos (foto, descrição, tipo, análise IA, edição de itens/macros) mas o layout é shadcn-padrão (cards empilhados, form genérico). Esta versão dá identidade Bento (consistente com dashboard aprovado) e organiza o fluxo em **3 estados claros**: Captura → Análise → Resultado.

## About the design files

Os arquivos em `references/` são **referências visuais em JSX** — protótipos que mostram o look-and-feel intencional, **não** código de produção pra copiar diretamente. Recriar no codebase existente (`projeto-saude/`), reusando tokens OKLCH em `globals.css`, ícones `lucide-react`, sistema i18n em `lib/i18n.ts`, e toda a lógica de fetch/save/upload/analyze que já existe na page atual.

Abra `references/Refeicao Explorations.html` num browser pra ver os 3 estados.

## Fidelity

**High-fidelity (hifi).**

---

## Architecture

A page atual já controla 3 stages (`capture` / `analyzing` / `results`) via state. **Mantenha toda a lógica** (upload, /api/meals POST, /api/meals/analyze, edição de items/macros, confirmAnalysis). Reescreva só o **JSX** de cada stage.

Estratégia recomendada: substituir o JSX inline no arquivo único. Se ficar grande, extrair em sub-componentes locais (`<CaptureView>`, `<AnalyzingView>`, `<ResultsView>`) no mesmo arquivo.

---

## Background (aplica nos 3 stages)

```tsx
const HUE = 30; // warm orange = nutrição (consistente com dashboard tile)

<div
  className="relative min-h-screen pb-28"
  style={{
    background: `
      radial-gradient(ellipse 80% 50% at 50% 0%, oklch(.96 .03 ${HUE} / .45) 0%, transparent 60%),
      linear-gradient(180deg, oklch(.98 .005 ${HUE}) 0%, oklch(.95 .015 ${HUE}) 100%)
    `,
  }}
>
```

---

## Header (compartilhado)

Substitui o `<ArrowLeft + h1>` atual:

```tsx
{/* Floating back */}
<button
  onClick={() => router.back()}
  className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-white/65 backdrop-blur-md
             border-0 flex items-center justify-center cursor-pointer"
>
  <ChevronLeft className="w-4 h-4" />
</button>

<div className="px-5 pt-16 pb-1">
  <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
    Nutrição
  </p>
  <h1 className="mt-1 text-[30px] font-bold tracking-tight leading-[1.05]">
    {stage === 'results' ? 'Sua refeição' : 'Nova refeição'}
  </h1>
  <p className="mt-1 font-mono text-[11px] uppercase text-muted-foreground">
    {formatDateTime(dateTime)} {/* "DOM · 17 MAI · 13:24" */}
  </p>
</div>
```

---

## Tipo da refeição — auto-detectado, chip clicável

A page atual já chama `getMealTypeFromHour(new Date().getHours())` na init. Mantém isso. Substitui o `<button>` + picker textual atual por **um chip único** estilo Bento:

```tsx
<div className="px-5 pt-3.5">
  <button
    onClick={() => setShowTypePicker(!showTypePicker)}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 pl-2 rounded-full cursor-pointer
               border text-xs font-bold"
    style={{
      background: `oklch(.95 .04 ${HUE})`,
      borderColor: `oklch(.5 .14 ${HUE} / .2)`,
      color: `oklch(.32 .14 ${HUE})`,
    }}
  >
    <span className="text-base leading-none">{mealTypeEmoji(mealType)}</span>
    {mealTypeLabel(mealType)}
    <ChevronDown className="w-2.5 h-2.5" />
  </button>

  {showTypePicker && (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {MEAL_TYPES.map((mt) => (
        <button
          key={mt}
          onClick={() => { setMealType(mt); setShowTypePicker(false); }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                      ${mt === mealType ? 'bg-primary text-primary-foreground' : 'bg-white/70 hover:bg-white'}`}
        >
          {mealTypeEmoji(mt)} {mealTypeLabel(mt)}
        </button>
      ))}
    </div>
  )}
</div>
```

---

## Stage 1 — `capture`

### Hero de foto (substitui o `<Card>` com 4×3 grid)

Em vez de `<Card>` shadcn, **um único hero 4:3 grande com tratamento Bento**:

```tsx
{photos.length === 0 ? (
  // EMPTY STATE — large prompt
  <div className="px-3.5 pt-4">
    <div
      className="aspect-[4/3] rounded-[22px] relative overflow-hidden border-2 border-dashed
                 flex flex-col items-center justify-center cursor-pointer"
      style={{
        background: `linear-gradient(135deg, oklch(.95 .04 ${HUE}) 0%, oklch(.88 .08 ${HUE}) 100%)`,
        borderColor: `oklch(.5 .14 ${HUE} / .4)`,
      }}
      onClick={() => cameraInputRef.current?.click()}
    >
      {/* Decoration */}
      <div
        className="absolute -right-5 -top-5 w-36 h-36 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, oklch(.5 .14 ${HUE} / .12), transparent 70%)` }}
      />

      {/* Big circular icon */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-3 text-white"
        style={{
          background: `oklch(.5 .14 ${HUE})`,
          boxShadow: `0 8px 24px -8px oklch(.5 .14 ${HUE} / .5)`,
        }}
      >
        <Camera className="w-7 h-7" strokeWidth={1.7} />
      </div>
      <p className="m-0 text-base font-bold tracking-tight"
         style={{ color: `oklch(.2 .04 ${HUE})` }}>
        Tire uma foto
      </p>
      <p className="m-0 mt-1 text-xs text-center max-w-[220px]"
         style={{ color: `oklch(.42 .08 ${HUE})` }}>
        A Maya identifica os ingredientes e estima os macros automaticamente
      </p>
      <div className="flex gap-2 mt-4">
        <button
          onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
          className="px-3.5 py-2 rounded-xl bg-white/80 backdrop-blur-sm
                     text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
          style={{ color: `oklch(.32 .14 ${HUE})` }}
        >
          <Camera className="w-3.5 h-3.5" /> Câmera
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          className="px-3.5 py-2 rounded-xl bg-white/80 backdrop-blur-sm
                     text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
          style={{ color: `oklch(.32 .14 ${HUE})` }}
        >
          <ImageIcon className="w-3.5 h-3.5" /> Galeria
        </button>
      </div>
    </div>
  </div>
) : (
  // FILLED — show photos in grid (manter lógica atual mas com radius 22)
  <div className="px-3.5 pt-4">
    <div className="grid grid-cols-2 gap-2">
      {photos.map((p, i) => (
        <div key={i} className="relative aspect-[4/3] rounded-2xl overflow-hidden">
          <img src={p} alt={`Refeição ${i + 1}`} className="w-full h-full object-cover" />
          <button
            onClick={() => removePhoto(i)}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/55 text-white
                       flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      {photos.length < MAX_PHOTOS && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="aspect-[4/3] rounded-2xl border-2 border-dashed
                     flex flex-col items-center justify-center gap-1 text-muted-foreground"
          style={{ borderColor: `oklch(.5 .14 ${HUE} / .4)` }}
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px]">Adicionar</span>
        </button>
      )}
    </div>
    <p className="text-[11px] text-center text-muted-foreground mt-2">
      {photos.length} de {MAX_PHOTOS} fotos
    </p>
  </div>
)}
```

### "OU DESCREVA" divider

```tsx
<div className="px-6 pt-5 flex items-center gap-2.5">
  <span className="flex-1 h-px" style={{ background: 'oklch(.5 .12 160 / .15)' }} />
  <span className="text-[10px] font-bold tracking-[.16em] text-muted-foreground">
    OU DESCREVA
  </span>
  <span className="flex-1 h-px" style={{ background: 'oklch(.5 .12 160 / .15)' }} />
</div>
```

### Descrição inline (contenteditable, sem `<Textarea>`)

Mesma técnica do diário/check-in:

```tsx
<div className="px-6 pt-4.5">
  <div
    contentEditable
    suppressContentEditableWarning
    onInput={(e) => setDescription((e.target as HTMLElement).innerText)}
    data-placeholder="Ex: salada com frango grelhado, arroz integral e abacate…"
    className="outline-none text-base leading-[1.55] font-medium tracking-tight
               min-h-[60px] text-foreground
               empty:before:content-[attr(data-placeholder)] empty:before:text-foreground/35"
  >
    {description}
  </div>
</div>
```

**Remover** o `<input type="datetime-local">` da tela principal. Em vez de input visível, o usuário toca na data do header pra abrir um date picker se quiser mudar (similar ao Diário). Default = agora.

### Sticky save bar

Substitui os 2 botões `<Button>` empilhados:

```tsx
<div className="absolute bottom-0 inset-x-0 px-4 py-3 flex items-center gap-2.5"
     style={{
       background: `linear-gradient(180deg, transparent, oklch(.95 .015 ${HUE} / .85) 25%, oklch(.95 .015 ${HUE}))`,
     }}>
  <span className="flex-1 text-[11px] text-muted-foreground font-mono">
    {photos.length > 0 && `${photos.length} foto${photos.length > 1 ? 's' : ''}`}
    {photos.length > 0 && description.trim() && ' · '}
    {description.trim() && '1 descrição'}
    {!photos.length && !description.trim() && 'Adicione foto ou descrição'}
  </span>
  <Button
    onClick={handleSave}
    disabled={saving || (!photos.length && !description.trim())}
    className="h-12 px-[22px] rounded-2xl text-sm font-semibold gap-1.5"
    style={{
      background: `oklch(.5 .14 ${HUE})`,
      boxShadow: `0 4px 14px -4px oklch(.5 .14 ${HUE} / .5)`,
    }}
  >
    {photos.length > 0 ? 'Analisar' : 'Salvar'}
    <Sparkles className="w-3.5 h-3.5" />
  </Button>
</div>
```

**Disable do botão quando vazio** — não permite save de refeição sem foto NEM descrição.

---

## Stage 2 — `analyzing`

Substitui o spinner simples atual por um estado **elegante**:

```tsx
{stage === 'analyzing' && (
  <div className="px-6 pt-7">
    {/* Foto com blur warm overlay */}
    <div
      className="aspect-[4/3] rounded-[22px] overflow-hidden relative
                 flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, oklch(.88 .08 ${HUE}) 0%, oklch(.75 .15 ${HUE}) 100%)`,
      }}
    >
      {photos[0] && (
        <img
          src={photos[0]}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          style={{ filter: 'blur(8px) saturate(1.3)' }}
        />
      )}
      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, oklch(1 0 0 / .35) 50%, transparent 100%)',
          animation: 'shimmer 1.6s linear infinite',
        }}
      />
      {/* Maya pulsing */}
      <div className="relative text-center">
        <div className="w-14 h-14 rounded-full mx-auto mb-3 bg-white/90 backdrop-blur-md
                        flex items-center justify-center shadow-lg">
          <span className="w-7 h-7 rounded-full overflow-hidden border-2 border-white"
                style={{ animation: 'mealAnalyzePulse 2s ease-in-out infinite' }}>
            <Image src="/maya.png" alt="" width={28} height={28} className="object-cover" />
          </span>
        </div>
        <p className="m-0 text-sm font-semibold text-white tracking-tight"
           style={{ textShadow: '0 1px 4px oklch(.25 .02 160 / .35)' }}>
          Maya está olhando…
        </p>
      </div>
    </div>

    <p className="m-0 mt-5 text-[13px] text-center italic text-muted-foreground">
      Identificando ingredientes e estimando os macros
    </p>

    {/* Skeleton tiles dos macros que vão aparecer */}
    <div className="mt-6 grid grid-cols-4 gap-1.5">
      {[1,2,3,4].map(i => (
        <div
          key={i}
          className="aspect-square rounded-2xl"
          style={{
            background: 'linear-gradient(120deg, oklch(.93 .02 160), oklch(.96 .015 160), oklch(.93 .02 160))',
            backgroundSize: '200% 100%',
            animation: 'shimmerBg 1.6s linear infinite',
          }}
        />
      ))}
    </div>
  </div>
)}
```

**Animações** (adicionar em `globals.css` ou inline):

```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
@keyframes shimmerBg {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes mealAnalyzePulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(.95); opacity: .75; }
}
```

A page atual usa `setStage('analyzing')` ANTES de fazer o fetch e `setStage('results')` no callback. **Manter exato esse fluxo** — só muda o JSX.

---

## Stage 3 — `results`

Substitui os 3 `<Card>` empilhados (Itens / Macros / Classificação) por bento de 4 mini-tiles + chips inline + badge classificação.

### Foto compacta no topo

```tsx
<div className="px-3.5 pt-3.5">
  <div className="aspect-[4/3] rounded-[22px] overflow-hidden relative">
    <img src={photos[0]} alt="" className="w-full h-full object-cover" />
    <span
      className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold
                 tracking-[.08em] uppercase text-white inline-flex items-center gap-1"
      style={{ background: 'oklch(.45 .14 160)' }}
    >
      <Check className="w-2.5 h-2.5 stroke-[3]" /> Analisado
    </span>
  </div>
</div>
```

### Macros como 4 mini-tiles bento

Cada macro tem **hue próprio** pra criar identidade visual:

```tsx
<div className="px-3.5 pt-5">
  <p className="m-0 mb-2.5 ml-1.5 text-[10.5px] font-bold tracking-[.14em] uppercase"
     style={{ color: `oklch(.45 .14 ${HUE})` }}>
    Macros estimados
  </p>
  <div className="grid grid-cols-4 gap-1.5">
    <MacroTile label="Kcal" value={analysisMacros?.calorias_kcal ?? '—'} hue={30} />
    <MacroTile label="Carb" value={`${analysisMacros?.carboidratos_g ?? '—'}g`} hue={85} />
    <MacroTile label="Prot" value={`${analysisMacros?.proteinas_g ?? '—'}g`} hue={220} />
    <MacroTile label="Gord" value={`${analysisMacros?.gorduras_g ?? '—'}g`} hue={270} />
  </div>
</div>

function MacroTile({ label, value, hue }: { label: string; value: string | number; hue: number }) {
  return (
    <div
      className="rounded-2xl px-2 py-3 text-center border shadow-sm"
      style={{
        background: `linear-gradient(180deg, #fff, oklch(.97 .025 ${hue}))`,
        borderColor: `oklch(.5 .12 ${hue} / .15)`,
      }}
    >
      <p
        className="m-0 text-lg font-extrabold tracking-tight leading-none tabular-nums"
        style={{ color: `oklch(.32 .14 ${hue})` }}
      >
        {value}
      </p>
      <p
        className="m-0 mt-1 text-[9.5px] font-bold tracking-wider uppercase"
        style={{ color: `oklch(.5 .12 ${hue})` }}
      >
        {label}
      </p>
    </div>
  );
}
```

### Itens identificados — chips editáveis

```tsx
<div className="px-6 pt-6">
  <div className="flex items-baseline justify-between mb-2.5">
    <p className="m-0 text-[10.5px] font-bold tracking-[.14em] uppercase text-muted-foreground">
      Identificados
    </p>
    <span className="text-[11px] text-muted-foreground">
      {analysisItems.length} {analysisItems.length === 1 ? 'item' : 'itens'}
    </span>
  </div>
  <div className="flex flex-wrap gap-1.5">
    {analysisItems.map((item, idx) => (
      <span
        key={idx}
        className="inline-flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 rounded-full bg-white border
                   text-[12.5px] font-medium"
        style={{ borderColor: 'oklch(.5 .14 30 / .15)' }}
      >
        <input
          value={item.nome}
          onChange={(e) => updateItemName(idx, e.target.value)}
          className="bg-transparent border-none outline-none w-auto text-[12.5px]"
          style={{ minWidth: 60 }}
        />
        <button
          onClick={() => removeItem(idx)}
          className="w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: 'oklch(.5 .12 160 / .1)' }}
        >
          <X className="w-[9px] h-[9px] text-muted-foreground" />
        </button>
      </span>
    ))}
    {/* Add chip */}
    {addingItem ? (
      <input
        autoFocus
        value={newItemName}
        onChange={(e) => setNewItemName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { addItem(); setAddingItem(false); }
          if (e.key === 'Escape') setAddingItem(false);
        }}
        onBlur={() => { if (newItemName.trim()) addItem(); setAddingItem(false); }}
        placeholder="novo item"
        className="px-3 py-1.5 rounded-full bg-white border outline-none text-[12.5px]"
        style={{ borderColor: 'oklch(.5 .14 30 / .35)' }}
      />
    ) : (
      <button
        onClick={() => setAddingItem(true)}
        className="px-2.5 py-1.5 rounded-full border-[1.5px] border-dashed cursor-pointer
                   inline-flex items-center gap-1 text-xs font-semibold"
        style={{ borderColor: 'oklch(.5 .14 30 / .35)', color: 'oklch(.42 .14 30)' }}
      >
        <Plus className="w-2.5 h-2.5" /> Adicionar
      </button>
    )}
  </div>
</div>
```

### Classificação — badge identitário

Substitui o `<Badge>` shadcn simples por um bloco mais visual:

```tsx
{analysisClass && (
  <div className="px-6 pt-5.5">
    <p className="m-0 mb-2 text-[10.5px] font-bold tracking-[.14em] uppercase text-muted-foreground">
      Classificação
    </p>
    <ClassificationBadge type={analysisClass} />
    <ClassificationDescription type={analysisClass} />
  </div>
)}

function ClassificationBadge({ type }: { type: MealClassification }) {
  // Mapping cor + emoji + label
  const MAP: Record<string, { hue: number; emoji: string; label: string }> = {
    equilibrada:     { hue: 145, emoji: '✓', label: 'Equilibrada' },
    rica_em_proteina:{ hue: 220, emoji: '💪', label: 'Rica em proteína' },
    rica_em_carbo:   { hue: 85,  emoji: '🌾', label: 'Rica em carboidrato' },
    leve:            { hue: 180, emoji: '🍃', label: 'Leve' },
    pesada:          { hue: 30,  emoji: '🔥', label: 'Pesada' },
    ultraprocessada: { hue: 15,  emoji: '⚠️', label: 'Ultraprocessada' },
    nao_identificada:{ hue: 200, emoji: '❓', label: 'Não identificada' },
  };
  const c = MAP[type] ?? MAP.nao_identificada;
  return (
    <div
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border"
      style={{
        background: `oklch(.93 .08 ${c.hue})`,
        borderColor: `oklch(.45 .14 ${c.hue} / .25)`,
      }}
    >
      <span className="text-sm">{c.emoji}</span>
      <span className="text-[13px] font-semibold" style={{ color: `oklch(.32 .14 ${c.hue})` }}>
        {c.label}
      </span>
    </div>
  );
}
```

`<ClassificationDescription>` mostra a `analysisObs` em itálico abaixo do badge.

### Sticky save bar (dual button)

```tsx
<div className="absolute bottom-0 inset-x-0 px-4 py-3 flex items-center gap-2"
     style={{
       background: `linear-gradient(180deg, transparent, oklch(.95 .015 ${HUE} / .85) 25%, oklch(.95 .015 ${HUE}))`,
     }}>
  <button
    onClick={skipAnalysis}
    className="h-11 px-3.5 rounded-xl bg-transparent border text-xs font-semibold text-muted-foreground"
    style={{ borderColor: 'oklch(.5 .12 160 / .2)' }}
  >
    Salvar sem análise
  </button>
  <Button
    onClick={confirmAnalysis}
    disabled={saving}
    className="flex-1 h-[46px] rounded-2xl text-sm font-semibold gap-1.5"
    style={{
      background: `oklch(.5 .14 ${HUE})`,
      boxShadow: `0 4px 14px -4px oklch(.5 .14 ${HUE} / .5)`,
    }}
  >
    {saving ? 'Salvando...' : 'Confirmar e salvar'}
    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
  </Button>
</div>
```

---

## Tokens & spacing

| Item | Valor |
|---|---|
| HUE base nutrição | `30` (warm orange) — consistente com dashboard tile |
| Page padding lateral (cards/photo) | `px-3.5` |
| Page padding lateral (inline blocks) | `px-5` a `px-6` |
| Hero radius | `rounded-[22px]` |
| Mini-tile radius | `rounded-2xl` (16px) |
| Chip radius | `rounded-full` |
| Eyebrow | `text-[10.5px] font-bold tracking-[.14em] uppercase` |
| Title hero | `text-[30px] font-bold tracking-tight` |
| Macro number | `text-lg font-extrabold tabular-nums` (18px) |
| Primary CTA shadow | `0 4px 14px -4px oklch(.5 .14 30 / .5)` |

### Macro hues (cada um próprio pra criar identidade)

| Macro | Hue | Cor |
|---|---|---|
| Calorias | 30 | warm orange |
| Carboidratos | 85 | amber/yellow |
| Proteínas | 220 | blue |
| Gorduras | 270 | purple |

---

## Implementation order

1. **Wrapper + background gradient** + helpers de header
2. **Stage capture**: hero photo + "OU DESCREVA" + descrição contenteditable + sticky bar
3. **Tipo chip** auto-detected
4. **Stage analyzing**: foto blur + Maya pulsing + skeleton tiles (animations)
5. **Stage results**: foto + 4 macro tiles + chips itens + classification badge + dual sticky bar
6. **Remover** o `<input type="datetime-local">` da capture (data inferida pelo header, ajusta via tap se necessário)

---

## Testes manuais

- [ ] Captura: emp state mostra hero grande; com fotos mostra grid + add slot
- [ ] Captura: tipo refeição abre/fecha picker; clique seleciona
- [ ] Captura: botão "Analisar"/"Salvar" disabled quando nenhuma foto E nenhuma descrição
- [ ] Analyzing: shimmer roda sem trava; Maya pulsa; skeleton tiles aparecem
- [ ] Analyzing → Results: transição é instantânea quando API retorna
- [ ] Results: 4 macro tiles refletem `analysisMacros` (kcal/carb/prot/gord)
- [ ] Results: chips de itens são editáveis inline; X remove; "+ Adicionar" abre input
- [ ] Results: classification badge mostra cor/emoji corretos pelo tipo
- [ ] Results: "Salvar sem análise" navega pra `/nutricao` sem persistir alterações
- [ ] Results: "Confirmar e salvar" chama `confirmAnalysis()` (mantém)
- [ ] Análise falha: classification = `nao_identificada`, toast de erro, ainda permite editar
- [ ] Sem foto, só descrição: pula direto pra results com macros estimados pelo texto
- [ ] Dark mode não desenhado — combinar antes

---

## Caveats

- **Dark mode** não foi desenhado.
- **`contentEditable`** na descrição (mesma técnica do diário/check-in) — cuidar de paste cleanup, Enter behavior, a11y (`role="textbox"`, `aria-multiline`).
- **Animações de analyzing** — shimmer + pulse podem ficar pesadas em devices baixos. Se necessário, simplificar pra só skeleton estático com fade.
- **Data inferida do header** — diferente da page atual que mostra `<input type="datetime-local">` sempre visível. Se quiser manter input visível, adicionar abaixo do tipo chip como `<DateChip>` similar.
- **`MacroTile` com hues coloridos** — fica colorido e divertido. Se ficar visualmente demais, mudar todos pra hue 30 (warm) e diferenciar só pelo label.

---

## Files in `references/`

| Arquivo | O que é |
|---|---|
| `Refeicao Explorations.html` | Canvas com 3 artboards (capture / analyzing / results) |
| `RefeicaoRegistro.jsx` | Implementação JSX completa dos 3 stages — referência visual |
| `Maya.png` | Avatar da Maya — copiar pra `public/maya.png` se ainda não estiver lá |
