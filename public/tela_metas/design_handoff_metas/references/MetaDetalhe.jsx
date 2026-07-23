// MetaDetalhe.jsx — Variant A: Bento detail with vertical roadmap

function MetaDetalhe() {
  return (
    <div style={{
      width: '100%', height: '100%', overflowY: 'auto',
      fontFamily: 'var(--font-sans)', color: 'var(--foreground)',
      background: `
        radial-gradient(ellipse 80% 50% at 20% 0%, oklch(.95 .04 80 / .35) 0%, transparent 50%),
        linear-gradient(180deg, oklch(.97 .005 160) 0%, oklch(.94 .02 160) 100%)
      `,
      position: 'relative', paddingBottom: 110,
    }}>
      {/* Floating back */}
      <button style={{
        position: 'absolute', top: 14, left: 16, zIndex: 10,
        width: 36, height: 36, borderRadius: 9999, border: 0, cursor: 'pointer',
        background: 'oklch(1 0 0 / .65)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 1px 3px oklch(.25 .02 160 / .08)',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
      <button style={{
        position: 'absolute', top: 14, right: 16, zIndex: 10,
        width: 36, height: 36, borderRadius: 9999, border: 0, cursor: 'pointer',
        background: 'oklch(1 0 0 / .65)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
        </svg>
      </button>

      {/* HERO — area-specific tile */}
      <div style={{ padding: '64px 14px 0' }}>
        <div style={{
          borderRadius: 22, padding: '20px 22px',
          background: `linear-gradient(135deg, oklch(.95 .04 220) 0%, oklch(.88 .08 220) 100%)`,
          border: '1px solid oklch(.5 .12 220 / .2)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative shape */}
          <div style={{
            position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: 9999,
            background: 'radial-gradient(circle, oklch(.5 .12 220 / .15), transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <span style={{
                padding: '3px 9px', borderRadius: 9999, fontSize: 10, fontWeight: 700,
                letterSpacing: '.08em', textTransform: 'uppercase',
                background: 'oklch(.5 .12 220 / .15)', color: 'oklch(.32 .12 220)',
              }}>
                💼 Carreira · Destino
              </span>
            </div>

            <h1 style={{
              margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em',
              lineHeight: 1.2, color: 'oklch(.18 .04 220)',
            }}>
              Publicar meu livro até dezembro
            </h1>

            <p style={{
              margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.45,
              color: 'oklch(.35 .06 220)', fontStyle: 'italic',
              textWrap: 'pretty',
            }}>
              "Pela Sofia. Pra ela me ver inteira quando crescer."
            </p>

            {/* Big progress */}
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', color: 'oklch(.32 .14 220)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  62
                </span>
                <span style={{ fontSize: 18, color: 'oklch(.45 .1 220)', fontWeight: 500 }}>%</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'oklch(.4 .08 220)', fontVariantNumeric: 'tabular-nums' }}>
                  5/8 etapas · 28d
                </span>
              </div>
              <div style={{
                marginTop: 6, height: 6, borderRadius: 9999,
                background: 'oklch(.5 .12 220 / .2)', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', width: '62%', borderRadius: 9999,
                  background: 'linear-gradient(90deg, oklch(.4 .14 220), oklch(.5 .16 220))',
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMPROMETIMENTO — only if filled, compact row of pills */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6,
        }}>
          <CommitChip
            type="guardian"
            label="João Silva"
            sub="Guardião"
          />
          <CommitChip
            type="reward"
            label="Viagem pra Lisboa"
            sub="Recompensa"
          />
          <CommitChip
            type="punishment"
            label="Doar R$ 500"
            sub="Punição"
          />
        </div>
      </div>

      {/* ROADMAP — vertical timeline */}
      <div style={{ padding: '28px 24px 0', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'oklch(.45 .12 220)' }}>
            Mapa da meta
          </p>
          <button style={{
            background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 11, fontWeight: 600, color: 'oklch(.45 .12 220)',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            + Adicionar etapa
          </button>
        </div>

        <Stage num={1} status="done"     title="Definir tema e estrutura" actions={[{done:true, txt:'Brainstorm de ideias'}, {done:true, txt:'Definir gênero'}]} />
        <Stage num={2} status="done"     title="Escrever os primeiros capítulos" actions={[{done:true, txt:'Capítulos 1-3'}]} />
        <Stage num={3} status="done"     title="Revisar capítulos 1-3" actions={[{done:true, txt:'Beta reader feedback'}]} />
        <Stage num={4} status="current"  title="Revisar capítulos 4 e 5" actions={[
          { done:true,  txt:'Cap. 4 — primeira leitura' },
          { done:false, txt:'Cap. 4 — segunda leitura', ifThen:'estiver cansada à noite, então leio só 1 capítulo' },
          { done:false, txt:'Cap. 5 — revisão completa' },
        ]} />
        <Stage num={5} status="todo"     title="Capítulos finais (6-8)" />
        <Stage num={6} status="todo"     title="Capa e diagramação" />
        <Stage num={7} status="todo"     title="Editor profissional" />
        <Stage num={8} status="todo"     title="Lançamento" isLast />
      </div>

      {/* Maya pill no fim */}
      <div style={{ padding: '20px 24px 0' }}>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'oklch(1 0 0 / .6)', backdropFilter: 'blur(8px)',
          border: '1px solid oklch(.5 .12 220 / .2)', borderRadius: 9999,
          padding: '8px 14px 8px 8px', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 12.5, fontWeight: 500, color: 'var(--foreground)',
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: 9999, overflow: 'hidden', flex: 'none',
            border: '1px solid #fff',
          }}>
            <img src="assets/Maya.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </span>
          Conversar sobre essa meta com Maya
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
               style={{ color: 'var(--muted-foreground)' }}>
            <path d="M5 12h14M13 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function CommitChip({ type, label, sub }) {
  const COLORS = {
    guardian:   { bg: 'oklch(.93 .05 160)', fg: 'oklch(.35 .12 160)', icon: '🛡️' },
    reward:     { bg: 'oklch(.94 .08 85)',  fg: 'oklch(.42 .14 85)',  icon: '🏆' },
    punishment: { bg: 'oklch(.94 .06 15)',  fg: 'oklch(.42 .14 15)',  icon: '⚠️' },
  }[type];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '7px 12px 7px 10px', borderRadius: 12,
      background: COLORS.bg, border: `1px solid ${COLORS.fg.replace(')', ' / .2)')}`,
    }}>
      <span style={{ fontSize: 13 }}>{COLORS.icon}</span>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: COLORS.fg, opacity: .7 }}>
          {sub}
        </p>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: COLORS.fg }}>
          {label}
        </p>
      </div>
    </div>
  );
}

