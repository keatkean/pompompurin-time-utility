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

// Raw chinese-calendar fields for an instant. Pass a Date at noon UTC of the
// target Gregorian day (lunar↔Gregorian is a fixed mapping, so the time of day
// only needs to be clear of the China-midnight boundary).
function chineseParts(date) {
  const parts = new Intl.DateTimeFormat('en-u-ca-chinese', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '';

  const monthRaw = get('month'); // e.g. "6" or "6bis" for a leap month
  const isLeap = monthRaw.includes('bis');
  const monthNum = parseInt(monthRaw, 10);
  const day = parseInt(get('day'), 10);
  const relatedYear = get('relatedYear'); // Gregorian year the lunar year sits in

  // The 干支 (sexagenary year) is unambiguous in Chinese characters; the romanized
  // yearName collides (戊/午 both "wu"), so read it from the localized string.
  const zhFull = new Intl.DateTimeFormat('zh-u-ca-chinese', { dateStyle: 'full' }).format(date);
  const ganzhi = zhFull.match(/(.{2})年/)?.[1] ?? '';

  return { monthNum, isLeap, day, ganzhi, branch: ganzhi[1] ?? '', relatedYear };
}

// Build a noon-UTC Date for a Gregorian y/m/d (month is 1-based here).
export function utcNoon(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day, 12));
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

  return {
    monthName: (isLeap ? '闰' : '') + (LUNAR_MONTHS[monthNum - 1] ?? `${monthNum}月`),
    dayName: LUNAR_DAYS[day - 1] ?? `${day}`,
    isFirstOfMonth: day === 1,
    ganzhi,
    zodiacZh,
    zodiacEn,
    relatedYear,
    festival, // [zh, en] | undefined — traditional festival (takes priority)
    solarFestival, // [zh, en] | undefined — fixed Gregorian holiday
  };
}
