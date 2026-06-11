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
