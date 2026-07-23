// PlanBento.jsx — Variant A: bento sections matching Dashboard v2 language
// 390×844, designed for canvas artboard

function PlanBento() {
  const [selectedDay, setSelectedDay] = React.useState(2); // qua highlighted

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
          Planejamento · Semana 20
        </p>
        <h1 style={{ margin: '4px 0 4px', fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
          Suas Pedras
        </h1>
        <p style={{ margin: 0, fontFamily: 'var(--font-mono, ui-monospace)', fontSize: 11, color: 'var(--muted-foreground)' }}>
          13 MAI – 19 MAI · 12 de 20 ✓
        </p>
      </div>

      {/* ═ PEDRAS — 3 cards verticais com hierarquia ═ */}
      <div style={{ padding: '18px 14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, padding: '0 6px' }}>
          <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'oklch(.45 .12 220)' }}>
            Pedras da semana
          </p>
          <button style={{
            background: 'transparent', border: 0, padding: 0, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 11, fontWeight: 600, color: 'oklch(.45 .12 220)',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m16.5 5.4 2.1 2.1m-.7-4-9 9-1 3 3-1 9-9.1a1.95 1.95 0 0 0-2.7-2.7Z"/></svg>
            Editar
          </button>
        </div>
        <Pedra rank="I"   size="lg"  text="Voltar a correr 3x por semana" linkedGoal="Saúde · Maratona" />
        <Pedra rank="II"  size="md"  text="Fechar o cliente Visualis"      linkedGoal="Carreira" />
        <Pedra rank="III" size="sm"  text="Ligar pra Sofia todos os dias" />
      </div>

      {/* ═ RADAR DAS ÁREAS ═ */}
      <div style={{ padding: '24px 14px 0' }}>
        <div style={{
          borderRadius: 22, padding: '18px 18px 16px',
          background: `
            radial-gradient(circle at 50% 100%, oklch(.92 .08 180 / .35), transparent 60%),
            linear-gradient(180deg, #fff 0%, oklch(.97 .015 180) 100%)
          `,
          border: '1px solid oklch(.5 .12 180 / .12)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'oklch(.35 .14 180)' }}>
              Roda das áreas
            </p>
            <span style={{ fontSize: 10.5, color: 'var(--muted-foreground)' }}>
              6 de 9 cobertas
            </span>
          </div>
          <AreasRadar />
          <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--muted-foreground)', textAlign: 'center', fontStyle: 'italic', textWrap: 'pretty' }}>
            Espiritualidade, Lazer e Outros estão sem tarefas esta semana.
          </p>
        </div>
      </div>

      {/* ═ AGENDA ═ heat row + dia selecionado */}
      <div style={{ padding: '20px 14px 0' }}>
        <div style={{
          borderRadius: 22, padding: '16px 4px 12px',
          background: '#fff', border: '1px solid oklch(.5 .12 160 / .12)',
          boxShadow: '0 1px 2px oklch(.25 .02 160 / .04)',
        }}>
          <p style={{ margin: '0 14px 12px', fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'oklch(.4 .12 160)' }}>
            Sua semana
          </p>
          <WeekHeat selectedDay={selectedDay} onSelect={setSelectedDay} />
          <div style={{ padding: '14px 14px 0', borderTop: '1px solid oklch(.5 .12 160 / .08)', marginTop: 12 }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: 'oklch(.25 .02 160)', letterSpacing: '-0.005em' }}>
              {['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'][selectedDay]} ·{' '}
              <span style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>4 itens · 2 feitos</span>
            </p>
            <SelectedDayTasks day={selectedDay} />
            <button style={{
              marginTop: 10, width: '100%', padding: '10px 14px', borderRadius: 12,
              background: 'oklch(.95 .04 160)', border: '1.5px dashed oklch(.5 .12 160 / .35)',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
              color: 'oklch(.4 .12 160)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Adicionar item
            </button>
          </div>
        </div>
      </div>

      {/* ═ REVISÃO (estado vazio - é semana atual) ═ */}
      <div style={{ padding: '20px 14px 0' }}>
        <div style={{
          borderRadius: 18, padding: '16px 18px',
          background: `
            radial-gradient(circle at 100% 0, oklch(.92 .1 60 / .35), transparent 55%),
            linear-gradient(180deg, oklch(.98 .02 70) 0%, oklch(.96 .04 60) 100%)
          `,
          border: '1px solid oklch(.78 .1 60 / .35)',
          display: 'flex', gap: 14, alignItems: 'center',
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: 9999, flex: 'none',
            background: 'linear-gradient(135deg, oklch(.85 .15 60), oklch(.7 .18 50))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px -4px oklch(.6 .18 50 / .4)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
              <path d="m12 2 2.4 7.4H22l-6.2 4.6 2.4 7.4-6.2-4.6L5.8 21.4l2.4-7.4L2 9.4h7.6L12 2Z"/>
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'oklch(.45 .14 50)' }}>
              Revisão da semana
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--foreground)', lineHeight: 1.35 }}>
              No domingo à noite, feche a semana com 4 perguntas. Leva 3 min.
            </p>
          </div>
        </div>
      </div>

      {/* ═ MAYA — soft pill no fim (não CTA pesado) ═ */}
      <div style={{ padding: '18px 24px 0' }}>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'oklch(1 0 0 / .6)', backdropFilter: 'blur(8px)',
          border: '1px solid oklch(.5 .12 160 / .2)', borderRadius: 9999,
          padding: '8px 14px 8px 8px', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 12.5, fontWeight: 500, color: 'var(--foreground)',
          letterSpacing: '-0.005em',
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: 9999, overflow: 'hidden', flex: 'none',
            border: '1px solid #fff',
          }}>
            <img src="assets/Maya.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </span>
          Maya pode ajudar a equilibrar a roda
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
               style={{ color: 'var(--muted-foreground)', marginLeft: -2 }}>
            <path d="M5 12h14M13 5l7 7-7 7"/>
          </svg>
        </button>
      </div>

      {/* ═ HISTÓRICO compacto ═ */}
      <div style={{ padding: '24px 24px 0' }}>
        <p style={{ margin: '0 0 10px', fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
          Semanas anteriores
        </p>
        {[
          { label: '6–12 mai',  focus: 'Estabilizar rotina de sono',    score: 4 },
          { label: '29 abr–5 mai', focus: 'Voltar pra terapia',          score: 3 },
          { label: '22–28 abr', focus: 'Comecei o curso de inglês',     score: 5 },
        ].map((w, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 0',
            borderTop: i === 0 ? 'none' : '1px solid oklch(.5 .12 160 / .1)',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', fontVariantNumeric: 'tabular-nums' }}>
                {w.label}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {w.focus}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 1 }}>
              {Array.from({ length: 5 }).map((_, j) => (
                <span key={j} style={{
                  fontSize: 11, color: j < w.score ? 'oklch(.6 .18 60)' : 'oklch(.5 .12 160 / .2)',
                }}>★</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────

function Pedra({ rank, size, text, linkedGoal }) {
  const SIZE_MAP = {
    lg: { num: 32, py: 16, fs: 16, accent: 'oklch(.42 .14 220)', bg: 'linear-gradient(135deg, oklch(.95 .06 220) 0%, oklch(.92 .08 210) 100%)' },
    md: { num: 26, py: 13, fs: 14.5, accent: 'oklch(.5 .12 220)',  bg: 'linear-gradient(135deg, oklch(.96 .04 220) 0%, oklch(.94 .055 215) 100%)' },
    sm: { num: 22, py: 11, fs: 13.5, accent: 'oklch(.55 .1 220)',  bg: 'linear-gradient(135deg, oklch(.97 .03 220) 0%, oklch(.95 .04 220) 100%)' },
  };
  const s = SIZE_MAP[size];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `${s.num + 22}px 1fr`, gap: 14,
      padding: `${s.py}px 16px`, borderRadius: 16, marginBottom: 8,
      background: s.bg, border: `1px solid ${s.accent} / .15`,
      borderColor: 'oklch(.5 .12 220 / .15)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Big roman numeral */}
      <span style={{
        fontSize: s.num, fontWeight: 800, lineHeight: .9,
        letterSpacing: '-0.04em', color: s.accent,
        fontFamily: 'var(--font-mono, ui-monospace)',
        opacity: .65, alignSelf: 'center',
      }}>{rank}</span>
      <div style={{ minWidth: 0, alignSelf: 'center' }}>
        <p style={{
          margin: 0, fontSize: s.fs, fontWeight: 600, lineHeight: 1.3,
          letterSpacing: '-0.01em', color: 'oklch(.2 .04 220)',
        }}>{text}</p>
        {linkedGoal && (
          <p style={{
            margin: '3px 0 0', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em',
            textTransform: 'uppercase', color: s.accent, opacity: .8,
          }}>
            ↳ {linkedGoal}
          </p>
        )}
      </div>
    </div>
  );
}

function AreasRadar() {
  const AREAS = [
    { key: 'saude',           label: 'Saúde',           emoji: '💚', tasks: 5, hue: 160 },
    { key: 'carreira',        label: 'Carreira',        emoji: '💼', tasks: 4, hue: 220 },
    { key: 'financas',        label: 'Finanças',        emoji: '💰', tasks: 2, hue: 85 },
    { key: 'relacionamentos', label: 'Relac.',          emoji: '❤️', tasks: 3, hue: 15 },
    { key: 'desenvolvimento', label: 'Desenv.',         emoji: '🧠', tasks: 3, hue: 270 },
    { key: 'familia',         label: 'Família',         emoji: '🏡', tasks: 2, hue: 40 },
    { key: 'lazer',           label: 'Lazer',           emoji: '🌊', tasks: 0, hue: 185 },
    { key: 'espirit',         label: 'Espirit.',        emoji: '✨', tasks: 0, hue: 300 },
    { key: 'outros',          label: 'Outros',          emoji: '⚪', tasks: 0, hue: 200 },
  ];
  const N = AREAS.length;
  const MAX = 5;
  const cx = 140, cy = 140, R = 92;

  // points on the polygon for each area
  const point = (i, value) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    const r = R * (value / MAX);
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };
  const ringPoint = (i, ratio) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    return [cx + R * ratio * Math.cos(angle), cy + R * ratio * Math.sin(angle)];
  };
  const labelPoint = (i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;
    const r = R + 22;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  // Filled polygon
  const polyPoints = AREAS.map((a, i) => point(i, a.tasks).join(',')).join(' ');

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 6 }}>
      <svg viewBox="0 0 280 280" style={{ width: 280, height: 280 }}>
        {/* Concentric rings (web) */}
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
        {/* Filled polygon */}
        <polygon points={polyPoints}
          fill="oklch(.5 .12 180 / .22)"
          stroke="oklch(.35 .14 180)" strokeWidth="1.8" strokeLinejoin="round" />
        {/* Vertex dots */}
        {AREAS.map((a, i) => {
          const [x, y] = point(i, a.tasks);
          if (a.tasks === 0) return null;
          return <circle key={a.key} cx={x} cy={y} r="3" fill="#fff" stroke="oklch(.35 .14 180)" strokeWidth="1.5" />;
        })}
        {/* Area labels */}
        {AREAS.map((a, i) => {
          const [lx, ly] = labelPoint(i);
          const isZero = a.tasks === 0;
          return (
            <g key={a.key + 'lbl'} transform={`translate(${lx} ${ly})`}>
              <text textAnchor="middle" dominantBaseline="middle" dy="-6"
                fontSize="14" opacity={isZero ? .4 : 1}>{a.emoji}</text>
              <text textAnchor="middle" dominantBaseline="middle" dy="8"
                fontSize="9" fontWeight="700"
                fill={isZero ? 'oklch(.7 .02 160)' : `oklch(.45 .14 ${a.hue})`}
                style={{ letterSpacing: '.05em', textTransform: 'uppercase' }}>
                {a.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function WeekHeat({ selectedDay, onSelect }) {
  const DAYS = [
    { d: 'seg', count: 4, done: 4 },
    { d: 'ter', count: 5, done: 3 },
    { d: 'qua', count: 4, done: 2, today: true },
    { d: 'qui', count: 3, done: 0 },
    { d: 'sex', count: 2, done: 0 },
    { d: 'sáb', count: 1, done: 0 },
    { d: 'dom', count: 1, done: 0 }, // revisão
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, padding: '0 10px' }}>
      {DAYS.map((day, i) => {
        const sel = i === selectedDay;
        const ratio = day.count > 0 ? day.done / day.count : 0;
        return (
          <button key={i} onClick={() => onSelect(i)}
            style={{
              background: sel ? 'oklch(.5 .12 160 / .12)' : 'transparent',
              border: sel ? '1.5px solid oklch(.5 .12 160 / .5)' : '1.5px solid transparent',
              borderRadius: 12, padding: '8px 2px 6px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              fontFamily: 'inherit',
            }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
              color: day.today ? 'oklch(.35 .14 160)' : sel ? 'oklch(.4 .12 160)' : 'var(--muted-foreground)',
            }}>{day.d}</span>
            {/* Heat dots */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
              {Array.from({ length: Math.max(day.count, 1) }).slice(0, 5).map((_, j) => (
                <span key={j} style={{
                  width: 5, height: 5, borderRadius: 9999,
                  background: j < day.done ? 'oklch(.5 .12 160)' :
                              day.count > 0 ? 'oklch(.5 .12 160 / .25)' : 'oklch(.5 .12 160 / .08)',
                }} />
              ))}
            </div>
            <span style={{
              fontSize: 9.5, color: day.count === 0 ? 'var(--muted-foreground)' : 'var(--foreground)',
              fontWeight: 600, fontVariantNumeric: 'tabular-nums',
            }}>{day.done}/{day.count}</span>
          </button>
        );
      })}
    </div>
  );
}

function SelectedDayTasks({ day }) {
  // day=2 (qua) - sample data
  const TASKS = [
    { type: 'habit',  done: true,  text: 'Tomar remédios da manhã',  time: '07:30', area: 'saude' },
    { type: 'task',   done: true,  text: 'Reunião 1:1 com Lucia',     time: '10:00', area: 'carreira', growth: true },
    { type: 'task',   done: false, text: 'Corrida 30min',             time: '18:00', area: 'saude', growth: true },
    { type: 'habit',  done: false, text: 'Ler 20min antes de dormir', time: '22:30', area: 'desenvolvimento' },
  ];
  const AREA_C = {
    saude:     { hue: 160, emoji: '💚' },
    carreira:  { hue: 220, emoji: '💼' },
    desenvolvimento: { hue: 270, emoji: '🧠' },
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {TASKS.map((t, i) => {
        const c = AREA_C[t.area];
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 12,
            background: t.done ? 'oklch(.97 .015 160)' : '#fff',
            border: `1px solid oklch(.5 .12 ${c.hue} / .12)`,
          }}>
            {/* habit = circle, task = rounded square */}
            <button style={{
              width: 20, height: 20, flex: 'none', cursor: 'pointer',
              borderRadius: t.type === 'habit' ? 9999 : 6,
              background: t.done ? `oklch(.45 .12 ${c.hue})` : 'transparent',
              border: t.done ? 'none' : `1.5px solid oklch(.5 .12 ${c.hue} / .4)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {t.done && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 5 5 9-10"/>
                </svg>
              )}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                margin: 0, fontSize: 13, fontWeight: 500, letterSpacing: '-0.005em',
                color: t.done ? 'var(--muted-foreground)' : 'var(--foreground)',
                textDecoration: t.done ? 'line-through' : 'none',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{t.text}</p>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 1 }}>
                <span style={{ fontSize: 10 }}>{c.emoji}</span>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono, ui-monospace)', color: 'var(--muted-foreground)' }}>
                  {t.time}
                </span>
                {t.growth && (
                  <span style={{
                    fontSize: 8.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
                    padding: '1px 6px', borderRadius: 9999,
                    background: `oklch(.92 .08 ${c.hue} / .6)`, color: `oklch(.4 .14 ${c.hue})`,
                  }}>↑ Crescer</span>
                )}
                {t.type === 'habit' && (
                  <span style={{
                    fontSize: 8.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
                    padding: '1px 6px', borderRadius: 9999,
                    background: 'oklch(.95 .005 160)', color: 'var(--muted-foreground)',
                  }}>↻ Hábito</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { PlanBento });
