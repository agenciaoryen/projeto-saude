// DashboardBento.jsx — Variant B (refinada): bento sections + inline blocks
// 390 × 844, designed for canvas artboard

function DashboardBento() {
  const [carouselIdx, setCarouselIdx] = React.useState(0);
  const [porqueIdx, setPorqueIdx] = React.useState(0);
  const CAROUSEL = [
    {
      eyebrow: 'NOVO',
      title: 'Fio da Semana com sentimentos',
      body: 'Veja como você se sentiu cada dia.',
      cta: 'Ver',
      bg: 'linear-gradient(135deg,#312e81 0%,#1e1b4b 100%)',
      accent: 'oklch(.55 .2 280)',
    },
    {
      eyebrow: 'LEMBRETE',
      title: 'Conversar com Maya é gratuito sempre',
      body: 'Ela está acordada quando você precisar.',
      cta: 'Conversar',
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

  const PORQUES = [
    { text: 'Pela Sofia. Pra ela me ver inteira quando crescer.' },
    { text: 'Pra dormir tranquila comigo mesma.' },
    { text: 'Pra voltar a sentir prazer nas coisas pequenas.' },
  ];

  React.useEffect(() => {
    const t = setInterval(() => setCarouselIdx((i) => (i + 1) % CAROUSEL.length), 5000);
    return () => clearInterval(t);
  }, []);

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

      {/* ═ GREETING ═ */}
      <div style={{ padding: '22px 20px 4px' }}>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--muted-foreground)', letterSpacing: '.05em', textTransform: 'uppercase', fontWeight: 600 }}>
          Boa tarde
        </p>
        <h1 style={{ margin: '4px 0 4px', fontSize: 34, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
          Ana
        </h1>
        <p style={{ margin: 0, fontFamily: 'var(--font-mono, ui-monospace)', fontSize: 11, color: 'var(--muted-foreground)' }}>
          DOM · 17 MAI
        </p>
      </div>

      {/* ═ MAYA CARD ═ */}
      <div style={{ padding: '16px 14px 0' }}>
        <div style={{
          borderRadius: 22, padding: '18px 18px 16px',
          background: `
            radial-gradient(circle at 100% 100%, oklch(.88 .12 160 / .35), transparent 60%),
            linear-gradient(135deg, oklch(.95 .02 160) 0%, oklch(.92 .04 160) 100%)
          `,
          border: '1px solid oklch(.5 .12 160 / .15)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: -50, bottom: -50, width: 180, height: 180,
            borderRadius: 9999, border: '1px solid oklch(.5 .12 160 / .15)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', right: -25, bottom: -25, width: 130, height: 130,
            borderRadius: 9999, border: '1px solid oklch(.5 .12 160 / .1)', pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', position: 'relative' }}>
            <div style={{ position: 'relative', flex: 'none' }}>
              <span style={{
                position: 'absolute', inset: -6, borderRadius: 9999,
                background: 'oklch(.78 .14 160 / .12)',
                animation: 'breathe2 3s ease-in-out infinite',
              }} />
              <span style={{
                width: 60, height: 60, borderRadius: 9999, overflow: 'hidden',
                display: 'block', border: '2.5px solid #fff', position: 'relative',
                boxShadow: '0 4px 14px -4px oklch(.25 .02 160 / .3)',
              }}>
                <img src="assets/Maya.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </span>
              <span style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 14, height: 14, borderRadius: 9999, background: '#22c55e',
                border: '2.5px solid #fff',
              }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'oklch(.4 .12 160)' }}>
                Maya · agora
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 14.5, lineHeight: 1.4, fontWeight: 500, letterSpacing: '-0.005em' }}>
                Vi que ontem dormiu mal. Quer me contar como está agora? Sem pressa.
              </p>
            </div>
          </div>
          <button style={{
            marginTop: 12, height: 38, width: '100%', borderRadius: 12,
            background: 'oklch(.4 .12 160)', color: '#fff', border: 0, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: '0 4px 12px -4px oklch(.4 .12 160 / .45)',
          }}>
            Conversar com Maya
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ═ MEU PORQUÊ — inline, photo + italic quote ═ */}
      <div style={{ padding: '22px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'oklch(.55 .12 20)' }}>
            Meu Porquê
          </p>
          <div style={{ display: 'flex', gap: 4 }}>
            {PORQUES.map((_, i) => (
              <span key={i} style={{
                width: i === porqueIdx ? 14 : 5, height: 5, borderRadius: 9999,
                background: i === porqueIdx ? 'oklch(.55 .12 20)' : 'oklch(.5 .1 20 / .25)',
                transition: 'width .3s ease',
              }} />
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '74px 1fr', gap: 14, alignItems: 'center' }}>
          {/* Photo placeholder */}
          <div style={{
            width: 74, height: 74, borderRadius: 16, overflow: 'hidden', flex: 'none',
            background: 'linear-gradient(135deg, oklch(.9 .06 30) 0%, oklch(.82 .12 30) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px -6px oklch(.4 .12 30 / .35)',
            border: '2px solid #fff',
          }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="oklch(.45 .12 30 / .5)">
              <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
              <path d="M3 21a9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p style={{
            margin: 0, fontSize: 16.5, lineHeight: 1.4, letterSpacing: '-0.005em',
            fontStyle: 'italic', fontWeight: 500, color: 'var(--foreground)', textWrap: 'pretty',
          }}>
            &ldquo;{PORQUES[porqueIdx].text}&rdquo;
          </p>
        </div>
      </div>

      {/* ═ CUIDADOS DE HOJE — inline, no card ═ */}
      <div style={{ padding: '32px 24px 0', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: '#a16207' }}>
            Cuidados de hoje
          </p>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#a16207', fontVariantNumeric: 'tabular-nums' }}>
            55%
          </span>
        </div>

        {/* Hero stat row: big number + progress bar to the right */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 18, alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 56, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: .85, fontVariantNumeric: 'tabular-nums', color: '#1c1917' }}>
              6
            </span>
            <span style={{ fontSize: 22, color: 'var(--muted-foreground)', fontWeight: 400, lineHeight: 1 }}>
              / 11
            </span>
          </div>
          <div>
            <div style={{
              height: 6, borderRadius: 9999, background: 'oklch(.85 .05 80 / .35)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: '55%', borderRadius: 9999,
                background: 'linear-gradient(90deg,#d97706,#f59e0b)',
              }} />
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 10.5, color: 'var(--muted-foreground)' }}>
              6 cuidados feitos · 5 pendentes
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[['💧','1.5L'],['😴','7h'],['🧘','Pausa'],['🗣️','Conversa'],['💊','Remédios'],['🍽️','Comeu bem']].map(([e,l]) => (
            <span key={l} style={{
              padding: '6px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 500,
              background: 'oklch(1 0 0 / .85)', backdropFilter: 'blur(4px)',
              border: '1px solid oklch(.85 .05 80 / .5)',
              display: 'inline-flex', alignItems: 'center', gap: 5,
              boxShadow: '0 1px 0 oklch(.25 .02 160 / .04)',
              color: '#1c1917',
            }}>{e} {l}</span>
          ))}
        </div>

        <button style={{
          marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 5,
          background: 'transparent', border: 0, cursor: 'pointer', padding: 0,
          fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: '#a16207',
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m16.474 5.408 2.118 2.117m-.756-3.982-9.06 9.06a2.85 2.85 0 0 0-.7 1.123L7 16.5l2.774-1.076a2.85 2.85 0 0 0 1.123-.7l9.06-9.06a1.96 1.96 0 0 0-2.77-2.77Z"/></svg>
          Editar check-in
        </button>
      </div>

      {/* ═ METAS, FIO, CARROSSEL, DATA — bento section ═ */}
      <div style={{ padding: '32px 14px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

        {/* Metas — full width dark card */}
        <div style={{
          gridColumn: '1 / -1',
          borderRadius: 18, padding: '16px 18px',
          background: `
            radial-gradient(circle at 100% 0, oklch(.45 .18 260 / .35), transparent 50%),
            linear-gradient(160deg, oklch(.28 .14 260) 0%, oklch(.2 .1 260) 100%)
          `,
          color: '#fff',
          boxShadow: '0 8px 24px -12px oklch(.22 .12 260 / .55)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)' }}>
              Metas da semana
            </p>
            <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,.55)' }}>2 de 5 ✓</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { done: true,  text: 'Caminhar 3x esta semana' },
              { done: false, text: 'Ler antes de dormir',     sub: '4 de 7 dias' },
              { done: false, text: 'Ligar pra Sofia no sábado' },
            ].map((g, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 6, flex: 'none',
                  background: g.done ? '#22c55e' : 'transparent',
                  border: g.done ? 'none' : '1.5px solid rgba(255,255,255,.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {g.done && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5 9-10"/>
                    </svg>
                  )}
                </span>
                <span style={{
                  flex: 1, fontSize: 13.5, fontWeight: 500, letterSpacing: '-0.005em',
                  color: g.done ? 'rgba(255,255,255,.55)' : '#fff',
                  textDecoration: g.done ? 'line-through' : 'none',
                }}>{g.text}</span>
                {g.sub && <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,.55)' }}>{g.sub}</span>}
              </li>
            ))}
          </ul>
        </div>

        {/* Fio da semana */}
        <div style={{
          gridColumn: '1 / -1',
          borderRadius: 18, padding: '16px 16px 18px',
          background: `linear-gradient(180deg,#fff,oklch(.96 .02 180))`,
          border: '1px solid oklch(.5 .12 180 / .12)',
          boxShadow: '0 1px 2px oklch(.25 .02 160 / .04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#0e7490' }}>
              O Fio · 7 dias
            </p>
            <span style={{ fontSize: 10.5, color: 'var(--muted-foreground)' }}>Energia média 6.0</span>
          </div>
          <FioBento />
        </div>

        {/* Carrossel — NO emoji. Abstract layered composition. */}
        <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
          <div style={{
            borderRadius: 18, overflow: 'hidden', minHeight: 144, position: 'relative',
          }}>
            {CAROUSEL.map((s, i) => (
              <div key={i} style={{
                position: i === carouselIdx ? 'relative' : 'absolute', inset: 0,
                padding: '20px 22px',
                background: s.bg, color: '#fff',
                opacity: i === carouselIdx ? 1 : 0,
                transition: 'opacity .5s ease',
                minHeight: 144, overflow: 'hidden',
              }}>
                {/* Abstract decorative shapes — placeholder for real artwork */}
                <CarouselArtwork accent={s.accent} />

                <div style={{ position: 'relative', maxWidth: '78%' }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.65)' }}>
                    {s.eyebrow}
                  </p>
                  <h3 style={{ margin: '6px 0 6px', fontSize: 18, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.015em', textWrap: 'balance' }}>
                    {s.title}
                  </h3>
                  <p style={{ margin: '0 0 12px', fontSize: 12, lineHeight: 1.4, color: 'rgba(255,255,255,.75)' }}>
                    {s.body}
                  </p>
                  <button style={{
                    padding: '6px 14px', borderRadius: 9999,
                    background: 'rgba(255,255,255,.18)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,.3)', cursor: 'pointer',
                    color: '#fff', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}>
                    {s.cta}
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 8 }}>
            {CAROUSEL.map((_, i) => (
              <span key={i} style={{
                width: i === carouselIdx ? 16 : 5, height: 5, borderRadius: 9999,
                background: i === carouselIdx ? 'var(--foreground)' : 'oklch(.5 .12 160 / .2)',
                transition: 'width .3s ease',
              }} />
            ))}
          </div>
        </div>

        {/* Nutrição (left) + Evolução (right) */}
        <div style={{
          borderRadius: 18, padding: '14px 14px 16px',
          background: `linear-gradient(180deg,#fff,oklch(.96 .03 30))`,
          border: '1px solid oklch(.5 .12 30 / .12)',
          boxShadow: '0 1px 2px oklch(.25 .02 160 / .04)',
        }}>
          <p style={{ margin: 0, fontSize: 9.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#be123c' }}>
            Nutrição
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <div style={{ width: 48, height: 48, position: 'relative', flex: 'none' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15" fill="none" stroke="oklch(.25 .02 30 / .1)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="#dc2626" strokeWidth="3" strokeDasharray="78 94.2" strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700, color: '#be123c' }}>83</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: .95, fontVariantNumeric: 'tabular-nums' }}>1420</div>
              <div style={{ fontSize: 10.5, color: 'var(--muted-foreground)', marginTop: 2 }}>kcal · 3 ref</div>
            </div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--muted-foreground)', fontVariantNumeric: 'tabular-nums' }}>C 168g</span>
            <span style={{ fontSize: 10, color: 'var(--muted-foreground)', fontVariantNumeric: 'tabular-nums' }}>P 88g</span>
            <span style={{ fontSize: 10, color: 'var(--muted-foreground)', fontVariantNumeric: 'tabular-nums' }}>G 42g</span>
          </div>
        </div>

        <div style={{
          borderRadius: 18, padding: '14px 14px 16px',
          background: '#fff', border: '1px solid oklch(.5 .12 160 / .12)',
          boxShadow: '0 1px 2px oklch(.25 .02 160 / .04)',
          display: 'flex', flexDirection: 'column',
        }}>
          <p style={{ margin: 0, fontSize: 9.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'oklch(.4 .12 160)' }}>
            Evolução · 14d
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: .95, fontVariantNumeric: 'tabular-nums' }}>6.4</span>
            <span style={{ fontSize: 10.5, color: 'var(--muted-foreground)' }}>média · subindo</span>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 8 }}>
            <SparkSmall />
          </div>
        </div>

      </div>

      <style>{`
        @keyframes breathe2 {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────

// Layered abstract decoration for carousel — placeholder for real artwork.
// 3 overlapping translucent shapes giving depth + a soft glow accent.
function CarouselArtwork({ accent }) {
  return (
    <>
      {/* Soft glow */}
      <div style={{
        position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: 9999,
        background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
        opacity: .35, pointerEvents: 'none',
      }} />
      {/* Outline ring 1 */}
      <div style={{
        position: 'absolute', right: -30, top: 16, width: 120, height: 120, borderRadius: 9999,
        border: '1px solid rgba(255,255,255,.18)', pointerEvents: 'none',
      }} />
      {/* Outline ring 2 — offset */}
      <div style={{
        position: 'absolute', right: -10, top: 36, width: 80, height: 80, borderRadius: 9999,
        border: '1px solid rgba(255,255,255,.12)', pointerEvents: 'none',
      }} />
      {/* Solid translucent disc */}
      <div style={{
        position: 'absolute', right: 22, top: 22, width: 56, height: 56, borderRadius: 9999,
        background: 'rgba(255,255,255,.08)', backdropFilter: 'blur(6px)',
        border: '1px solid rgba(255,255,255,.2)', pointerEvents: 'none',
      }} />
    </>
  );
}

function FioBento() {
  const days = [
    { d: 'seg', e: 5, sleep: 'mau', mood: 'cansada',         feeling: 'Reunião puxada' },
    { d: 'ter', e: 4, sleep: 'mau', mood: 'ansiosa',         feeling: '' },
    { d: 'qua', e: 6, sleep: 'bom', mood: 'calma',           feeling: 'Dia mediano' },
    { d: 'qui', e: 7, sleep: 'bom', mood: 'feliz',           feeling: 'Voltei a ler' },
    { d: 'sex', e: 5, sleep: 'mau', mood: 'sobrecarregada', feeling: '' },
    { d: 'sáb', e: 8, sleep: 'bom', mood: 'feliz',           feeling: 'Caminhada longa' },
    { d: 'dom', e: 7, sleep: 'bom', mood: 'calma',           feeling: 'Em paz hoje', today: true },
  ];
  const ENERGY_COLOR = (e) => e >= 7 ? '#059669' : e >= 5 ? '#b45309' : '#dc2626';
  const NEGATIVE = ['ansiosa','triste','cansada','sobrecarregada','irritada'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {days.map((day) => {
        const moodNeg = NEGATIVE.includes(day.mood);
        return (
          <div key={day.d} style={{
            display: 'grid', gridTemplateColumns: '32px 14px 38px 1fr',
            gap: 8, alignItems: 'center',
            padding: '4px 8px', borderRadius: 8,
            background: day.today ? 'oklch(.5 .12 180 / .08)' : 'transparent',
          }}>
            <span style={{
              fontSize: 10.5, fontWeight: day.today ? 700 : 600, letterSpacing: '.08em', textTransform: 'uppercase',
              color: day.today ? 'oklch(.35 .12 180)' : 'var(--muted-foreground)',
            }}>{day.d}</span>
            <span style={{ fontSize: 13, lineHeight: 1, opacity: day.sleep === 'bom' ? 1 : 0.4 }}>
              {day.sleep === 'bom' ? '🌙' : '😵'}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              color: ENERGY_COLOR(day.e),
            }}>{day.e}/10</span>
            <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                padding: '1px 7px', borderRadius: 9999, fontSize: 9.5, fontWeight: 600,
                background: moodNeg ? 'oklch(.92 .05 30 / .6)' : 'oklch(.88 .08 160 / .5)',
                color: moodNeg ? 'oklch(.4 .1 30)' : 'oklch(.32 .1 160)',
                flex: 'none',
              }}>{day.mood}</span>
              <span style={{
                fontSize: 11, color: 'var(--muted-foreground)', minWidth: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{day.feeling || '—'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SparkSmall() {
  const data = [4, 5, 4, 6, 5, 6, 7, 5, 6, 6, 5, 7, 6, 7];
  const W = 140, H = 38, P = 2;
  const max = 10, min = 0;
  const xStep = (W - P * 2) / (data.length - 1);
  const points = data.map((v, i) => {
    const x = P + i * xStep;
    const y = P + (H - P * 2) * (1 - (v - min) / (max - min));
    return [x, y];
  });
  const line = points.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
  const fill = `${line} L ${points[points.length-1][0]} ${H} L ${points[0][0]} ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 38, display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="ssFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(.5 .12 160)" stopOpacity=".25" />
          <stop offset="100%" stopColor="oklch(.5 .12 160)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#ssFill)" />
      <path d={line} fill="none" stroke="oklch(.5 .12 160)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

Object.assign(window, { DashboardBento });
