import { describe, expect, it } from 'vitest';
import { lunarInfo, utcNoon, solarTermOn, moonPhase, nextFullMoon, nextLunarFestival } from './lunar';

describe('lunar (万年历)', () => {
  it('identifies Chinese New Year 2026 (lunar 正月初一, 丙午 Year of the Horse)', () => {
    const info = lunarInfo(utcNoon(2026, 2, 17));
    expect(info.monthName).toBe('正月');
    expect(info.dayName).toBe('初一');
    expect(info.ganzhi).toBe('丙午');
    expect(info.zodiacZh).toBe('马');
    expect(info.zodiacEn).toBe('Horse');
    expect(info.festival).toEqual(['春节', 'Spring Festival']);
  });

  it("detects 除夕 (New Year's Eve) the day before", () => {
    const info = lunarInfo(utcNoon(2026, 2, 16));
    expect(info.festival).toEqual(['除夕', "New Year's Eve"]);
  });

  it('identifies Mid-Autumn 2026 (lunar 八月十五)', () => {
    const info = lunarInfo(utcNoon(2026, 9, 25));
    expect(info.monthName).toBe('八月');
    expect(info.dayName).toBe('十五');
    expect(info.festival).toEqual(['中秋节', 'Mid-Autumn Festival']);
  });

  it('handles a leap month (闰六月 in 2025)', () => {
    const info = lunarInfo(utcNoon(2025, 8, 1));
    expect(info.monthName).toBe('闰六月');
    expect(info.dayName).toBe('初八');
  });

  it('marks the first day of a lunar month for the grid', () => {
    expect(lunarInfo(utcNoon(2026, 2, 17)).isFirstOfMonth).toBe(true);
    expect(lunarInfo(utcNoon(2026, 2, 18)).isFirstOfMonth).toBe(false);
  });

  it('surfaces fixed Gregorian holidays', () => {
    expect(lunarInfo(utcNoon(2026, 10, 1)).solarFestival).toEqual(['国庆节', 'National Day']);
    expect(lunarInfo(utcNoon(2026, 1, 1)).solarFestival).toEqual(['元旦', "New Year's Day"]);
  });

  it('computes the 24 solar terms (节气) on their exact 2026 dates', () => {
    // Cross-checked against the official 2026 almanac (Purple Mountain Obs.).
    expect(solarTermOn(2026, 2, 4)).toEqual(['立春', 'Start of Spring']);
    expect(solarTermOn(2026, 3, 20)).toEqual(['春分', 'Spring Equinox']);
    expect(solarTermOn(2026, 4, 5)).toEqual(['清明', 'Pure Brightness']);
    expect(solarTermOn(2026, 6, 21)).toEqual(['夏至', 'Summer Solstice']);
    expect(solarTermOn(2026, 9, 23)).toEqual(['秋分', 'Autumn Equinox']);
    expect(solarTermOn(2026, 12, 22)).toEqual(['冬至', 'Winter Solstice']);
  });

  it('returns no solar term on an ordinary day', () => {
    expect(solarTermOn(2026, 6, 18)).toBeUndefined();
    expect(lunarInfo(utcNoon(2026, 6, 21)).solarTerm).toEqual(['夏至', 'Summer Solstice']);
  });

  it('derives the moon phase from the lunar day', () => {
    // 正月初一 = new moon, 八月十五 (Mid-Autumn) = full moon.
    const newMoon = moonPhase(utcNoon(2026, 2, 17));
    expect(newMoon.zh).toBe('新月');
    expect(newMoon.isFull).toBe(false);

    const full = moonPhase(utcNoon(2026, 9, 25));
    expect(full.zh).toBe('满月');
    expect(full.isFull).toBe(true);
    expect(full.emoji).toBe('🌕');
  });

  it('counts down to the next full moon', () => {
    // Mid-Autumn 2026 (八月十五) is a full moon, so from that day it is 0.
    expect(nextFullMoon(utcNoon(2026, 9, 25)).daysUntil).toBe(0);
    // A few days earlier, the next 十五 is that same Mid-Autumn day.
    const ahead = nextFullMoon(utcNoon(2026, 9, 20));
    expect(ahead.daysUntil).toBe(5);
  });

  it('finds the next occurrence of a lunar festival', () => {
    // 春节 2026 is Feb 17 (asserted above); scanning from mid-2025 lands there.
    const cny = nextLunarFestival('1-1', utcNoon(2025, 7, 1));
    expect([cny.getUTCFullYear(), cny.getUTCMonth() + 1, cny.getUTCDate()]).toEqual([2026, 2, 17]);
    expect(lunarInfo(cny).festival).toEqual(['春节', 'Spring Festival']);

    // Mid-Autumn 2026 is Sep 25; scanning from the day itself returns it.
    const midAutumn = nextLunarFestival('8-15', utcNoon(2026, 9, 25));
    expect([midAutumn.getUTCFullYear(), midAutumn.getUTCMonth() + 1, midAutumn.getUTCDate()]).toEqual([2026, 9, 25]);

    // Scanning from the day after finds next year's, not a stale hit.
    const next = nextLunarFestival('8-15', utcNoon(2026, 9, 26));
    expect(next.getUTCFullYear()).toBe(2027);
    expect(lunarInfo(next).festival).toEqual(['中秋节', 'Mid-Autumn Festival']);
  });
});
