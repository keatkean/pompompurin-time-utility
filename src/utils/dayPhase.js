// Day/night phase helpers for the World Clock cards.

export function getLocalHour(date, timeZone) {
  return Number(
    new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', hourCycle: 'h23' }).format(date)
  );
}

export function dayPhase(hour) {
  if (hour >= 8 && hour < 18) return 'day';
  if (hour >= 18 && hour < 22) return 'dusk';
  if (hour >= 6 && hour < 8) return 'dawn';
  return 'night';
}

// 8am–10pm local time counts as a friendly hour to call someone.
export function isPoliteHour(hour) {
  return hour >= 8 && hour < 22;
}

export const PHASE_STYLES = {
  day: { bg: '#FFF8DC', text: '#6B4F2B', accent: '#A67C52', icon: '☀️', closeBg: 'rgba(166, 124, 82, 0.1)' },
  dawn: { bg: '#FFE9CF', text: '#6B4F2B', accent: '#A67C52', icon: '🌅', closeBg: 'rgba(166, 124, 82, 0.1)' },
  dusk: { bg: '#F6D7C3', text: '#5B4222', accent: '#8A5A3C', icon: '🌇', closeBg: 'rgba(138, 90, 60, 0.12)' },
  night: { bg: '#564F6F', text: '#FFF3D6', accent: '#FFE9A8', icon: '🌙', closeBg: 'rgba(255, 243, 214, 0.18)' },
};
