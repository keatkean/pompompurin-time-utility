import { useState, useEffect, useRef } from 'react';
import { TextField, Button, Typography, Stack, Paper, Box, Chip } from '@mui/material';
import { formatDuration } from '../utils/formatTime';
import { initAudio, playCompletionSound, requestNotificationPermission, notify } from '../utils/alerts';
import Pudding from './Pudding';
import Sprinkles from './Sprinkles';
import BreathingPudding from './BreathingPudding';

const SESSION_KEY = 'pompompurinPomodoroSession';
const STICKERS_KEY = 'pompompurinPomodoroStickers';
const MAX_VISIBLE_STICKERS = 24;

// Every 4th sticker is golden (a completed set); the rest cycle flavor by set,
// so the sheet visibly "unlocks" new pudding flavors as you rack up sessions.
const STICKER_FLAVORS = ['classic', 'strawberry', 'matcha', 'chocolate'];
const stickerProps = (i) =>
  (i + 1) % 4 === 0
    ? { golden: true }
    : { flavor: STICKER_FLAVORS[Math.floor(i / 4) % STICKER_FLAVORS.length] };

const clampMinutes = (value, max) => Math.max(1, Math.min(max, parseInt(value, 10) || 1));

function loadStickers() {
  try {
    const n = Number(JSON.parse(localStorage.getItem(STICKERS_KEY)));
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
  } catch {
    // Corrupted storage — start a fresh sheet.
  }
  return 0;
}

// Like the Timer, a running session persists its absolute end timestamp so a
// refresh resumes mid-focus or mid-break; a paused session persists its frozen
// remaining time instead (the end timestamp is recomputed on resume).
function loadSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (
      saved &&
      saved.paused &&
      typeof saved.remaining === 'number' &&
      saved.remaining > 0 &&
      (saved.phase === 'focus' || saved.phase === 'break')
    ) {
      return {
        paused: true,
        remaining: saved.remaining,
        phase: saved.phase,
        focusMinutes: saved.focusMinutes,
        breakMinutes: saved.breakMinutes,
      };
    }
    if (saved && typeof saved.endTime === 'number' && (saved.phase === 'focus' || saved.phase === 'break')) {
      const remaining = Math.ceil((saved.endTime - Date.now()) / 1000);
      if (remaining > 0) return { ...saved, remaining };
      // A focus session that completed while the tab was closed still earns its
      // sticker; a completed break carries no reward, so let it be discarded.
      if (saved.phase === 'focus') {
        return { focusFinishedWhileAway: true, focusMinutes: saved.focusMinutes, breakMinutes: saved.breakMinutes };
      }
    }
  } catch {
    // Corrupted storage — discard below.
  }
  localStorage.removeItem(SESSION_KEY);
  return null;
}

