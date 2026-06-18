import { useId } from 'react';

// Pudding flavors — body / stroke / caramel-cap color triples. `classic` is the
// original Pompompurin flan; the rest are unlocked as Pomodoro reward stickers.
const PUDDING_FLAVORS = {
  classic: { body: '#FBE7A2', stroke: '#C99B5F', cap: '#A67C52' },
  golden: { body: '#F4C95D', stroke: '#B8860B', cap: '#8A5A2B' },
  matcha: { body: '#CFE8A8', stroke: '#7C9A4E', cap: '#5E7A33' },
  strawberry: { body: '#FBD0DA', stroke: '#E59AAE', cap: '#E26D8A' },
  chocolate: { body: '#C9A27A', stroke: '#8A5A2B', cap: '#5B3A1E' },
};

// Pompompurin-style flan. `fraction` (0..1) controls how much pudding is
// left on the plate — the body is clipped from the top down as it gets
// "eaten". `sleeping` swaps the eyes for closed lids. `flavor` recolors the
// flan; `golden` is kept as a shorthand for the golden reward sticker and
// takes precedence over `flavor`.
const Pudding = ({
  fraction = 1,
  size = 120,
  sleeping = false,
  golden = false,
  flavor = 'classic',
  className,
}) => {
  const f = Math.max(0, Math.min(1, fraction));
  const clipId = useId().replaceAll(':', '');
  const bodyTop = 30;
  const bodyBottom = 92;
  const clipY = bodyTop + (1 - f) * (bodyBottom - bodyTop);
  const palette = PUDDING_FLAVORS[golden ? 'golden' : flavor] ?? PUDDING_FLAVORS.classic;
  const bodyFill = palette.body;
  const bodyStroke = palette.stroke;
  const capFill = palette.cap;

  return (
    <svg
      width={size}
      height={size * (104 / 120)}
      viewBox="0 0 120 104"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Pudding"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y={clipY} width="120" height={bodyBottom - clipY + 4} />
        </clipPath>
      </defs>
      {/* plate */}
      <ellipse cx="60" cy="92" rx="54" ry="9" fill="#FFD1DC" stroke="#E8A8B8" strokeWidth="2" />
      <g clipPath={`url(#${clipId})`}>
        {/* flan body */}
        <path
          d="M 26 88 C 21 62 25 38 60 36 C 95 38 99 62 94 88 C 80 93 40 93 26 88 Z"
          fill={bodyFill}
          stroke={bodyStroke}
          strokeWidth="2.5"
        />
        {/* caramel cap with drips */}
        <path
          d="M 30 56 C 30 41 44 34 60 34 C 76 34 90 41 90 56 C 90 62 83 64 77 59 C 72 66 65 61 60 65 C 55 61 48 66 43 59 C 37 64 30 62 30 56 Z"
          fill={capFill}
        />
        {/* face */}
        {sleeping ? (
          <>
            <path d="M 43 69 Q 47 72 51 69" stroke="#5B4222" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 69 69 Q 73 72 77 69" stroke="#5B4222" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 57 76 Q 60 78 63 76" stroke="#5B4222" strokeWidth="2" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="47" cy="69" rx="2.6" ry="3.4" fill="#5B4222" />
            <ellipse cx="73" cy="69" rx="2.6" ry="3.4" fill="#5B4222" />
            <path d="M 55 75 Q 60 79 65 75" stroke="#5B4222" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          </>
        )}
      </g>
    </svg>
  );
};

export default Pudding;
