// Chinese lunar calendar (万年历) info — derived entirely from Intl's built-in
// `chinese` calendar, so there's no lunar-conversion library or data table to
// keep current. We only add the bits Intl doesn't give: zodiac, and festivals
// (which are fixed lunar/solar dates, so a small lookup is enough).

const LUNAR_MONTHS = [
  '正月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '冬月', '腊月',
];

const LUNAR_DAYS = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
];

// Earthly branch (the 2nd char of the 干支 year) → [zodiac 中文, English].
const BRANCH_ZODIAC = {
  '子': ['鼠', 'Rat'], '丑': ['牛', 'Ox'], '寅': ['虎', 'Tiger'], '卯': ['兔', 'Rabbit'],
  '辰': ['龙', 'Dragon'], '巳': ['蛇', 'Snake'], '午': ['马', 'Horse'], '未': ['羊', 'Goat'],
  '申': ['猴', 'Monkey'], '酉': ['鸡', 'Rooster'], '戌': ['狗', 'Dog'], '亥': ['猪', 'Pig'],
};

// Traditional festivals at fixed lunar month-day. 除夕 (New Year's Eve) is the
// last day of the year, handled separately since its date varies (29th or 30th).
const LUNAR_FESTIVALS = {
  '1-1': ['春节', 'Spring Festival'],
  '1-15': ['元宵节', 'Lantern Festival'],
  '2-2': ['龙抬头', 'Dragon Head Festival'],
  '5-5': ['端午节', 'Dragon Boat Festival'],
  '7-7': ['七夕', 'Qixi Festival'],
  '7-15': ['中元节', 'Ghost Festival'],
  '8-15': ['中秋节', 'Mid-Autumn Festival'],
  '9-9': ['重阳节', 'Double Ninth Festival'],
  '12-8': ['腊八节', 'Laba Festival'],
  '12-23': ['小年', 'Little New Year'],
};

// Fixed Gregorian-date holidays.
const SOLAR_FESTIVALS = {
  '1-1': ['元旦', "New Year's Day"],
  '2-14': ['情人节', "Valentine's Day"],
  '3-8': ['妇女节', "Women's Day"],
  '4-1': ['愚人节', "April Fools' Day"],
  '5-1': ['劳动节', 'Labour Day'],
  '6-1': ['儿童节', "Children's Day"],
  '9-10': ['教师节', "Teachers' Day"],
  '10-1': ['国庆节', 'National Day'],
  '12-25': ['圣诞节', 'Christmas'],
};

// --- 24 solar terms (节气) ---
// Intl doesn't provide these — they're astronomical: the Sun reaching each 15°
// of apparent ecliptic longitude. Computed with Meeus's low-precision solar
// formula (accurate to well within a day, which is all a date needs). Indexed
// by longitude/15, starting at 0° = 春分.
const SOLAR_TERMS = [
  ['春分', 'Spring Equinox'], ['清明', 'Pure Brightness'], ['谷雨', 'Grain Rain'],
  ['立夏', 'Start of Summer'], ['小满', 'Grain Buds'], ['芒种', 'Grain in Ear'],
  ['夏至', 'Summer Solstice'], ['小暑', 'Minor Heat'], ['大暑', 'Major Heat'],
  ['立秋', 'Start of Autumn'], ['处暑', 'End of Heat'], ['白露', 'White Dew'],
  ['秋分', 'Autumn Equinox'], ['寒露', 'Cold Dew'], ['霜降', "Frost's Descent"],
  ['立冬', 'Start of Winter'], ['小雪', 'Minor Snow'], ['大雪', 'Major Snow'],
  ['冬至', 'Winter Solstice'], ['小寒', 'Minor Cold'], ['大寒', 'Major Cold'],
  ['立春', 'Start of Spring'], ['雨水', 'Rain Water'], ['惊蛰', 'Insects Awaken'],
];

const DEG = Math.PI / 180;

// Sun's apparent ecliptic longitude in degrees (0–360) at an instant (ms epoch).
function sunLongitude(ms) {
  const JD = ms / 86400000 + 2440587.5;
  const T = (JD - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * DEG;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M) +
    0.000289 * Math.sin(3 * M);
  const omega = (125.04 - 1934.136 * T) * DEG;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega);
  return ((lambda % 360) + 360) % 360;
}

// The solar term that falls on a Gregorian day (China time), or undefined. A
// term occurs the moment the Sun crosses a 15° boundary; the Sun moves < 1.5°
// per day, so at most one boundary lands in any single day.
export function solarTermOn(year, month, day) {
  const startCST = Date.UTC(year, month - 1, day) - 8 * 3600000; // 00:00 China time, in UTC
  const f0 = sunLongitude(startCST) / 15;
  let f1 = sunLongitude(startCST + 86400000) / 15;
  if (f1 < f0) f1 += 24; // longitude wrapped past 360°
  if (Math.floor(f1) > Math.floor(f0)) return SOLAR_TERMS[(Math.floor(f0) + 1) % 24];
  return undefined;
}

// Formatter construction is by far the most expensive Intl operation, and the
// calendar calls chineseParts() for 42 cells per month view (plus the full-moon
// scan) — so the formatters are built once and reused, not per call.
const CHINESE_PARTS_FMT = new Intl.DateTimeFormat('en-u-ca-chinese', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});
const CHINESE_FULL_ZH_FMT = new Intl.DateTimeFormat('zh-u-ca-chinese', { dateStyle: 'full' });

