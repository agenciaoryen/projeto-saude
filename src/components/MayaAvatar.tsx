/** Maya's avatar — warm gradient circle with a simple, friendly expression. */
export function MayaAvatar({ size = 32 }: { size?: number }) {
  const sz = size;
  const half = sz / 2;
  const r = half - 2;

  return (
    <svg
      width={sz}
      height={sz}
      viewBox={`0 0 ${sz} ${sz}`}
      className="shrink-0"
      aria-hidden="true"
    >
      {/* Gradient circle */}
      <defs>
        <linearGradient id="mayaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <circle cx={half} cy={half} r={r} fill="url(#mayaGrad)" />
      {/* Eyes */}
      <circle cx={half - r * 0.3} cy={half - r * 0.1} r={r * 0.08} fill="#fff" />
      <circle cx={half + r * 0.3} cy={half - r * 0.1} r={r * 0.08} fill="#fff" />
      {/* Smile */}
      <path
        d={`M ${half - r * 0.2} ${half + r * 0.2} Q ${half} ${half + r * 0.45} ${half + r * 0.2} ${half + r * 0.2}`}
        fill="none"
        stroke="#fff"
        strokeWidth={r * 0.06}
        strokeLinecap="round"
      />
    </svg>
  );
}
