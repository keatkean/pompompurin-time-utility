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

// Coarse "opens in" countdown for the capsule shelf: "23d 4h", "3h 12m", "2m".
// Never "0m" — while something is still locked, at least a minute remains as
// far as a 30s-tick display can honestly claim.
export function formatCountdown(ms) {
  const mins = Math.max(1, Math.ceil(ms / 60000));
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
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
