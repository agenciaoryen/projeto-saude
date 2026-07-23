// RefeicaoRegistro.jsx — Bento, foto-first, 1 direção sólida
// Mostra 3 estados: capture, analyzing, results

function RefeicaoRegistroCapture() {
  return <RefeicaoRegistro stage="capture" />;
}
function RefeicaoRegistroAnalyzing() {
  return <RefeicaoRegistro stage="analyzing" />;
}
function RefeicaoRegistroResults() {
  return <RefeicaoRegistro stage="results" />;
}

function RefeicaoRegistro({ stage = 'capture' }) {
  const HUE = 30; // warm orange — nutrição
  return (
    <div style={{
      width: '100%', height: '100%', overflowY: 'auto',
      fontFamily: 'var(--font-sans)', color: 'var(--foreground)',
      background: `
        radial-gradient(ellipse 80% 50% at 50% 0%, oklch(.96 .03 ${HUE} / .45) 0%, transparent 60%),
        linear-gradient(180deg, oklch(.98 .005 ${HUE}) 0%, oklch(.95 .015 ${HUE}) 100%)
      `,
      position: 'relative', paddingBottom: 110,
    }}>
      {/* Floating back */}
      <button style={{
        position: 'absolute', top: 14, left: 16, zIndex: 10,
        width: 36, height: 36, borderRadius: 9999, border: 0, cursor: 'pointer',
        background: 'oklch(1 0 0 / .65)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>

      {/* Header */}
      <div style={{ padding: '22px 20px 4px', paddingTop: 64 }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--muted-foreground)', letterSpacing: '.05em', textTransform: 'uppercase', fontWeight: 600 }}>
          Nutrição
        </p>
        <h1 style={{ margin: '4px 0 4px', fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
          {stage === 'results' ? 'Sua refeição' : 'Nova refeição'}
        </h1>
        <p style={{ margin: 0, fontFamily: 'var(--font-mono, ui-monospace)', fontSize: 11, color: 'var(--muted-foreground)' }}>
          DOM · 17 MAI · 13:24
        </p>
      </div>

      {/* TYPE chip — auto-detected, tappable */}
      <div style={{ padding: '14px 20px 0' }}>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px 6px 8px', borderRadius: 9999,
          background: `oklch(.95 .04 ${HUE})`, border: `1px solid oklch(.5 .14 ${HUE} / .2)`,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>🍽️</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: `oklch(.32 .14 ${HUE})` }}>Almoço</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={`oklch(.5 .14 ${HUE})`} strokeWidth="1.8" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </div>

      {stage === 'capture' && <CaptureContent hue={HUE} />}
      {stage === 'analyzing' && <AnalyzingContent hue={HUE} />}
      {stage === 'results' && <ResultsContent hue={HUE} />}
    </div>
  );
}

function CaptureContent({ hue }) {
  return (
    <>
      {/* HERO — photo area, big and primary */}
      <div style={{ padding: '18px 14px 0' }}>
        <div style={{
          aspectRatio: '4/3', borderRadius: 22, position: 'relative', overflow: 'hidden',
          background: `linear-gradient(135deg, oklch(.95 .04 ${hue}) 0%, oklch(.88 .08 ${hue}) 100%)`,
          border: `1.5px dashed oklch(.5 .14 ${hue} / .4)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
          cursor: 'pointer',
        }}>
          {/* Decoration */}
          <div style={{
            position: 'absolute', right: -20, top: -20, width: 140, height: 140, borderRadius: 9999,
            background: `radial-gradient(circle, oklch(.5 .14 ${hue} / .12), transparent 70%)`,
            pointerEvents: 'none',
          }} />
          {/* Icon + label */}
          <div style={{
            width: 64, height: 64, borderRadius: 9999, marginBottom: 12,
            background: `oklch(.5 .14 ${hue})`, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 24px -8px oklch(.5 .14 ${hue} / .5)`,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
              <circle cx="12" cy="13" r="3"/>
            </svg>
          </div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: `oklch(.2 .04 ${hue})`, letterSpacing: '-0.01em' }}>
            Tire uma foto
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: `oklch(.42 .08 ${hue})`, textAlign: 'center', maxWidth: 220 }}>
            A Maya identifica os ingredientes e estima os macros automaticamente
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button style={{
              padding: '8px 14px', borderRadius: 12, border: 0,
              background: 'oklch(1 0 0 / .8)', backdropFilter: 'blur(4px)',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
              color: `oklch(.32 .14 ${hue})`,
              display: 'inline-flex', alignItems: 'center', gap: 5,
              boxShadow: '0 1px 3px oklch(.25 .02 160 / .08)',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
              </svg>
              Câmera
            </button>
            <button style={{
              padding: '8px 14px', borderRadius: 12, border: 0,
              background: 'oklch(1 0 0 / .8)', backdropFilter: 'blur(4px)',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
              color: `oklch(.32 .14 ${hue})`,
              display: 'inline-flex', alignItems: 'center', gap: 5,
              boxShadow: '0 1px 3px oklch(.25 .02 160 / .08)',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>
              </svg>
              Galeria
            </button>
          </div>
        </div>
      </div>

      {/* OR divider */}
      <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ flex: 1, height: 1, background: 'oklch(.5 .12 160 / .15)' }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.16em', color: 'var(--muted-foreground)' }}>OU DESCREVA</span>
        <span style={{ flex: 1, height: 1, background: 'oklch(.5 .12 160 / .15)' }} />
      </div>

      {/* Description — inline contenteditable, no card */}
      <div style={{ padding: '18px 24px 0' }}>
        <div
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Ex: salada com frango grelhado, arroz integral e abacate…"
          style={{
            outline: 'none',
            fontSize: 16, lineHeight: 1.55, fontWeight: 500,
            letterSpacing: '-0.005em', minHeight: 60,
            color: 'var(--foreground)',
          }}
        >
          Salada com frango grelhado, arroz integral e abacate
        </div>
      </div>

      {/* Sticky save */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '12px 16px',
        background: `linear-gradient(180deg, transparent 0%, oklch(.95 .015 ${hue} / .85) 25%, oklch(.95 .015 ${hue}) 100%)`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 11, color: 'var(--muted-foreground)', flex: 1, fontFamily: 'var(--font-mono, ui-monospace)' }}>
          1 descrição
        </span>
        <button style={{
          height: 46, padding: '0 22px', borderRadius: 14,
          background: `oklch(.5 .14 ${hue})`, color: '#fff', border: 0, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          boxShadow: `0 4px 14px -4px oklch(.5 .14 ${hue} / .5)`,
        }}>
          Analisar
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/>
          </svg>
        </button>
      </div>
    </>
  );
}

function AnalyzingContent({ hue }) {
  return (
    <div style={{ padding: '28px 24px 0' }}>
      {/* Foto preview esmaecida */}
      <div style={{
        aspectRatio: '4/3', borderRadius: 22, overflow: 'hidden', position: 'relative',
        background: `linear-gradient(135deg, oklch(.88 .08 ${hue}) 0%, oklch(.75 .15 ${hue}) 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Shimmer overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, oklch(1 0 0 / .35) 50%, transparent 100%)',
          animation: 'shimmer 1.6s linear infinite',
        }} />
        {/* Center: Maya thinking */}
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 9999, margin: '0 auto 12px',
            background: 'oklch(1 0 0 / .9)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px -8px oklch(.25 .02 160 / .35)',
          }}>
            <span style={{
              width: 28, height: 28, borderRadius: 9999, overflow: 'hidden',
              border: '2px solid #fff', animation: 'pulse 2s ease-in-out infinite',
            }}>
              <img src="assets/Maya.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: '#fff', fontWeight: 600, letterSpacing: '-0.005em', textShadow: '0 1px 4px oklch(.25 .02 160 / .35)' }}>
            Maya está olhando…
          </p>
        </div>
      </div>

      <p style={{ margin: '20px 0 0', fontSize: 13, color: 'var(--muted-foreground)', textAlign: 'center', fontStyle: 'italic' }}>
        Identificando ingredientes e estimando os macros
      </p>

      {/* Skeleton macro tiles */}
      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            aspectRatio: '1', borderRadius: 14,
            background: 'linear-gradient(120deg, oklch(.93 .02 160), oklch(.96 .015 160), oklch(.93 .02 160))',
            backgroundSize: '200% 100%',
            animation: 'shimmerBg 1.6s linear infinite',
          }} />
        ))}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes shimmerBg {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(.95); opacity: .75; }
        }
      `}</style>
    </div>
  );
}

function ResultsContent({ hue }) {
  return (
    <>
      {/* Photo at top */}
      <div style={{ padding: '14px 14px 0' }}>
        <div style={{
          aspectRatio: '4/3', borderRadius: 22, overflow: 'hidden',
          background: `linear-gradient(135deg, oklch(.85 .1 ${hue}), oklch(.7 .15 ${hue}))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {/* Placeholder for actual photo */}
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="oklch(1 0 0 / .5)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>
          </svg>
          <span style={{
            position: 'absolute', top: 10, right: 10,
            padding: '3px 10px', borderRadius: 9999, fontSize: 10, fontWeight: 700,
            letterSpacing: '.08em', textTransform: 'uppercase',
            background: 'oklch(.45 .14 160)', color: '#fff',
          }}>
            ✓ Analisado
          </span>
        </div>
      </div>

      {/* MACROS bento — 4 mini tiles */}
      <div style={{ padding: '20px 14px 0' }}>
        <p style={{ margin: '0 0 10px 6px', fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: `oklch(.45 .14 ${hue})` }}>
          Macros estimados
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          <MacroTile label="Kcal" value="540" hue={30} />
          <MacroTile label="Carb" value="68g" hue={85} />
          <MacroTile label="Prot" value="42g" hue={220} />
          <MacroTile label="Gord" value="14g" hue={270} />
        </div>
      </div>

      {/* ITENS identificados */}
      <div style={{ padding: '24px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
            Identificados
          </p>
          <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>4 itens</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['Frango grelhado','Arroz integral','Salada verde','Abacate'].map((item) => (
            <span key={item} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 10px 6px 12px', borderRadius: 9999,
              background: '#fff', border: '1px solid oklch(.5 .14 30 / .15)',
              fontSize: 12.5, fontWeight: 500, color: 'var(--foreground)',
            }}>
              {item}
              <button style={{
                width: 16, height: 16, borderRadius: 9999, border: 0,
                background: 'oklch(.5 .12 160 / .1)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--muted-foreground)',
              }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6 18 18M18 6 6 18"/></svg>
              </button>
            </span>
          ))}
          <button style={{
            padding: '6px 11px', borderRadius: 9999,
            background: 'transparent', border: '1.5px dashed oklch(.5 .14 30 / .35)',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
            color: 'oklch(.42 .14 30)',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Adicionar
          </button>
        </div>
      </div>

      {/* CLASSIFICAÇÃO */}
      <div style={{ padding: '22px 24px 0' }}>
        <p style={{ margin: '0 0 8px', fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
          Classificação
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 12,
          background: 'oklch(.93 .08 145)', border: '1px solid oklch(.45 .14 145 / .25)',
        }}>
          <span style={{ fontSize: 14 }}>✓</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'oklch(.32 .14 145)' }}>
            Equilibrada
          </span>
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.45, fontStyle: 'italic' }}>
          Boa proporção de proteína, carbo complexo e gordura saudável.
        </p>
      </div>

      {/* Sticky save */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '12px 16px',
        background: `linear-gradient(180deg, transparent 0%, oklch(.95 .015 ${hue} / .85) 25%, oklch(.95 .015 ${hue}) 100%)`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button style={{
          height: 42, padding: '0 14px', borderRadius: 12,
          background: 'transparent', border: '1px solid oklch(.5 .12 160 / .2)',
          cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600,
          color: 'var(--muted-foreground)',
        }}>
          Salvar sem análise
        </button>
        <button style={{
          flex: 1, height: 46, borderRadius: 14,
          background: `oklch(.5 .14 ${hue})`, color: '#fff', border: 0, cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          boxShadow: `0 4px 14px -4px oklch(.5 .14 ${hue} / .5)`,
        }}>
          Confirmar e salvar
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10"/></svg>
        </button>
      </div>
    </>
  );
}

function MacroTile({ label, value, hue }) {
  return (
    <div style={{
      borderRadius: 14, padding: '11px 8px',
      background: `linear-gradient(180deg, #fff, oklch(.97 .025 ${hue}))`,
      border: `1px solid oklch(.5 .12 ${hue} / .15)`,
      boxShadow: '0 1px 2px oklch(.25 .02 160 / .04)',
      textAlign: 'center',
    }}>
      <p style={{
        margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.025em',
        fontVariantNumeric: 'tabular-nums', color: `oklch(.32 .14 ${hue})`, lineHeight: 1,
      }}>{value}</p>
      <p style={{
        margin: '4px 0 0', fontSize: 9.5, fontWeight: 700, letterSpacing: '.1em',
        textTransform: 'uppercase', color: `oklch(.5 .12 ${hue})`,
      }}>{label}</p>
    </div>
  );
}

Object.assign(window, { RefeicaoRegistroCapture, RefeicaoRegistroAnalyzing, RefeicaoRegistroResults });
