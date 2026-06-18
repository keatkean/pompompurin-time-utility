// A one-shot sprinkle shower for celebrations (timer done, focus complete).
//
// Pure CSS: each sprinkle gets its own direction/rotation via inline CSS vars
// and animates once with `forwards`, so there is no JS timer to clean up. Remount
// it with a changing `key` to replay the burst. The overlay is pointer-events:
// none so it never blocks the buttons underneath, and the whole thing is hidden
// under prefers-reduced-motion (see index.css).
const COLORS = ['#FFD1DC', '#A67C52', '#FBE7A2', '#8BC34A', '#F4C95D', '#E26D8A'];
const COUNT = 14;

const Sprinkles = ({ count = COUNT }) => {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      {Array.from({ length: count }, (_, i) => {
        // Fan the sprinkles out evenly, then let each fall a little. The small
        // per-index jitter keeps the spray from looking like a perfect circle.
        const angle = (i / count) * 2 * Math.PI;
        const distance = 46 + (i % 4) * 14;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance + 36; // bias downward = "falling"
        const rot = (i % 2 === 0 ? 1 : -1) * (180 + (i % 3) * 90);
        return (
          <span
            key={i}
            className="sprinkle"
            style={{
              background: COLORS[i % COLORS.length],
              animationDelay: `${(i % 5) * 0.04}s`,
              '--tx': `${tx}px`,
              '--ty': `${ty}px`,
              '--rot': `${rot}deg`,
            }}
          />
        );
      })}
    </div>
  );
};

export default Sprinkles;
