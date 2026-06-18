import { useState, useEffect, useRef } from 'react';
import { TextField, Button, Typography, Stack, Paper, Box, Alert, Chip } from '@mui/material';
import { formatDuration } from '../utils/formatTime';
import { initAudio, playCompletionSound, requestNotificationPermission, notify } from '../utils/alerts';
import Pudding from './Pudding';
import Sprinkles from './Sprinkles';

const TIMER_KEY = 'pompompurinTimer';

// One-tap presets for the everyday timers people actually set — much friendlier
// than poking three number fields on a phone.
const PRESETS = [
  { label: 'Tea 🍵', seconds: 3 * 60 },
  { label: 'Coffee ☕', seconds: 4 * 60 },
  { label: 'Egg 🥚', seconds: 6 * 60 },
  { label: 'Nap 😴', seconds: 20 * 60 },
  { label: 'Focus 🍮', seconds: 25 * 60 },
];

const clampNumber = (value, max) => Math.max(0, Math.min(max, parseInt(value, 10) || 0));

// A running timer stores its absolute end timestamp, so it can survive a
// page refresh: still in the future → resume; already past → finished. A paused
// timer instead stores its frozen remaining time, so it too survives a refresh
// (its end timestamp is recomputed from "now" only when the user resumes).
function loadSavedTimer() {
  try {
    const saved = JSON.parse(localStorage.getItem(TIMER_KEY));
    if (saved && saved.paused && typeof saved.remaining === 'number' && typeof saved.initialTime === 'number') {
      return { paused: { remaining: saved.remaining, initialTime: saved.initialTime } };
    }
    if (saved && typeof saved.endTime === 'number' && typeof saved.initialTime === 'number') {
      const remaining = Math.ceil((saved.endTime - Date.now()) / 1000);
      if (remaining > 0) return { running: { ...saved, remaining } };
      localStorage.removeItem(TIMER_KEY);
      return { finishedWhileAway: true };
    }
  } catch {
    localStorage.removeItem(TIMER_KEY);
  }
  return {};
}

