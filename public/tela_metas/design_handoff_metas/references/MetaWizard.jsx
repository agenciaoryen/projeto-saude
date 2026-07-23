// MetaWizard.jsx — Bento step-by-step wizard for new goal
// Shows step 1 (area) as primary artboard

function MetaWizard({ initialStep = 0 }) {
  const [step, setStep] = React.useState(initialStep);
  const [area, setArea] = React.useState('saude');

  const AREAS = [
    { v: 'saude',           label: 'Saúde',          emoji: '💚', hue: 160, desc: 'Corpo, mente, sono' },
    { v: 'carreira',        label: 'Carreira',       emoji: '💼', hue: 220, desc: 'Trabalho, propósito' },
    { v: 'financas',        label: 'Finanças',       emoji: '💰', hue: 85,  desc: 'Dinheiro, abundância' },
    { v: 'relacionamentos', label: 'Relacionamentos',emoji: '❤️', hue: 15,  desc: 'Amor, amizades' },
    { v: 'desenvolvimento', label: 'Desenvolvimento',emoji: '🧠', hue: 270, desc: 'Aprendizado' },
    { v: 'familia',         label: 'Família',        emoji: '🏡', hue: 40,  desc: 'Vínculos, legado' },
    { v: 'lazer',           label: 'Lazer',          emoji: '🌊', hue: 185, desc: 'Hobbies, aventura' },
    { v: 'espiritualidade', label: 'Espiritualidade',emoji: '✨', hue: 300, desc: 'Fé, transcendência' },
  ];

  const STEP_LABELS = ['Área', 'Definir', 'Etapa', 'Guardião', 'Pacto'];
  const HUE = AREAS.find(a => a.v === area)?.hue ?? 160;

  return (
    <div style={{
      width: '100%', height: '100%', overflowY: 'auto',
      fontFamily: 'var(--font-sans)', color: 'var(--foreground)',
      background: `
        radial-gradient(ellipse 80% 50% at 50% 0%, oklch(.96 .03 ${HUE} / .45) 0%, transparent 60%),
        linear-gradient(180deg, oklch(.97 .005 160) 0%, oklch(.94 .02 160) 100%)
      `,
      position: 'relative', paddingBottom: 110,
      transition: 'background .5s ease',
    }}>
      {/* Close */}
      <button style={{
        position: 'absolute', top: 14, left: 16, zIndex: 10,
        width: 36, height: 36, borderRadius: 9999, border: 0, cursor: 'pointer',
        background: 'oklch(1 0 0 / .65)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      </button>

      {/* Progress dots */}
      <div style={{
        position: 'absolute', top: 22, left: 64, right: 64, zIndex: 9,
        display: 'flex', gap: 4, alignItems: 'center',
      }}>
        {STEP_LABELS.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 9999,
            background: i <= step ? `oklch(.45 .14 ${HUE})` : `oklch(.5 .12 ${HUE} / .15)`,
            transition: 'background .3s ease',
          }} />
        ))}
      </div>

      <p style={{
        position: 'absolute', top: 56, left: 0, right: 0, textAlign: 'center', zIndex: 9,
        margin: 0, fontFamily: 'var(--font-mono, ui-monospace)', fontSize: 10,
        color: 'var(--muted-foreground)', letterSpacing: '.16em', textTransform: 'uppercase',
      }}>
        Nova meta · passo {String(step + 1).padStart(2, '0')} de 05
      </p>

      {/* Step content */}
      <div style={{ padding: '100px 24px 0' }}>
        {step === 0 && (
          <>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.1, textWrap: 'balance' }}>
              Que área da sua vida?
            </h1>
            <p style={{ margin: '8px 0 24px', fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
              Toda meta vive em uma área. Escolha a principal.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
              {AREAS.map((a) => {
                const sel = area === a.v;
                return (
                  <button key={a.v}
                    onClick={() => setArea(a.v)}
                    style={{
                      textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                      padding: '14px 12px 12px', borderRadius: 16, position: 'relative',
                      background: sel
                        ? `linear-gradient(135deg, oklch(.96 .04 ${a.hue}) 0%, oklch(.92 .07 ${a.hue}) 100%)`
                        : 'oklch(1 0 0 / .55)',
                      border: sel
                        ? `2px solid oklch(.45 .14 ${a.hue})`
                        : '2px solid oklch(.5 .12 160 / .1)',
                      transition: 'all .2s ease',
                    }}>
                    <span style={{ fontSize: 22, display: 'block', marginBottom: 6 }}>{a.emoji}</span>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: '-0.005em', color: sel ? `oklch(.2 .04 ${a.hue})` : 'var(--foreground)' }}>
                      {a.label}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 10.5, color: sel ? `oklch(.4 .08 ${a.hue})` : 'var(--muted-foreground)' }}>
                      {a.desc}
                    </p>
                    {sel && (
                      <span style={{
                        position: 'absolute', top: 10, right: 10,
                        width: 18, height: 18, borderRadius: 9999, background: `oklch(.45 .14 ${a.hue})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m5 12 5 5 9-10"/>
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'absolute', bottom: 28, left: 24, right: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <button style={{
          background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 13, color: 'var(--muted-foreground)',
        }}>
          {step > 0 ? '← Voltar' : ''}
        </button>
        <button style={{
          height: 48, padding: '0 22px', borderRadius: 14,
          background: `oklch(.45 .14 ${HUE})`, color: '#fff', border: 0, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          boxShadow: `0 4px 14px -4px oklch(.45 .14 ${HUE} / .5)`,
        }}>
          Continuar
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { MetaWizard });
