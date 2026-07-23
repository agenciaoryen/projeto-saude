// MetasListaEditorial.jsx — Variant B: editorial "livro de metas"

function MetasListaEditorial() {
  return (
    <div style={{
      width: '100%', height: '100%', overflowY: 'auto',
      fontFamily: 'var(--font-sans)', color: 'var(--foreground)',
      background: `
        radial-gradient(ellipse 70% 40% at 50% 0%, oklch(.96 .03 70 / .45) 0%, transparent 60%),
        linear-gradient(180deg, oklch(.99 .005 80) 0%, oklch(.96 .015 80) 100%)
      `,
      position: 'relative', paddingBottom: 110,
    }}>

      {/* Editorial header */}
      <div style={{ padding: '24px 24px 8px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontFamily: 'var(--font-mono, ui-monospace)', fontSize: 10, color: 'var(--muted-foreground)', letterSpacing: '.16em', textTransform: 'uppercase' }}>
          Volume I · MMXXVI
        </p>
        <h1 style={{
          margin: '6px 0 0', fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05,
          fontStyle: 'italic',
        }}>
          O livro das metas
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--muted-foreground)' }}>
          3 ativas · 1 pausada
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
          <span style={{ width: 44, height: 1, background: 'oklch(.55 .08 80 / .35)' }} />
        </div>
      </div>

      {/* Meta-spread #1 — current focus */}
      <MetaSpread
        order="I"
        area="carreira" hue={220} emoji="💼" areaLabel="Carreira"
        title="Publicar meu livro até dezembro"
        why="Pela Sofia. Pra ela me ver inteira quando crescer."
        progress={62}
        currentStage="Revisando capítulos 4 e 5"
        daysLeft={28}
        nextAction="Cap. 5 — revisão completa"
        primary
      />

      {/* Meta-spread #2 */}
      <MetaSpread
        order="II"
        area="saude" hue={160} emoji="💚" areaLabel="Saúde"
        title="Voltar a correr 3x por semana"
        why="Pra reaver a energia que eu tinha aos 25."
        progress={40}
        currentStage="Comprando o equipamento"
        nextAction="Tênis novo"
      />

      {/* Meta-spread #3 */}
      <MetaSpread
        order="III"
        area="desenvolvimento" hue={270} emoji="🧠" areaLabel="Desenvolvimento"
        title="Aprender espanhol fluente"
        why="Pra ler Borges no original."
        progress={15}
        currentStage="Primeiras aulas"
        nextAction="Aula 4 do app"
      />

      {/* Paused — esmaecida */}
      <MetaSpread
        order="IV"
        area="financas" hue={85} emoji="💰" areaLabel="Finanças"
        title="Reserva de emergência (6 meses)"
        progress={35}
        currentStage="Pausada há 23 dias"
        paused
      />

      {/* Footer rule */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0 0' }}>
        <span style={{ width: 44, height: 1, background: 'oklch(.55 .08 80 / .35)' }} />
      </div>
      <p style={{ margin: '14px 24px', fontSize: 11, fontStyle: 'italic', color: 'var(--muted-foreground)', textAlign: 'center', textWrap: 'pretty' }}>
        Toque numa meta para abrir o capítulo completo.
      </p>
    </div>
  );
}

function MetaSpread({ order, area, hue, emoji, areaLabel, title, why, progress, currentStage, daysLeft, nextAction, primary, paused }) {
  return (
    <div style={{
      padding: '24px 24px 22px',
      borderTop: '1px solid oklch(.55 .08 80 / .25)',
      opacity: paused ? .55 : 1,
      cursor: 'pointer',
    }}>
      {/* Header: order numeral + area chip */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{
          fontFamily: 'var(--font-mono, ui-monospace)', fontSize: 32, fontWeight: 800,
          letterSpacing: '-0.04em', lineHeight: .85, color: `oklch(.5 .14 ${hue})`,
          opacity: primary ? 1 : .55,
        }}>{order}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase',
          color: `oklch(.4 .12 ${hue})`,
        }}>
          {emoji} {areaLabel}
        </span>
      </div>

      {/* Title */}
      <h2 style={{
        margin: '8px 0 0', fontSize: primary ? 22 : 18,
        fontWeight: primary ? 700 : 600, letterSpacing: '-0.02em',
        lineHeight: 1.2, color: 'var(--foreground)', textWrap: 'pretty',
      }}>{title}</h2>

      {/* Why */}
      {why && (
        <p style={{
          margin: '8px 0 0', fontSize: primary ? 14 : 13, lineHeight: 1.45,
          color: 'var(--muted-foreground)', fontStyle: 'italic', textWrap: 'pretty',
        }}>
          "{why}"
        </p>
      )}

      {/* Progress section: number + line */}
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '60px 1fr', gap: 14, alignItems: 'center' }}>
        <div>
          <span style={{
            fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em',
            color: `oklch(.4 .14 ${hue})`, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          }}>
            {progress}<span style={{ fontSize: 14, opacity: .6 }}>%</span>
          </span>
        </div>
        <div>
          <div style={{
            height: 3, borderRadius: 9999,
            background: `oklch(.5 .12 ${hue} / .15)`, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: `linear-gradient(90deg, oklch(.45 .14 ${hue}), oklch(.55 .14 ${hue}))`,
              borderRadius: 9999,
            }} />
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--muted-foreground)', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontStyle: 'italic' }}>{currentStage}</span>
            {daysLeft && <span style={{ color: 'oklch(.42 .14 50)', fontWeight: 600 }}>{daysLeft}d restantes</span>}
          </div>
        </div>
      </div>

      {/* Next action — like a chapter teaser */}
      {nextAction && !paused && (
        <p style={{
          margin: '14px 0 0', fontSize: 12, color: 'var(--foreground)',
          paddingLeft: 12, borderLeft: `2px solid oklch(.5 .14 ${hue} / .5)`,
        }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: `oklch(.5 .12 ${hue})`, display: 'block', marginBottom: 2 }}>
            Próximo passo
          </span>
          {nextAction}
        </p>
      )}
    </div>
  );
}

Object.assign(window, { MetasListaEditorial });
