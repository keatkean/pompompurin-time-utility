import { describe, expect, it } from 'vitest';
import { formatDuration, formatStopwatch } from './formatTime';

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
