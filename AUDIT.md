# Code Audit — Pompompurin Time Utility

Bug + security/privacy review of the client-side React 19 + Vite 7 PWA.
Generated 2026-06-16. **No fixes applied yet** — this is a tracking checklist.

**Method:** 6 dimension finders (timer, pomodoro, stopwatch/world-clock, React hooks,
security, build/config) → adversarial verification of every candidate → synthesis.
21 findings confirmed, 13 rejected as false positives. Severities below are the
*verified* severities (every original "high" was downgraded to medium: this is a
single-user, no-auth, no-network-input static site, so severe failure modes have low
real-world likelihood and easy recovery).

**Status:** ✅ ALL 16 findings addressed on 2026-06-16. `npm run lint` clean, 30
tests pass, `npm run build` succeeds (MUI split into its own chunk — no >500 kB
warning; fonts self-hosted; PWA icons are real PNGs; CSP meta added; precache
deduped). `npm audit` reduced from 11 → 6, with the remaining 6 being dev-only
build-tooling advisories (`esbuild`/`vite`/`vitest`) that require a deliberate
breaking major upgrade — see #15.

---

## Medium — ✅ all fixed

### [x] 1. Invalid timezone in localStorage white-screens the *entire* app — ✅ FIXED 2026-06-16
- **Where:** `src/components/WorldClock.jsx:26-40, 82-90`; amplified by `src/main.jsx:6-10` and `src/App.jsx:121-133`
- **Problem:** `loadSavedTimeZones()` validates only that `city`/`timeZone` are *strings* — never that the zone is a real IANA zone. A persisted value like `[{city:'X',timeZone:'Foo/Bar'}]` passes the guard, then `toLocaleDateString`/`toLocaleTimeString` (82, 89) and `getLocalHour → new Intl.DateTimeFormat` (`src/utils/dayPhase.js:3-7`) throw `RangeError: Invalid time zone specified` during render. There is **no error boundary** and all four tabs mount at once (toggled via `display:none`), so one bad WorldClock entry unwinds the whole React tree — every tab goes blank — and it recurs on every reload (the bad value is re-read from storage).
- **Likelihood:** Low — no in-app path writes a bad zone (Autocomplete only offers `Intl.supportedValuesOf('timeZone')`, not freeSolo). Realistic trigger is a future schema/format change or a stale serialized value, not XSS.
- **Fix:** validate zone *content* at load.
  ```js
  const isValidZone = (z) => {
    if (typeof z !== 'string') return false;
    try { new Intl.DateTimeFormat('en-US', { timeZone: z }); return true; }
    catch { return false; }
  };
  // tighten the .every(...) at line 32:
  saved.every((tz) => isValidZone(tz?.timeZone) && typeof tz?.city === 'string')
  ```
