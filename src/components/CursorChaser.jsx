import { useEffect, useRef, useState } from 'react';

// Pompompurin chases the pudding cursor around the page (the cursor itself is
// a pudding — his favorite snack; see the cursor rule in index.css).
//
// Purely decorative: pointer-events none, aria-hidden, and it renders nothing
// until the mouse first moves. The chase runs on requestAnimationFrame with
// the position kept in refs and written straight to style.transform — NEVER
// setState per frame (60 re-renders/second would drag the whole app). State is
// only used for the rare transitions: first appearance and sleep/wake.

const SIZE = 208;
const EASE = 0.085; // fraction of the remaining distance covered per frame
const IDLE_SLEEP_MS = 4000;
// Trail a little below-right of the cursor so the pudding stays visible ahead
// of him — a chase, not a catch.
const OFFSET = { x: 88, y: 104 };

// Decorative motion is skipped for reduced-motion users, and there is nothing
// to chase without a mouse (coarse/touch pointers). Checked once per mount —
// these effectively never change mid-session.
function chaseWorthy() {
  if (typeof window.matchMedia !== 'function') return false;
  return (
    window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

const CursorChaser = ({ enabled = true }) => {
  const [eligible] = useState(chaseWorthy);
  const [chasing, setChasing] = useState(false); // becomes true on first mousemove
  const [sleeping, setSleeping] = useState(false);
  const boxRef = useRef(null);
  const imgRef = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const lastMove = useRef(0);
  const facing = useRef(1);

  useEffect(() => {
    if (!enabled || !eligible) return;

    let raf = 0;
    let started = false;

    const onMove = (e) => {
      target.current = { x: e.clientX, y: e.clientY };
      lastMove.current = Date.now();
      if (!started) {
        started = true;
        // Enter from just off-screen below the cursor instead of teleporting.
        pos.current = { x: e.clientX, y: window.innerHeight + SIZE };
        setChasing(true);
      }
      setSleeping(false);
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!started || !boxRef.current) return;
      const dx = target.current.x + OFFSET.x - pos.current.x;
      const dy = target.current.y + OFFSET.y - pos.current.y;
      pos.current.x += dx * EASE;
      pos.current.y += dy * EASE;
      boxRef.current.style.transform = `translate3d(${pos.current.x - SIZE / 2}px, ${pos.current.y - SIZE / 2}px, 0)`;
      // Face the direction of travel, with a deadzone so he doesn't twitch.
      if (Math.abs(dx) > 6) facing.current = dx > 0 ? 1 : -1;
      if (imgRef.current) imgRef.current.style.transform = `scaleX(${facing.current})`;
      if (Date.now() - lastMove.current > IDLE_SLEEP_MS) setSleeping(true);
    };

    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
      setChasing(false);
      setSleeping(false);
    };
  }, [enabled, eligible]);

  if (!enabled || !eligible || !chasing) return null;

  return (
    <div
      ref={boxRef}
      aria-hidden="true"
      data-testid="cursor-chaser"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: SIZE,
        height: SIZE,
        pointerEvents: 'none',
        zIndex: 2000,
        willChange: 'transform',
      }}
    >
      <img
        ref={imgRef}
        src={`${import.meta.env.BASE_URL}pompompurin.svg`}
        alt=""
        width={SIZE}
        height={SIZE}
        draggable={false}
        style={{ display: 'block', opacity: sleeping ? 0.75 : 1, transition: 'opacity 0.6s' }}
      />
      {sleeping && (
        <span
          className="chaser-zzz"
          style={{ position: 'absolute', top: 25, right: 30, fontSize: 32 }}
        >
          💤
        </span>
      )}
    </div>
  );
};

export default CursorChaser;