const Pomodoro = () => {
  const [restored] = useState(loadSession);
  const [focusMinutes, setFocusMinutes] = useState(restored?.focusMinutes ?? 25);
  const [breakMinutes, setBreakMinutes] = useState(restored?.breakMinutes ?? 5);
  const [phase, setPhase] = useState(restored?.phase ?? 'focus');
  const [isActive, setIsActive] = useState(Boolean(restored?.remaining && !restored.paused));
  const [timeLeft, setTimeLeft] = useState(restored?.remaining ?? 0);
  const [stickers, setStickers] = useState(loadStickers);
  // Bumped on each live focus completion to replay the sprinkle burst.
  const [celebrate, setCelebrate] = useState(0);
  const [breathing, setBreathing] = useState(false);
  const endTimeRef = useRef(restored?.endTime ?? 0);
  // Guards the completion branch so it runs at most once per countdown (an
  // extra tick can land at remaining===0 before React tears down the interval).
  const firedRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(STICKERS_KEY, JSON.stringify(stickers));
  }, [stickers]);

  // A focus session that finished while the tab was closed still earns its
  // sticker on restore (the live completion path can't have run).
  useEffect(() => {
    if (restored?.focusFinishedWhileAway) {
      setStickers((n) => n + 1);
      localStorage.removeItem(SESSION_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const fire = () => {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining > 0) return;
      if (firedRef.current) return;
      firedRef.current = true;
      playCompletionSound();
      if (phase === 'focus') {
        // Focus complete: earn a sticker and roll straight into the break.
        setStickers((n) => n + 1);
        setCelebrate((c) => c + 1);
        notify('Focus complete! Break time 🍮');
        const total = breakMinutes * 60;
        const endTime = Date.now() + total * 1000;
        endTimeRef.current = endTime;
        firedRef.current = false; // the break countdown gets its own completion
        setPhase('break');
        setTimeLeft(total);
        localStorage.setItem(SESSION_KEY, JSON.stringify({ endTime, phase: 'break', focusMinutes, breakMinutes }));
      } else {
        notify('Break over — ready for another pudding? 📚');
        setIsActive(false);
        setPhase('focus');
        setTimeLeft(0);
        localStorage.removeItem(SESSION_KEY);
      }
    };
    const id = setInterval(fire, 250);
    // Background tabs throttle setInterval; reconcile the moment the tab is
    // foregrounded so a buried session doesn't sit visibly overdue.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fire();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isActive, phase, focusMinutes, breakMinutes]);

  const isPaused = !isActive && timeLeft > 0;
  const phaseTotal = (phase === 'focus' ? focusMinutes : breakMinutes) * 60;
  const displayTime = isActive || isPaused ? timeLeft : focusMinutes * 60;
  const puddingFraction = isActive || isPaused ? (phaseTotal > 0 ? timeLeft / phaseTotal : 1) : 1;
  const goldenSets = Math.floor(stickers / 4);

  const handleStart = () => {
    initAudio();
    requestNotificationPermission();
    if (isPaused) {
      const endTime = Date.now() + timeLeft * 1000;
      endTimeRef.current = endTime;
      firedRef.current = false;
      setIsActive(true);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ endTime, phase, focusMinutes, breakMinutes }));
      return;
    }
    const total = focusMinutes * 60;
    const endTime = Date.now() + total * 1000;
    endTimeRef.current = endTime;
    firedRef.current = false;
    setPhase('focus');
    setTimeLeft(total);
    setIsActive(true);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ endTime, phase: 'focus', focusMinutes, breakMinutes }));
  };

  const handlePause = () => {
    setIsActive(false);
    // Persist the frozen remaining time so a paused session survives a refresh
    // (same contract as the Timer).
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ paused: true, remaining: timeLeft, phase, focusMinutes, breakMinutes })
    );
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(0);
    setPhase('focus');
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <Box mt={6}>
      <Paper elevation={8} sx={{ p: { xs: 2.5, sm: 5 }, borderRadius: 3, maxWidth: 600, mx: 'auto' }}>
        <Stack spacing={{ xs: 3, sm: 4 }} alignItems="center">
          <Chip
            label={
              isActive || isPaused
                ? phase === 'focus'
                  ? 'Focus time 📚'
                  : 'Break time ☁️'
                : 'Ready for a focus session?'
            }
            sx={{ fontWeight: 700, fontSize: 16, px: 1, bgcolor: 'secondary.main', color: '#5B4222' }}
          />
          <Box sx={{ position: 'relative' }}>
            <Pudding fraction={phase === 'focus' ? puddingFraction : 1} sleeping={phase === 'break'} size={150} />
            {celebrate > 0 && <Sprinkles key={celebrate} />}
          </Box>
          <Typography
            variant="h2"
            fontFamily="monospace"
            fontWeight="bold"
            sx={{ textAlign: 'center', width: '100%', fontSize: 'clamp(2rem, 12vw, 3.5rem)', color: 'primary.main' }}
          >
            {formatDuration(displayTime)}
          </Typography>
          <Stack direction="row" spacing={{ xs: 1, sm: 3 }} justifyContent="center" flexWrap="wrap" useFlexGap>
            <TextField
              label="Focus (min)"
              type="number"
              value={focusMinutes}
              onChange={(e) => setFocusMinutes(clampMinutes(e.target.value, 120))}
              disabled={isActive || isPaused}
              sx={{ width: { xs: 105, sm: 120 } }}
              slotProps={{ htmlInput: { min: 1, max: 120 } }}
            />
            <TextField
              label="Break (min)"
              type="number"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(clampMinutes(e.target.value, 30))}
              disabled={isActive || isPaused}
              sx={{ width: { xs: 105, sm: 120 } }}
              slotProps={{ htmlInput: { min: 1, max: 30 } }}
            />
          </Stack>
          <Stack direction="row" spacing={{ xs: 1, sm: 3 }} justifyContent="center" flexWrap="wrap" useFlexGap>
            <Button variant="contained" onClick={handleStart} disabled={isActive} sx={{ minWidth: { xs: 72, sm: 100 }, px: { xs: 1, sm: 2 } }}>
              {isPaused ? 'Resume' : 'Start'}
            </Button>
            <Button variant="contained" color="secondary" onClick={handlePause} disabled={!isActive} sx={{ minWidth: { xs: 72, sm: 100 }, px: { xs: 1, sm: 2 } }}>
              Pause
            </Button>
            <Button variant="outlined" onClick={handleReset} sx={{ minWidth: { xs: 72, sm: 100 }, px: { xs: 1, sm: 2 } }}>
              Reset
            </Button>
          </Stack>
          <Button variant="text" onClick={() => setBreathing((b) => !b)} sx={{ color: 'text.secondary' }}>
            {breathing ? 'Hide breathing 🫧' : 'Take a breath 🫧'}
          </Button>
          {breathing && <BreathingPudding />}
          <Box width="100%" maxWidth={480}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'left', fontSize: 16 }}>
              Pudding stickers — {stickers} collected{goldenSets > 0 ? ` · ${goldenSets} golden` : ''}
            </Typography>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                borderRadius: '20px',
                bgcolor: 'background.default',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                minHeight: 56,
                alignItems: 'center',
              }}
            >
              {stickers === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  Finish a focus session to earn your first pudding sticker! 🍮
                </Typography>
              ) : (
                Array.from({ length: Math.min(stickers, MAX_VISIBLE_STICKERS) }, (_, i) => (
                  <Pudding key={i} size={32} {...stickerProps(i)} />
                ))
              )}
              {stickers > MAX_VISIBLE_STICKERS && (
                <Typography variant="caption" color="text.secondary">
                  +{stickers - MAX_VISIBLE_STICKERS} more
                </Typography>
              )}
            </Paper>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Pomodoro;
