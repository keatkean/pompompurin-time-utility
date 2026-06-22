import { describe, expect, it } from 'vitest';
import { dailyFortune } from './fortune';
import { utcNoon } from './lunar';

describe('dailyFortune', () => {
  it('returns a bilingual lucky/avoid pair', () => {
    const f = dailyFortune(utcNoon(2026, 6, 18));
    expect(f.lucky).toHaveLength(2);
    expect(f.avoid).toHaveLength(2);
    expect(typeof f.lucky[0]).toBe('string');
    expect(typeof f.lucky[1]).toBe('string');
  });

  it('is deterministic for the same day', () => {
    expect(dailyFortune(utcNoon(2026, 6, 18))).toEqual(dailyFortune(utcNoon(2026, 6, 18)));
  });

  it('varies across days', () => {
    const week = [18, 19, 20, 21, 22, 23, 24].map((d) => dailyFortune(utcNoon(2026, 6, d)).lucky[1]);
    expect(new Set(week).size).toBeGreaterThan(1);
  });
});
