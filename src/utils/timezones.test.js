import { describe, expect, it } from 'vitest';
import {
  timeZoneNames,
  cityFromTimeZone,
  getOffsetMinutes,
  formatOffset,
  countryNameFor,
  TZ_OPTIONS,
} from './timezones';

const findBySearch = (query) => TZ_OPTIONS.filter((o) => o.search.includes(query.toLowerCase()));

describe('timezones — all-zone sanity', () => {
  it('produces a clean label, sane offset, and working time for every supported zone', () => {
    const now = new Date('2026-06-18T12:00:00Z');
    const problems = [];
    for (const tz of timeZoneNames) {
      const label = cityFromTimeZone(tz);
      if (!label || /[_/]/.test(label)) problems.push(`label ${tz} -> "${label}"`);

      const offset = getOffsetMinutes(tz, now);
      // Real-world offsets run from UTC-12 (Baker Island) to UTC+14 (Kiritimati).
      if (!Number.isFinite(offset) || offset < -12 * 60 || offset > 14 * 60) {
        problems.push(`offset ${tz} -> ${offset}`);
      }

      expect(() =>
        now.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' })
      ).not.toThrow();
    }
    expect(problems).toEqual([]);
  });

  it('maps every supported zone to a country name', () => {
    const unmapped = timeZoneNames.filter((tz) => !countryNameFor(tz));
    expect(unmapped).toEqual([]);
  });

  it('finds zones by country name that the IANA id alone would miss', () => {
    // None of these country names appear in the zone id or city — they only
    // resolve through the country map + Intl.DisplayNames.
    for (const country of [
      'malaysia', 'thailand', 'indonesia', 'philippines', 'south korea', 'spain',
      'italy', 'sweden', 'switzerland', 'greece', 'turkey', 'saudi arabia', 'vietnam',
    ]) {
      expect(findBySearch(country).length, `no zone for "${country}"`).toBeGreaterThan(0);
    }
  });

  it('formats offsets in UTC±H[:MM] form', () => {
    expect(formatOffset(0)).toBe('UTC');
    expect(formatOffset(8 * 60)).toBe('UTC+8');
    expect(formatOffset(5 * 60 + 30)).toBe('UTC+5:30');
    expect(formatOffset(-5 * 60)).toBe('UTC-5');
  });
});
