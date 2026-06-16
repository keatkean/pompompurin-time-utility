# Pompompurin Time Utility ⏰🍮

A cute, multi-functional time utility app themed after Sanrio's Pompompurin! Built with React, Vite, and Material-UI.

![Pompompurin Time Utility — world clock with day/night cards](docs/screenshot.png)

## Features
- **World Clock:** Live times in multiple time zones with day/night themed cards — Pompompurin sleeps on night-time cards! Use the **time-travel slider** to preview other hours and see which friends are in friendly calling hours (8am–10pm, green border). Your list is saved between visits.
- **Living Pudding Timer:** A pudding gets eaten as the countdown runs — it wobbles when less than 10% remains and bounces with a celebration jingle when time is up. Pause/resume, desktop notifications, and the timer **survives a page refresh**.
- **Stopwatch:** Start, stop, lap, and reset. Laps show both the lap split and the cumulative total.
- **Pudding Pomodoro:** Focus/break cycles (default 25/5). Every completed focus session earns a pudding sticker — every 4th is golden! Stickers are saved forever, and a running session survives a refresh.
- **Installable PWA:** Add it to your phone home screen or desktop — works offline.
- **Pompompurin Theme:** Creamy yellow, brown, and pink color palette, playful font, and a Pompompurin mascot in the header.
- **Responsive:** Works on desktop and mobile.

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
