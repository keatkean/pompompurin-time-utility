# Pompompurin Time Utility ⏰🍮

A cute, multi-functional time utility app themed after Sanrio's Pompompurin! Built with React, Vite, and Material-UI.

![Pompompurin Time Utility — world clock with day/night cards](docs/screenshot.png)

## Features
- **World Clock:** Live times in multiple time zones with day/night themed cards — Pompompurin sleeps on night-time cards! A **smart zone picker** lets you search by city, country, or even abbreviation ("india", "uk", "vietnam") and shows each zone's current UTC offset and local time, grouped by region. Use the **time-travel slider** to preview other hours and see which friends are in friendly calling hours (8am–10pm, green border). A **"best time to reach everyone" overlap strip** shows, hour-by-hour, when all your zones are awake at once — tap any slot to jump there. Your list is saved between visits, and you can **share it as a link** (see below).
- **Living Pudding Timer:** A pudding gets eaten as the countdown runs — it wobbles when less than 10% remains and bursts into a **sprinkle celebration** with a jingle when time is up. **One-tap presets** (Tea, Coffee, Egg, Nap, Focus) save you typing. Pause/resume, desktop notifications, and the timer **survives a page refresh**.
- **Stopwatch:** Start, stop, lap, and reset, with a **jiggling pudding mascot** that runs alongside you. Laps show both the lap split and the cumulative total.
- **Pudding Pomodoro:** Focus/break cycles (default 25/5). Every completed focus session earns a pudding sticker and a sprinkle burst — every 4th is golden, and new **flavors (strawberry, matcha, chocolate)** unlock as your sticker sheet grows. Stickers are saved forever, and a running session survives a refresh.
- **World Calendar & 万年历:** A navigable month calendar where each day shows both the Western date and the Chinese lunar date (农历). Tap any day for its perpetual-calendar (万年历) detail — lunar date, 干支 year and zodiac (生肖), the 24 solar terms (节气: 立春, 春分, 夏至, 冬至…), and traditional festivals (春节, 端午, 中秋…) plus common holidays, all bilingual 中英. A "viewing zone" selector (shared with the World Clock list) shifts which day is "today" so you can see the date-line rollover around the world. Powered entirely by the browser's built-in `Intl` calendar plus an astronomical solar-term formula — no extra libraries.
- **Day & Night Mode:** Toggle between the creamy daytime palette and a cozy "bedtime pudding" night theme. Your choice is remembered, and it defaults to your system preference.
- **Installable PWA:** Add it to your phone home screen or desktop — works offline.
- **Pompompurin Theme:** Creamy yellow, brown, and pink color palette, playful font, a Pompompurin mascot in the header, and a **greeting that changes with your local time of day**.
- **Responsive:** Works on desktop and mobile.

## Sharing your clock
The World Clock list is encoded in the page URL, so it travels with the link:

- The address bar always reflects your current zones, e.g.
  `…/pompompurin-time-utility/?tz=Asia/Singapore,Europe/London,America/New_York`.
- Hit **Copy shareable link** to grab it, then send it to a friend or open it on
  another device — they'll see *your* clock (and the same overlap strip) instead
  of the default.
- Opening a shared link takes precedence over the locally saved list. Unknown or
  malformed zones in a link are ignored, so a stale or hand-edited link can never
  crash the app — it just falls back to your saved list, then the default.

## Demo
[Live Demo](https://keatkean.github.io/pompompurin-time-utility/)

## Setup
1. **Clone the repo:**
   ```sh
   git clone https://github.com/keatkean/pompompurin-time-utility.git
   cd pompompurin-time-utility
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Run the app:**
   ```sh
   npm run dev
   ```
4. **Open in browser:**
   Visit [http://localhost:5173/pompompurin-time-utility/](http://localhost:5173/pompompurin-time-utility/)

## Tests
Run the unit tests (Vitest + React Testing Library):
```sh
npm test
```
Or in watch mode while developing:
```sh
npm run test:watch
```

## Deployment
Pushes to `main` are automatically built, tested, and deployed to GitHub Pages by the
[GitHub Actions workflow](.github/workflows/deploy.yml).

> **One-time setup:** in the repository settings, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**.

## Timer Sound
- The timer uses a beep sound (`public/beep-07a.wav`). Ensure your browser tab is not muted.

## Tech Stack
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Material-UI (MUI)](https://mui.com/)
- [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Sanrio Pompompurin](https://www.sanrio.com/collections/pompompurin)

## License & Disclaimer

The **source code** of this project is licensed under the [MIT License](LICENSE).

> **Unofficial fan project.** This is a non-commercial fan-made app created for
> learning purposes. *Pompompurin* and all related characters, names, and imagery
> are trademarks and copyrights of **Sanrio Co., Ltd.** This project is not
> affiliated with, sponsored, or endorsed by Sanrio in any way.
>
> The MIT license applies to the source code **only** — it does **not** grant any
> rights to the Pompompurin character or any Sanrio artwork (including the mascot
> image in `public/`). If you fork or reuse this code, please replace the
> character assets with your own. Character assets will be removed immediately
> upon request by the rights holder.
