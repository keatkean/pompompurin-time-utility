import { describe, expect, it } from 'vitest';
import { lunarInfo, utcNoon } from './lunar';

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
});