const Timer = () => {
  const [restored] = useState(loadSavedTimer);
  const restoredTimer = restored.running ?? restored.paused;
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(Boolean(restored.running));
  const [timeLeft, setTimeLeft] = useState(restoredTimer?.remaining ?? 0);
  const [initialTime, setInitialTime] = useState(restoredTimer?.initialTime ?? 0);
  const [finished, setFinished] = useState(Boolean(restored.finishedWhileAway));
  const endTimeRef = useRef(restored.running?.endTime ?? 0);
  // Guards the completion branch so it runs at most once per run (an extra tick
  // can fire at remaining===0 before React tears down the interval).
  const firedRef = useRef(false);

  useEffect(() => {
    if (!isActive) return;
    const fire = () => {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0 && !firedRef.current) {
        firedRef.current = true;
        setIsActive(false);
        setFinished(true);
        localStorage.removeItem(TIMER_KEY);
        playCompletionSound();
        notify('Timer finished! 🍮');
      }
    };
    const id = setInterval(fire, 250);
    // Background tabs throttle setInterval, so a buried timer can complete late.
    // Reconcile (and fire the alert) immediately when the tab regains focus.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fire();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isActive]);

  // If the timer expired while the tab was closed, the celebration UI is shown
  // on restore — also fire the alert so the completion isn't silent. Sound is
  // best-effort (a fresh load has no user gesture, so autoplay is usually
  // blocked); the desktop notification is the reliable part when granted.
  useEffect(() => {
    if (restored.finishedWhileAway) {
      notify('Timer finished! 🍮');
      playCompletionSound();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPaused = !isActive && timeLeft > 0;
  const inputSeconds = hours * 3600 + minutes * 60 + seconds;
  const displayTime = isActive || isPaused ? timeLeft : inputSeconds;
  const showWarning = isActive && timeLeft > 0 && initialTime > 0 && timeLeft / initialTime <= 0.1;
  const puddingFraction = (isActive || isPaused) && initialTime > 0 ? timeLeft / initialTime : 1;

  const handleStart = () => {
    const total = isPaused ? timeLeft : inputSeconds;
    if (total <= 0) return;
    const init = isPaused ? initialTime : total;
    if (!isPaused) {
      setInitialTime(total);
    }
    const endTime = Date.now() + total * 1000;
    endTimeRef.current = endTime;
    setTimeLeft(total);
    setIsActive(true);
    setFinished(false);
    firedRef.current = false;
    localStorage.setItem(TIMER_KEY, JSON.stringify({ endTime, initialTime: init }));
    initAudio();
    requestNotificationPermission();
  };

  const handlePause = () => {
    setIsActive(false);
    // Persist the frozen remaining time so a paused timer survives a refresh.
    localStorage.setItem(TIMER_KEY, JSON.stringify({ paused: true, remaining: timeLeft, initialTime }));
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(0);
    setInitialTime(0);
    setFinished(false);
    firedRef.current = false;
    localStorage.removeItem(TIMER_KEY);
  };

  const applyPreset = (totalSeconds) => {
    setHours(Math.floor(totalSeconds / 3600));
    setMinutes(Math.floor((totalSeconds % 3600) / 60));
    setSeconds(totalSeconds % 60);
    setFinished(false);
  };

  const timeFields = [
    { label: 'Hours', value: hours, setter: setHours, max: 99 },
    { label: 'Minutes', value: minutes, setter: setMinutes, max: 59 },
    { label: 'Seconds', value: seconds, setter: setSeconds, max: 59 },
  ];

  return (
    <Box mt={6}>
      <Paper elevation={8} sx={{ p: 5, borderRadius: 3, maxWidth: 600, mx: 'auto' }}>
        <Stack spacing={4} alignItems="center">
          {showWarning && (
            <Alert severity="warning" sx={{ fontWeight: 'bold', fontSize: 18 }}>
              Hurry up! Less than 10% time remaining.
            </Alert>
          )}
          <Box
            sx={{ position: 'relative' }}
            className={showWarning ? 'pudding-wobble' : finished ? 'pudding-bounce' : undefined}
          >
            <Pudding fraction={puddingFraction} size={150} />
            {finished && <Sprinkles />}
          </Box>
          {finished && (
            <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
              Yum! Time&apos;s up! 🍮
            </Typography>
          )}
          <Typography
            variant="h2"
            fontFamily="monospace"
            fontWeight="bold"
            sx={{
              textAlign: 'center',
              fontSize: 56,
              color: showWarning ? 'warning.main' : 'primary.main',
              transition: 'color 0.3s',
            }}
          >
            {formatDuration(displayTime)}
          </Typography>
          {!isActive && !isPaused && (
            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
              {PRESETS.map(({ label, seconds: presetSeconds }) => (
                <Chip
                  key={label}
                  label={label}
                  onClick={() => applyPreset(presetSeconds)}
                  variant="outlined"
                  sx={{ fontWeight: 700, fontSize: 14, bgcolor: 'background.default' }}
                />
              ))}
            </Stack>
          )}
          <Stack direction="row" spacing={3} justifyContent="center">
            {timeFields.map(({ label, value, setter, max }) => (
              <TextField
                key={label}
                label={label}
                type="number"
                value={value}
                onChange={(e) => setter(clampNumber(e.target.value, max))}
                disabled={isActive || isPaused}
                sx={{ width: 90 }}
                slotProps={{ htmlInput: { min: 0, max } }}
              />
            ))}
          </Stack>
          <Stack direction="row" spacing={3} justifyContent="center">
            <Button variant="contained" onClick={handleStart} disabled={isActive || displayTime <= 0}>
              {isPaused ? 'Resume' : 'Start'}
            </Button>
            <Button variant="contained" color="secondary" onClick={handlePause} disabled={!isActive}>
              Pause
            </Button>
            <Button variant="outlined" onClick={handleReset}>
              Reset
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Timer;
