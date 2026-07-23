// MayaCoachEditorial.jsx — Editorial coach chat

function MayaCoachEditorial() {
  const STARTERS = [
    'Como estão minhas metas?',
    'O que devo priorizar esta semana?',
    'Estou travada em uma meta',
    'Faz um resumo do meu progresso',
  ];
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-sans)',
      background: `
        radial-gradient(ellipse 70% 40% at 50% 0%, oklch(.96 .03 70 / .45) 0%, transparent 60%),
        linear-gradient(180deg, oklch(.99 .005 80) 0%, oklch(.96 .015 80) 100%)
      `,
      position: 'relative',
    }}>
      {/* Header: cream, intimate */}
      <div style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0, borderBottom: '1px solid oklch(.55 .08 80 / .15)',
        background: 'oklch(.99 .005 80 / .7)', backdropFilter: 'blur(8px)',
      }}>
        <button style={{
          width: 34, height: 34, borderRadius: 9999, border: 0, cursor: 'pointer',
          background: 'oklch(1 0 0 / .7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <div style={{ position: 'relative', flex: 'none' }}>
          <span style={{ position: 'absolute', inset: -3, borderRadius: 9999, background: 'oklch(.78 .14 160 / .12)' }} />
          <span style={{
            width: 38, height: 38, borderRadius: 9999, overflow: 'hidden',
            border: '2px solid #fff', position: 'relative', display: 'block',
          }}>
            <img src="assets/Maya.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </span>
          <span style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 10, height: 10, borderRadius: 9999, background: '#22c55e',
            border: '2px solid #fff',
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.005em' }}>
            Maya
          </p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
            sua coach de metas · presente
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 22px 12px' }}>
        {/* Empty state — editorial */}
        <div style={{ textAlign: 'center', padding: '20px 0 28px' }}>
          <p style={{
            margin: '0 0 4px', fontFamily: 'var(--font-mono, ui-monospace)', fontSize: 10,
            color: 'var(--muted-foreground)', letterSpacing: '.16em', textTransform: 'uppercase',
          }}>
            Uma conversa
          </p>
          <h2 style={{
            margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em',
            fontStyle: 'italic', color: 'var(--foreground)',
          }}>
            Como posso ajudar?
          </h2>
          <p style={{ margin: '8px 32px 0', fontSize: 12.5, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
            Eu vejo suas metas, seu diário e seus check-ins. Pode me perguntar qualquer coisa.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '22px 0' }}>
            <span style={{ width: 44, height: 1, background: 'oklch(.55 .08 80 / .35)' }} />
          </div>

          {/* Starters as editorial menu */}
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted-foreground)', textAlign: 'center' }}>
              Talvez você queira começar com
            </p>
            {STARTERS.map((p, i) => (
              <button key={i} style={{
                width: '100%', padding: '14px 4px', cursor: 'pointer', fontFamily: 'inherit',
                background: 'transparent', textAlign: 'left',
                borderTop: '1px solid oklch(.55 .08 80 / .2)',
                borderLeft: 0, borderRight: 0, borderBottom: i === STARTERS.length - 1 ? '1px solid oklch(.55 .08 80 / .2)' : 0,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                color: 'var(--foreground)', fontSize: 14, fontWeight: 500, fontStyle: 'italic',
              }}>
                "{p}"
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="1.7" strokeLinecap="round"
                     style={{ color: 'var(--muted-foreground)' }}>
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Sample conversation below empty state for demo */}
        <div style={{ marginTop: 16 }}>
          {/* User msg */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px',
              background: 'oklch(.45 .14 160)', color: '#fff',
              borderRadius: '16px 16px 4px 16px',
              fontSize: 14, lineHeight: 1.5,
            }}>
              Estou travada na meta do livro
            </div>
          </div>
          {/* Maya msg — no card, just text with avatar */}
          <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 10, marginBottom: 14 }}>
            <span style={{
              width: 26, height: 26, borderRadius: 9999, overflow: 'hidden',
              border: '1px solid #fff',
            }}>
              <img src="assets/Maya.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </span>
            <div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--foreground)' }}>
                Vi seu progresso. Você está em <strong>62%</strong> — passou o ponto mais difícil. O que está te segurando agora?
              </p>
              <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.55, color: 'var(--foreground)', fontStyle: 'italic' }}>
                É o medo de terminar, ou o cansaço da revisão?
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px calc(env(safe-area-inset-bottom) + 12px)',
        background: 'oklch(.99 .005 80 / .85)', backdropFilter: 'blur(8px)',
        borderTop: '1px solid oklch(.55 .08 80 / .2)',
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <div style={{
          flex: 1, borderRadius: 22, border: '1px solid oklch(.55 .08 80 / .25)',
          background: '#fff', padding: '10px 16px',
        }}>
          <input placeholder="Escreva para Maya…" style={{
            width: '100%', border: 'none', background: 'transparent', outline: 'none',
            fontFamily: 'inherit', fontSize: 14, color: 'var(--foreground)',
          }} />
        </div>
        <button style={{
          width: 44, height: 44, borderRadius: 9999, border: 0, flex: 'none',
          background: 'oklch(.45 .14 160)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px -4px oklch(.45 .14 160 / .45)',
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { MayaCoachEditorial });
