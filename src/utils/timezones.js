// Time-zone helpers and the enriched option list used by the World Clock picker.
// Extracted from the component so the "every zone is sane" sweep can be a test.
import { TZ_COUNTRY } from './tzCountries';

// Used only where Intl.supportedValuesOf is unavailable (older Safari / some
// webviews) — a real list keeps the picker usable instead of nearly empty.
const FALLBACK_TIME_ZONES = [
  'Asia/Singapore', 'America/New_York', 'America/Los_Angeles', 'America/Chicago',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
  'Asia/Kolkata', 'Asia/Dubai', 'Australia/Sydney', 'Pacific/Auckland', 'UTC',
];

export const timeZoneNames =
  typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('timeZone')
    : FALLBACK_TIME_ZONES;

export const cityFromTimeZone = (timeZone) => timeZone.split('/').pop().replaceAll('_', ' ');

// A zone's current UTC offset in minutes, derived by comparing its wall-clock
// reading of `date` against UTC. Avoids the newer `shortOffset` formatter, so it
// works wherever Intl time zones do.
export function getOffsetMinutes(timeZone, date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  })
    .formatToParts(date)
    .reduce((acc, part) => ((acc[part.type] = part.value), acc), {});
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );
  return Math.round((asUTC - date.getTime()) / 60000);
}

export function formatOffset(minutes) {
  if (minutes === 0) return 'UTC';
  const sign = minutes > 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}

const regionNames =
  typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;

// Country name for a zone (e.g. Asia/Kuala_Lumpur → "Malaysia"), or '' if the
// zone isn't mapped or DisplayNames is unavailable.
export function countryNameFor(timeZone) {
  const code = TZ_COUNTRY[timeZone];
  if (!code || !regionNames) return '';
  try {
    return regionNames.of(code) ?? '';
  } catch {
    return '';
  }
}

// Hand-tuned extras DisplayNames won't give us: abbreviations and informal
// names people actually type. Country names themselves come from countryNameFor.
const SEARCH_HINTS = {
  'America/New_York': 'usa nyc eastern et est',
  'America/Los_Angeles': 'usa la california pacific pt pst',
  'America/Chicago': 'usa central ct cst',
  'America/Denver': 'usa mountain mt mst',
  'America/Phoenix': 'usa arizona',
  'Pacific/Honolulu': 'usa hawaii hst',
  'Europe/London': 'uk britain england gmt bst',
  'Europe/Amsterdam': 'holland',
  'Asia/Kolkata': 'ist delhi mumbai bangalore bengaluru',
  'Asia/Calcutta': 'ist delhi mumbai bangalore bengaluru',
  'Asia/Dubai': 'uae',
  'Asia/Shanghai': 'beijing prc',
  'Asia/Saigon': 'ho chi minh',
  'Asia/Rangoon': 'burma',
  'Australia/Sydney': 'aest nsw',
  // Countries DisplayNames now returns under a renamed/official form, mapped
  // back to the name people still type.
  'Europe/Istanbul': 'turkey',
  'Europe/Prague': 'czech republic',
  'Africa/Abidjan': 'ivory coast',
  'Atlantic/Cape_Verde': 'cape verde',
  'Africa/Mbabane': 'swaziland',
};

// Stable, pre-grouped option list. `search` bakes in everything we want to match
// (city, region, raw id, country name, hints) so the filter is a cheap lookup.
// Sorted by region then city so groupBy never produces duplicate headers.
export const TZ_OPTIONS = [...timeZoneNames]
  .map((timeZone) => {
    const label = cityFromTimeZone(timeZone);
    const region = timeZone.split('/')[0];
    const country = countryNameFor(timeZone);
    const search = `${label} ${region} ${timeZone} ${country} ${SEARCH_HINTS[timeZone] ?? ''}`
      .toLowerCase()
      .replace(/[_/]/g, ' ');
    return { timeZone, label, region, country, search };
  })
  .sort((a, b) => a.region.localeCompare(b.region) || a.label.localeCompare(b.label));