function Stage({ num, status, title, actions, isLast }) {
  const isDone = status === 'done';
  const isCurrent = status === 'current';
  const HUE = 220;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '30px 1fr', gap: 12,
      position: 'relative', minHeight: isCurrent ? 'auto' : 50,
    }}>
      {/* Connector + node */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        {!isLast && (
          <span style={{
            position: 'absolute', top: 30, bottom: -16, left: '50%', width: 2,
            transform: 'translateX(-50%)',
            background: isDone ? `oklch(.5 .14 ${HUE})` : `oklch(.5 .12 ${HUE} / .2)`,
          }} />
        )}
        <span style={{
          width: 30, height: 30, borderRadius: 9999, flex: 'none', zIndex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, fontFamily: 'var(--font-mono, ui-monospace)',
          background: isDone ? `oklch(.5 .14 ${HUE})` : isCurrent ? '#fff' : `oklch(.5 .12 ${HUE} / .1)`,
          border: isCurrent ? `2.5px solid oklch(.5 .14 ${HUE})` : 'none',
          color: isDone ? '#fff' : isCurrent ? `oklch(.4 .14 ${HUE})` : `oklch(.5 .1 ${HUE} / .6)`,
          boxShadow: isCurrent ? `0 0 0 5px oklch(.5 .14 ${HUE} / .15)` : 'none',
        }}>
          {isDone ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12 5 5 9-10"/>
            </svg>
          ) : num}
        </span>
      </div>

      {/* Stage content */}
      <div style={{ paddingBottom: isLast ? 0 : 22, minWidth: 0 }}>
        <p style={{
          margin: '4px 0 0', fontSize: isCurrent ? 15 : 13.5,
          fontWeight: isCurrent ? 700 : 500, letterSpacing: '-0.005em',
          color: isDone ? 'var(--muted-foreground)' : isCurrent ? `oklch(.2 .04 ${HUE})` : 'var(--foreground)',
          textDecoration: isDone ? 'line-through' : 'none',
          lineHeight: 1.3,
        }}>
          {title}
        </p>

        {/* Actions for current stage */}
        {isCurrent && actions && (
          <div style={{
            marginTop: 12,
            padding: 14, borderRadius: 14,
            background: '#fff', border: `1px solid oklch(.5 .12 ${HUE} / .15)`,
            boxShadow: `0 4px 14px -6px oklch(.5 .12 ${HUE} / .2)`,
          }}>
            {actions.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 9,
                padding: '6px 0',
                borderTop: i > 0 ? '1px solid oklch(.5 .12 160 / .08)' : 'none',
              }}>
                <button style={{
                  width: 18, height: 18, borderRadius: 6, flex: 'none', marginTop: 1,
                  background: a.done ? `oklch(.5 .14 ${HUE})` : 'transparent',
                  border: a.done ? 'none' : `1.5px solid oklch(.5 .14 ${HUE} / .4)`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {a.done && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5 9-10"/>
                    </svg>
                  )}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0, fontSize: 13, lineHeight: 1.3,
                    color: a.done ? 'var(--muted-foreground)' : 'var(--foreground)',
                    textDecoration: a.done ? 'line-through' : 'none',
                    fontWeight: 500,
                  }}>{a.txt}</p>
                  {a.ifThen && (
                    <div style={{
                      marginTop: 5, padding: '4px 8px', borderRadius: 6,
                      background: 'oklch(.95 .04 270)', border: '1px solid oklch(.6 .12 270 / .2)',
                      display: 'inline-flex', flexWrap: 'wrap', gap: 4, alignItems: 'center',
                    }}>
                      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.08em', color: 'oklch(.4 .14 270)' }}>SE</span>
                      <span style={{ fontSize: 11, color: 'oklch(.3 .08 270)', lineHeight: 1.3 }}>{a.ifThen}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <button style={{
              marginTop: 10, padding: '7px 10px', borderRadius: 8,
              background: 'transparent', border: `1.5px dashed oklch(.5 .14 ${HUE} / .35)`,
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 600,
              color: `oklch(.4 .14 ${HUE})`,
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Adicionar ação
            </button>
          </div>
        )}

        {/* Action count for done stages */}
        {isDone && actions && (
          <p style={{ margin: '2px 0 0', fontSize: 10.5, color: 'var(--muted-foreground)' }}>
            {actions.filter(a => a.done).length}/{actions.length} ações ✓
          </p>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { MetaDetalhe });
