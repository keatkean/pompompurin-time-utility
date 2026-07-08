# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Pompompurin Time Utility — a Sanrio-themed single-page React PWA with five tabs:
World Clock, Calendar (Chinese lunar 万年历), Timer, Stopwatch, Pomodoro.
Deployed to GitHub Pages at base path `/pompompurin-time-utility/`.

Stack: React 19, MUI 7 (+ Emotion), Vite 7, vite-plugin-pwa, Vitest + React
Testing Library (jsdom). Deliberately dependency-light: **no router, no state
library, and no date/timezone/lunar library** — all calendar and timezone logic
is built on the browser's native `Intl` APIs. Don't add libraries for these.

## Commands

```sh
npm run dev        # dev server at http://localhost:5173/pompompurin-time-utility/
npm test           # vitest run (single pass)
npm run test:watch # vitest watch mode
npm run lint       # eslint .
npm run build      # vite build (PWA disabled in test mode)
```

CI (`.github/workflows/deploy.yml`) builds, tests, and deploys to GitHub Pages
on every push to `main`.

## Layout

- `src/App.jsx` — app shell: light/dark MUI theme from the `PALETTES` map,
  theme mode persisted to localStorage, five tabs. Tab panels are hidden with
  `display: none` (never unmounted) so timers keep running across tab switches.
- `src/components/` — one component per tab plus the SVG mascot pieces
  (`Pudding`, `Sprinkles`, `BreathingPudding`) and `ErrorBoundary` (wraps the
  tab content in App so one render error can't blank the app). WorldClock and
  Calendar are the largest and share the zone list (see cross-component sync
  below).
- `src/utils/` — pure, individually unit-tested helpers:
  - `lunar.js` — lunar dates via `Intl` `chinese` calendar; 24 solar terms via
    Meeus's solar-longitude formula; moon phase derived from the lunar day.
  - `timezones.js` / `tzCountries.js` — zone picker option list (city, region,
    country, hand-tuned search hints), UTC-offset math via `formatToParts`.
  - `dayPhase.js` — day/dawn/dusk/night buckets + polite-calling-hours rule.
  - `formatTime.js` — duration formatting + natural-language parsing ("1h30m").
  - `fortune.js` — deterministic per-day 宜/忌 fortune (hash of UTC y/m/d).
  - `alerts.js` — Web Audio jingle (wav fallback) + desktop notifications.

## Conventions

- **Defensive persistence**: every localStorage/URL read is wrapped in
  try/catch and validated before use, with a sensible fallback. A corrupted or
  hand-edited value must never crash the app. Follow this pattern for any new
  persisted state.
- **Timers survive refresh**: running countdowns (Timer, Pomodoro) persist an
  *absolute end timestamp*, not remaining seconds; paused timers persist frozen
  remaining time. On load: end time in the future → resume; past → treat as
  finished (Pomodoro still awards the sticker). Both components reconcile on
  `visibilitychange` because background tabs throttle `setInterval`.
- **Lunar/date math anchors on noon UTC** (`utcNoon()` in `lunar.js`) to stay
  clear of the China-midnight boundary. Calendar "today" is computed per
  viewing zone via `dateInZone`.
- **Cross-component sync**: the World Clock zone list lives in localStorage
  under `worldClockTimeZones` and mirrors into the URL as `?tz=...` (shareable
  links; URL wins over localStorage on load). Same-tab listeners (Calendar's
  zone picker) are notified via a `worldclock-zones-changed` CustomEvent, since
  the `storage` event only fires across tabs.
- **Audio needs a user gesture**: call `initAudio()` from a click handler
  before a completion sound can play (browser autoplay policy).
- **Asset URLs**: prefix public assets with `import.meta.env.BASE_URL` (the app
  is served from a subpath).
- **Testing**: every util has a `.test.js`; every major component has a
  `.test.jsx`. Add/update tests alongside changes; run `npm test` before
  committing.
- **Comments** explain constraints and non-obvious "why", not mechanics.
- Bilingual 中英 strings are intentional in Calendar/lunar features — keep both.

## Licensing caveat

MIT applies to the code only. Pompompurin character assets (`public/`) are
Sanrio's — this is an unofficial fan project. Don't add third-party character
artwork.
