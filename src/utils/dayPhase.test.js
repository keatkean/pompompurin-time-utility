import { describe, expect, it } from 'vitest';
import { getLocalHour, dayPhase, isPoliteHour } from './dayPhase';

describe('dayPhase', () => {
  it('classifies hours into phases', () => {
    expect(dayPhase(0)).toBe('night');
    expect(dayPhase(5)).toBe('night');
    expect(dayPhase(6)).toBe('dawn');
    expect(dayPhase(7)).toBe('dawn');
    expect(dayPhase(8)).toBe('day');
    expect(dayPhase(17)).toBe('day');
    expect(dayPhase(18)).toBe('dusk');
    expect(dayPhase(21)).toBe('dusk');
    expect(dayPhase(22)).toBe('night');
    expect(dayPhase(23)).toBe('night');
  });
});

describe('isPoliteHour', () => {
  it('treats 8am–10pm as friendly calling hours', () => {
    expect(isPoliteHour(7)).toBe(false);
    expect(isPoliteHour(8)).toBe(true);
    expect(isPoliteHour(21)).toBe(true);
    expect(isPoliteHour(22)).toBe(false);
  });
});

describe('getLocalHour', () => {
  it('returns the local hour for a time zone', () => {
    const date = new Date('2026-06-11T04:00:00Z');
    expect(getLocalHour(date, 'Asia/Singapore')).toBe(12);
    expect(getLocalHour(date, 'Asia/Tokyo')).toBe(13);
    expect(getLocalHour(date, 'America/New_York')).toBe(0);
  });
});