// Raw chinese-calendar fields for an instant. Pass a Date at noon UTC of the
// target Gregorian day (lunar↔Gregorian is a fixed mapping, so the time of day
// only needs to be clear of the China-midnight boundary).
function chineseParts(date) {
  try {
    const parts = CHINESE_PARTS_FMT.formatToParts(date);
    const get = (type) => parts.find((p) => p.type === type)?.value ?? '';

    const monthRaw = get('month'); // e.g. "6" or "6bis" for a leap month
    const isLeap = monthRaw.includes('bis');
    const monthNum = parseInt(monthRaw, 10) || 1;
    const day = parseInt(get('day'), 10) || 1;
    const relatedYear = get('relatedYear') || String(date.getUTCFullYear());

    const zhFull = CHINESE_FULL_ZH_FMT.format(date);
    const ganzhi = zhFull.match(/(.{2})年/)?.[1] ?? '甲子';

    return { monthNum, isLeap, day, ganzhi, branch: ganzhi[1] ?? '子', relatedYear };
  } catch {
    return { monthNum: 1, isLeap: false, day: 1, ganzhi: '甲子', branch: '子', relatedYear: String(date.getUTCFullYear()) };
  }
}

// Build a noon-UTC Date for a Gregorian y/m/d (month is 1-based here).
export function utcNoon(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day, 12));
}

// --- Moon phase (free from the lunar date) ---
// The 农历 day IS essentially the Moon's age: 初一 ≈ new moon, 十五 ≈ full moon.
// So a cute, correct moon phase falls straight out of the data we already have.
export function moonPhase(date) {
  const { day } = chineseParts(date);
  let zh, en, emoji;
  if (day === 1) [zh, en, emoji] = ['新月', 'New Moon', '🌑'];
  else if (day <= 6) [zh, en, emoji] = ['蛾眉月', 'Waxing Crescent', '🌒'];
  else if (day <= 9) [zh, en, emoji] = ['上弦月', 'First Quarter', '🌓'];
  else if (day <= 14) [zh, en, emoji] = ['盈凸月', 'Waxing Gibbous', '🌔'];
  else if (day <= 16) [zh, en, emoji] = ['满月', 'Full Moon', '🌕'];
  else if (day <= 22) [zh, en, emoji] = ['亏凸月', 'Waning Gibbous', '🌖'];
  else if (day <= 24) [zh, en, emoji] = ['下弦月', 'Last Quarter', '🌗'];
  else [zh, en, emoji] = ['残月', 'Waning Crescent', '🌘'];
  return { day, zh, en, emoji, isFull: day === 15 || day === 16 };
}

// Next Gregorian day (as a utcNoon Date) on which a lunar month-day falls, on
// or after `date` — e.g. '1-1' → next 春节, '8-15' → next 中秋节. Leap months
// don't carry festivals, so they're skipped. A lunar date recurs within ~13
// months; 400 days of scanning always finds it.
export function nextLunarFestival(monthDayKey, date) {
  const [festMonth, festDay] = monthDayKey.split('-').map(Number);
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  for (let i = 0; i <= 400; i += 1) {
    const probe = utcNoon(y, m, d + i); // Date.UTC normalizes day overflow
    const { monthNum, day, isLeap } = chineseParts(probe);
    if (!isLeap && monthNum === festMonth && day === festDay) return probe;
  }
  return null;
}

// Days until the next 农历十五 (full moon) on or after `date` (a utcNoon Date).
// Returns { date, daysUntil } or null. daysUntil 0 means tonight.
export function nextFullMoon(date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  for (let i = 0; i <= 40; i += 1) {
    const probe = utcNoon(y, m, d + i); // Date.UTC normalizes day overflow
    if (chineseParts(probe).day === 15) return { date: probe, daysUntil: i };
  }
  return null;
}

// Full 万年历 info for the Gregorian day represented by `date` (use utcNoon()).
export function lunarInfo(date) {
  const { monthNum, isLeap, day, ganzhi, branch, relatedYear } = chineseParts(date);
  const [zodiacZh, zodiacEn] = BRANCH_ZODIAC[branch] ?? ['', ''];

  let festival = !isLeap ? LUNAR_FESTIVALS[`${monthNum}-${day}`] : undefined;
  // 除夕: a 12th-month day whose next day rolls over to 正月初一.
  if (!festival && monthNum === 12 && day >= 29) {
    const next = chineseParts(new Date(date.getTime() + 86400000));
    if (next.monthNum === 1 && next.day === 1) festival = ['除夕', "New Year's Eve"];
  }
  const solarFestival = SOLAR_FESTIVALS[`${date.getUTCMonth() + 1}-${date.getUTCDate()}`];
  const solarTerm = solarTermOn(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());

  return {
    monthName: (isLeap ? '闰' : '') + (LUNAR_MONTHS[monthNum - 1] ?? `${monthNum}月`),
    dayName: LUNAR_DAYS[day - 1] ?? `${day}`,
    isFirstOfMonth: day === 1,
    ganzhi,
    zodiacZh,
    zodiacEn,
    relatedYear,
    festival, // [zh, en] | undefined — traditional festival (takes priority)
    solarTerm, // [zh, en] | undefined — 24 节气
    solarFestival, // [zh, en] | undefined — fixed Gregorian holiday
  };
}
