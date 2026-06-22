// Formats a duration in whole seconds as HH:MM:SS.
export function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// Formats a duration in milliseconds as HH:MM:SS.cc (centiseconds).
export function formatStopwatch(timeInMs) {
  const centiseconds = Math.floor((timeInMs % 1000) / 10).toString().padStart(2, '0');
  return `${formatDuration(Math.floor(timeInMs / 1000))}.${centiseconds}`;
}

// Max the Timer accepts: 99h 59m 59s.
const MAX_TIMER_SECONDS = 99 * 3600 + 59 * 60 + 59;

// Parses a friendly duration string into whole seconds, or null if it makes no
// sense. Accepts "25" (bare number → minutes), "5m", "90s", "1h30m", "1h 30m 10s".
export function parseDuration(input) {
  if (typeof input !== 'string') return null;
  const s = input.trim().toLowerCase();
  if (!s) return null;
  if (/^\d+$/.test(s)) return Math.min(MAX_TIMER_SECONDS, parseInt(s, 10) * 60);

  let total = 0;
  let matched = false;
  const unit = /(\d+)\s*(h|m|s)/g;
  let part;
  while ((part = unit.exec(s)) !== null) {
    matched = true;
    const n = parseInt(part[1], 10);
    total += part[2] === 'h' ? n * 3600 : part[2] === 'm' ? n * 60 : n;
  }
  if (!matched) return null;
  return Math.min(MAX_TIMER_SECONDS, total);
}
