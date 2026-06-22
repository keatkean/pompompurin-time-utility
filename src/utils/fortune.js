// A playful, cute take on the 黄历 宜/忌 ("do / avoid") almanac — deterministic
// per calendar day so everyone sharing a date sees the same fortune, but with no
// superstition and no data dependency. Bilingual 中英.

const LUCKY = [
  ['吃布丁', 'Eat pudding'],
  ['小睡', 'Take a nap'],
  ['专注工作', 'Deep focus'],
  ['散步', 'Go for a walk'],
  ['喝杯茶', 'Drink tea'],
  ['对人微笑', 'Smile at someone'],
  ['整理桌面', 'Tidy your desk'],
  ['联系老友', 'Call a friend'],
  ['早点睡', 'Sleep early'],
  ['晒太阳', 'Soak up the sun'],
  ['学新东西', 'Learn something new'],
  ['深呼吸', 'Breathe deeply'],
];

const AVOID = [
  ['拖延', 'Procrastinating'],
  ['熬夜', 'Staying up late'],
  ['暴饮暴食', 'Overeating'],
  ['过度焦虑', 'Worrying too much'],
  ['久坐不动', 'Sitting all day'],
  ['乱花钱', 'Overspending'],
  ['跳过早餐', 'Skipping breakfast'],
  ['和人争吵', 'Picking fights'],
];

// Stable hash of the calendar day (uses the date's UTC y/m/d, matching how the
// rest of the calendar builds days via utcNoon).
function hashDay(date) {
  const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}

export function dailyFortune(date) {
  const h = hashDay(date);
  return {
    lucky: LUCKY[h % LUCKY.length],
    avoid: AVOID[Math.floor(h / LUCKY.length) % AVOID.length],
  };
}
