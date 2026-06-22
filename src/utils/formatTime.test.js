import { describe, expect, it } from 'vitest';
import { formatDuration, formatStopwatch, parseDuration } from './formatTime';

describe('formatDuration', () => {
  it('formats zero', () => {
    expect(formatDuration(0)).toBe('00:00:00');
  });

  it('pads hours, minutes and seconds', () => {
    expect(formatDuration(59)).toBe('00:00:59');
    expect(formatDuration(60)).toBe('00:01:00');
    expect(formatDuration(3661)).toBe('01:01:01');
    expect(formatDuration(86399)).toBe('23:59:59');
  });
});

describe('formatStopwatch', () => {
  it('formats zero', () => {
    expect(formatStopwatch(0)).toBe('00:00:00.00');
  });

  it('truncates milliseconds to centiseconds', () => {
    expect(formatStopwatch(999)).toBe('00:00:00.99');
    expect(formatStopwatch(61239)).toBe('00:01:01.23');
    expect(formatStopwatch(3600000)).toBe('01:00:00.00');
  });
});

describe('parseDuration', () => {
  it('treats a bare number as minutes', () => {
    expect(parseDuration('25')).toBe(25 * 60);
    expect(parseDuration(' 5 ')).toBe(5 * 60);
  });

  it('parses unit strings', () => {
    expect(parseDuration('90s')).toBe(90);
    expect(parseDuration('5m')).toBe(300);
    expect(parseDuration('1h')).toBe(3600);
    expect(parseDuration('1h30m')).toBe(5400);
    expect(parseDuration('1h 30m 10s')).toBe(5410);
  });

  it('clamps to the timer maximum and rejects nonsense', () => {
    expect(parseDuration('999h')).toBe(99 * 3600 + 59 * 60 + 59);
    expect(parseDuration('banana')).toBeNull();
    expect(parseDuration('')).toBeNull();
    expect(parseDuration(null)).toBeNull();
  });
});