- **Defense-in-depth (optional, recommended):** add a class-based `ErrorBoundary` (`getDerivedStateFromError`/`componentDidCatch`) with a friendly fallback + a "Reset stored data" button (clears the app's localStorage keys), and wrap each tab's `<Box>` in `App.jsx` so one failing tab can't blank the others. Add a regression test: valid array containing an invalid zone → falls back to Singapore.

### [x] 2. Pausing a running timer, then refreshing, loses it entirely — ✅ FIXED 2026-06-16
- **Where:** `src/components/Timer.jsx:78-81, 13-26`
- **Problem:** `handlePause()` calls `localStorage.removeItem(TIMER_KEY)`, so a paused timer's remaining time lives only in React state. A *running* timer survives refresh (its `endTime` is persisted at line 73) but a *paused* one — the state users most expect to be safe — does not. Refresh/close/eviction while paused resets the timer to 0:00.
- **Fix:** persist a paused record instead of deleting it.
  - `handlePause()`: `setIsActive(false); localStorage.setItem(TIMER_KEY, JSON.stringify({ paused: true, remaining: timeLeft, initialTime }));`
  - `loadSavedTimer()`: add a branch — `if (saved && saved.paused && typeof saved.remaining === 'number' && typeof saved.initialTime === 'number') return { paused: { remaining: saved.remaining, initialTime: saved.initialTime } };`
  - `useState` initializers: `const r = restored.running ?? restored.paused;` then `timeLeft = r?.remaining ?? 0; initialTime = r?.initialTime ?? 0`. `setIsActive(Boolean(restored.running))` already keeps a paused timer inactive, so derived `isPaused` (line 55) becomes true and the button reads "Resume".
  - No change to Resume path — `handleStart` recomputes `endTime` (68) and overwrites the record, so `endTime` is correctly recomputed on resume rather than stored while paused.

### [x] 3. Timer that finishes while the tab was closed never alerts — ✅ FIXED 2026-06-16
- **Where:** `src/components/Timer.jsx:13-26, 33, 39-53`
- **Problem:** `loadSavedTimer()` returns `{ finishedWhileAway: true }`, which sets `finished=true` so the "Yum! Time's up!" UI renders — but `playCompletionSound()`/`notify()` (48-49) only run inside the interval, which is skipped because `isActive` starts `false`. The user gets a silent, visual-only completion, inconsistent with the in-app beep+notify path.
- **Caveat:** the WebAudio jingle can't reliably play on a fresh load (module `audioContext` is `null` after reload; WAV fallback blocked by autoplay without a fresh gesture). The *notification* is the reliably-recoverable alert (`Notification.permission` is persistent per-origin).
- **Fix:** mount-time effect (`notify`/`playCompletionSound` already imported on line 4).
  ```jsx
  useEffect(() => {
    if (restored.finishedWhileAway) {
      notify('Timer finished! 🍮');
      playCompletionSound(); // best-effort; usually blocked on a fresh load
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  ```

---

## Low — ✅ all fixed

### [x] 4. Pomodoro focus completing while the tab is closed loses its sticker — ✅ FIXED 2026-06-16
- **Where:** `src/components/Pomodoro.jsx:25-37`
- **Problem:** `loadSession()` discards any session with `remaining <= 0` (returns `null`, removes key), so a focus block completed while away awards no sticker and doesn't roll into the break. (Discarding a completed *break* while away is correct — no reward attaches.)
- **Fix:** when `phase==='focus'` and `remaining<=0`, return `{ focusFinishedWhileAway: true, focusMinutes, breakMinutes }` instead of `null`; then a one-time mount effect awards the sticker and clears the key:
  ```jsx
  useEffect(() => {
    if (restored?.focusFinishedWhileAway) {
      setStickers((n) => n + 1);
      localStorage.removeItem(SESSION_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  ```
  Base `isActive`/`timeLeft` on `restored?.remaining` so the marker restore stays idle. Don't auto-start the break (match Timer behavior).

### [x] 5. Completion side-effects can fire twice (interval vs. passive-cleanup race) — ✅ FIXED 2026-06-16
- **Where:** `src/components/Timer.jsx:41-52`
- **Problem:** When `remaining` hits 0 the interval calls `setIsActive(false)` + alerts, but the interval is torn down only by the effect's *passive* cleanup (async, after paint). An extra 250 ms tick before cleanup recomputes `remaining===0` and re-fires the beep/notification (no idempotency guard). Reproducible under fake timers; load-dependent in a real browser.
- **Fix:** guard with a ref and tear down synchronously.
  ```jsx
  const firedRef = useRef(false); // near other refs
  // inside the interval callback, when remaining === 0:
  if (remaining === 0 && !firedRef.current) {
    firedRef.current = true;
    clearInterval(id);            // synchronous teardown; don't wait for passive cleanup
    setIsActive(false); setFinished(true);
    localStorage.removeItem(TIMER_KEY);
    playCompletionSound(); notify('Timer finished! 🍮');
  }
  ```
  Reset `firedRef.current = false` in `handleStart()` and `handleReset()`.

### [x] 6. Background-tab alerts arrive late (setInterval throttling) — ✅ FIXED 2026-06-16
- **Where:** `src/components/Timer.jsx:41-51` (and identical pattern in `src/components/Pomodoro.jsx:49+`)
- **Problem:** Completion is detected only when the 250 ms interval observes `remaining===0`. Background tabs throttle `setInterval` (~once/minute after 5+ min hidden), so the alert fires late while the user is elsewhere — precisely when a notification matters most. Display is correct on refocus (wall-clock `endTime`).
- **Fix:** add a `visibilitychange` listener that recomputes remaining and fires completion on refocus (a bare `setTimeout` won't help — same throttling). Refactor completion into a shared `fire()` called by both the interval and the focus handler; register/cleanup the listener in the same effect. Apply to both Timer and Pomodoro.

### [x] 7. Stopwatch state is not persisted — full reset on reload/relaunch — ✅ FIXED 2026-06-16
- **Where:** `src/components/Stopwatch.jsx:7-19`
- **Problem:** The only tab with no localStorage rehydration. A full reload, PWA relaunch, or OS tab eviction wipes a running stopwatch and all laps. (Tab *switching* is fine — `App.jsx:121-134` keeps all tabs mounted via `display:none`.) The anchor math (`startTimeRef = Date.now() - elapsed`) is already drift-free.
- **Fix:** persist `{ anchor: startTimeRef.current, isActive, laps }` while active (or `{ elapsed, isActive:false, laps }` when stopped) under a `pompompurinStopwatch` key via a `[isActive, elapsed, laps]` effect; a `loadSaved()` `useState` initializer recomputes `elapsed = Date.now() - anchor` when restored active. Clear localStorage in the Stopwatch test setup/teardown to avoid cross-test leakage.

### [x] 8. Removing the last timezone → confusing empty state that resets on reload — ✅ FIXED 2026-06-16
- **Where:** `src/components/WorldClock.jsx:69-71, 29-39`
- **Problem:** `handleRemoveTimeZone` filters unconditionally, so the user can delete the only clock → empty panel (scrubber + add controls, no cards). The empty array *is* persisted, but on reload `loadSavedTimeZones` requires `saved.length > 0`, fails, and silently re-injects `DEFAULT_TIME_ZONES` (Singapore). Reads like a bug.
- **Fix:** prevent emptying at the source — `const handleRemoveTimeZone = (tz) => { if (timeZones.length <= 1) return; setTimeZones(timeZones.filter((t) => t.timeZone !== tz)); };` and add `disabled={timeZones.length <= 1}` to the close `IconButton` (130-145).

### [x] 9. `Intl.supportedValuesOf` fallback leaves no addable zones — ✅ FIXED 2026-06-16
- **Where:** `src/components/WorldClock.jsx:21-24, 202`
- **Problem:** When `Intl.supportedValuesOf` is unavailable, `timeZoneNames` falls back to `['Asia/Singapore']` — the lone option, which is also already in `timeZones`, so `getOptionDisabled` (202) disables it. The Add control becomes dead. (Rare; the API shipped across browsers in early 2022.)
- **Fix:** replace the `.map()` fallback with a curated IANA list (`['Asia/Singapore','America/New_York','Europe/London','Asia/Tokyo','UTC', ...]`). `cityFromTimeZone` (42) and `handleAddTimeZone` (59-67) already consume plain strings.

### [x] 10. Google Fonts loaded cross-origin: IP/UA leak + fonts unavailable offline — ✅ FIXED 2026-06-16
- **Where:** `index.html:10-15`; `vite.config.js:26-28`
- **Problem:** Baloo 2 + Quicksand load from `fonts.googleapis.com`/`fonts.gstatic.com` — the only third-party egress. (a) Privacy: every visitor's IP/User-Agent/Referer is sent to Google before any interaction, no consent (the pattern behind GDPR rulings on embedded Google Fonts). (b) Offline: Workbox precaches only local output and has no `runtimeCaching` for the font origins, so offline the themed fonts fall back to system fonts — undercutting the README's "works offline". (SRI is not applicable to a Google Fonts stylesheet that `@import`s the font files.)
- **Fix (preferred):** self-host — `npm i @fontsource/baloo-2 @fontsource/quicksand`, import the needed weights once in `src/main.jsx`, remove the three Google Fonts `<link>` tags (preconnect ×2 + stylesheet) at `index.html:10-15`, and add `woff2` to the Workbox `globPatterns`. (Alternative: Workbox `runtimeCaching` — `StaleWhileRevalidate` for googleapis, `CacheFirst` for gstatic with `cacheableResponse.statuses: [0, 200]` — but this still leaks IP/UA and needs one online load first.)

### [x] 11. PWA icons: SVG-only (a wrapped 110 KB PNG), no apple-touch-icon, full-bleed maskable — ✅ FIXED 2026-06-16
- **Where:** `vite.config.js:21-24, 23`; `index.html` head
- **Problem:** (a) No `<link rel="apple-touch-icon">` and manifest declares only SVG icons; iOS Safari ignores SVG manifest icons → "Add to Home Screen" yields a blank tile/screenshot instead of the mascot (contradicts the README's "Installable PWA"). (b) `public/pompompurin.svg` is a ~110 KB base64 PNG wrapped in `<image>` — no vector benefit, bloats precache. (c) The same full-bleed SVG is `purpose:'maskable'` with no safe-zone padding → Android adaptive icons crop the edges.
- **Fix:** export real PNGs and replace the wrapped-PNG SVG for install use.
  ```js
  icons: [
    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ]
  ```
  Generate the maskable PNG with ~10–20% transparent safe-zone padding. Add a 180×180 `apple-touch-icon.png` to `public/`, reference it in `index.html` head with a **root-absolute** path matching the base (`<link rel="apple-touch-icon" href="/pompompurin-time-utility/apple-touch-icon.png" />` — don't rely on Vite to rewrite this tag), and list it in `includeAssets` so it precaches.

### [x] 12. Dual deploy mechanisms: `gh-pages` scripts conflict with the Actions Pages deploy — ✅ FIXED 2026-06-16
- **Where:** `package.json:14-15` (+ `README.md:52-55`)
- **Problem:** `predeploy`/`deploy` push `dist/` to a `gh-pages` branch via the `gh-pages` package, while `.github/workflows/deploy.yml` deploys via `actions/deploy-pages`. The two Pages sources are mutually exclusive, so with Source = "GitHub Actions" `npm run deploy` silently has no effect — yet the README presents it as a valid fallback. (`actions/configure-pages@v5` runs with `enablement: true`, so even switching Source back to the branch is auto-reverted on the next push to `main`.)
- **Fix:** remove the `predeploy`/`deploy` scripts (14-15) and the `gh-pages` devDependency, and delete README:52-55, documenting only the Actions flow. (Or replace those lines with an explicit warning about the mutual exclusivity + auto-revert.)

### [x] 13. Single 514 KB JS bundle (MUI not code-split) — ✅ FIXED 2026-06-16
- **Where:** `vite.config.js:6-30`
- **Problem:** One `index-*.js` chunk at 513.71 kB (162 kB gzipped) with the >500 kB Vite warning; the whole MUI + icons + emotion stack is in the initial chunk. Larger first load; the full bundle is precached on install.
- **Fix:** split the vendor bundle via Rollup `manualChunks` (safe, no behavior change):
  ```js
  build: { rollupOptions: { output: { manualChunks: {
    mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
  } } } }
  ```
  **Do not** `React.lazy` the tab panels — `App.jsx` intentionally keeps all four mounted (`display:none`) so timers keep running while hidden; lazy-unmounting inactive tabs would break that. True on-demand loading would first require lifting interval state out of the components.

---

## Info (hardening / hygiene — no active vulnerability) — ✅ all addressed

### [x] 14. No Content-Security-Policy — ✅ FIXED 2026-06-16
- **Where:** `index.html:3-16`
- **Note:** Confirmed **zero XSS sinks** (no `dangerouslySetInnerHTML`/`innerHTML`/`eval`/`document.write`), no network calls, no URL/hash/postMessage input — all user data flows through auto-escaping JSX. Pure defense-in-depth. GitHub Pages can't set headers, so a `<meta>` tag is the only option.
- **Shipped:** added to `index.html`, tightened to all-same-origin since fonts are now self-hosted (#10) — no Google Fonts origins. `frame-ancestors` omitted because it is ignored in a `<meta>` tag (would only log a console warning).
  ```html
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'">
  ```
  `'unsafe-inline'` in `style-src` is required by Emotion's runtime style injection. Verified present in `dist/index.html` after build. Should still be spot-checked in DevTools for violation reports on the deployed site.

### [x] 15. Build-time `yaml` dependency advisory (not shipped to users) — ✅ FIXED 2026-06-16
- **Where:** `package.json` (transitive)
- **Note:** `npm audit` flagged `yaml` (GHSA-48c2-rrv3-qjmp) — build-only, unreachable in the shipped `dist` bundle.
- **Done:** ran `npm audit fix` (non-breaking). Resolved the `yaml` advisory plus `js-yaml`, `postcss`, `flatted`, and `brace-expansion` — `npm audit` went from 11 → 6, with **no change to direct deps** (`vite` ^7, `vitest` ^3, `vite-plugin-pwa` ^1 untouched).
- **Remaining (deliberately not fixed):** 6 high-severity advisories in `esbuild`/`vite`/`vitest`/`vite-node` — all **dev/build-tooling, never shipped to users**. Clearing them needs `npm audit fix --force`, which would bump `vite`→8 and `vitest`→4 (breaking majors). That is a deliberate toolchain upgrade, not a hygiene auto-fix; left for a separate, tested upgrade.

### [x] 16. Duplicate precache entries for `pompompurin.svg` and `beep-07a.wav` — ✅ FIXED 2026-06-16
- **Where:** `vite.config.js`
- **Note:** `includeAssets` overlapped with `globPatterns` matching `svg`/`wav`, so each file appeared twice in `sw.js`.
- **Done:** dropped the `includeAssets` line. `globPatterns` (now `js,css,html,svg,wav,png,woff2`) covers the favicon + wav, and `includeManifestIcons` covers the PNG icons. Verified after build: `pompompurin.svg` and `beep-07a.wav` now appear exactly once each in `dist/sw.js` (precache 21 → 19 entries).

---

## Cross-cutting themes

- **localStorage rehydration is the dominant fault line.** #1, 2, 3, 4, 7, 8 all stem from the persist/restore boundary: trusting persisted content without revalidating (1), deleting state that should survive (2), restoring without replaying side effects (3, 4), persisting an unintended empty state (8), or not persisting at all (7). A shared, defensively-validated load/save helper per feature (validate shape *and* content, fall back to a known-good default) would prevent the whole class.
- **No render-time fault isolation.** All four tabs mount into one tree with no error boundary, so any one throw blanks the entire app — this is what turns #1 from a one-tab bug into a whole-app outage.
- **Wall-clock timers vs. browser throttling/unloading.** #3, 4, 5, 6 share the pattern of detecting completion *only* inside a throttle-prone `setInterval` and firing side effects there. The robust pattern: `visibilitychange` reconciliation + idempotent, synchronously-torn-down completion shared across tick and focus handler.
- **PWA polish gaps contradict the README's marketing.** #10 and #11 make the app fall short of "Installable PWA / works offline" (unbranded iOS icon; system-font fallback offline).

---

## Ruled out (verified false positives — do not spend time on these)

- **Array-index React keys** (`Stopwatch.jsx` laps, `Pomodoro.jsx` sticker grid) — lists are append-only/cleared, so index = stable identity; children are stateless. No bug.
- **`clampNumber` decimal/scientific input** — browser `type="number"` delivers `''` for non-numeric garbage, so it clamps to 0; `'2.9'→2` is sensible integer truncation. Cosmetic nit.
- **`getLocalHour` midnight `0` vs `24`** — bundled engine returns `0`; both consumers treat 0 and 24 identically; already test-covered.
- **Pomodoro multi-sticker re-fire** — only reproduces under fake timers in a single batch; real browsers fire ticks as separate macrotasks with the `endTimeRef` advance protecting the edge. 1 sticker per focus.
- **Pomodoro paused-break "loss"** — paused-break path is internally consistent; only non-persistence across refresh, which is the deliberate app-wide design (mirrors Timer).
- **StrictMode double-mount on timers** — dev-only; production runs initializers once; refs seeded correctly.
- **Favicon absolute `/pompompurin.svg` path** — fine: Vite rebases root-absolute asset URLs to the configured base at build time.
- Various **test-coverage wishlists** — missing tests for the bugs above are tracked with those bugs, not as independent defects.
