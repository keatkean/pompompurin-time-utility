import { useState, useEffect, useRef } from 'react';
import { TextField, Button, Typography, Stack, Paper, Box, Chip } from '@mui/material';
import { formatDuration } from '../utils/formatTime';
import { initAudio, playCompletionSound, requestNotificationPermission, notify } from '../utils/alerts';
import Pudding from './Pudding';

const SESSION_KEY = 'pompompurinPomodoroSession';
const STICKERS_KEY = 'pompompurinPomodoroStickers';
const MAX_VISIBLE_STICKERS = 24;

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
// refresh resumes mid-focus or mid-break.
function loadSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (saved && typeof saved.endTime === 'number' && (saved.phase === 'focus' || saved.phase === 'break')) {
      const remaining = Math.ceil((saved.endTime - Date.now()) / 1000);
      if (remaining > 0) return { ...saved, remaining };
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
  const [isActive, setIsActive] = useState(Boolean(restored));
  const [timeLeft, setTimeLeft] = useState(restored?.remaining ?? 0);
  const [stickers, setStickers] = useState(loadStickers);
  const endTimeRef = useRef(restored?.endTime ?? 0);

  useEffect(() => {
    localStorage.setItem(STICKERS_KEY, JSON.stringify(stickers));
  }, [stickers]);

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining > 0) return;
      playCompletionSound();
      if (phase === 'focus') {
        // Focus complete: earn a sticker and roll straight into the break.
        setStickers((n) => n + 1);
        notify('Focus complete! Break time 🍮');
        const total = breakMinutes * 60;
        const endTime = Date.now() + total * 1000;
        endTimeRef.current = endTime;
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
    }, 250);
    return () => clearInterval(id);
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
      setIsActive(true);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ endTime, phase, focusMinutes, breakMinutes }));
      return;
    }
    const total = focusMinutes * 60;
    const endTime = Date.now() + total * 1000;
    endTimeRef.current = endTime;
    setPhase('focus');
    setTimeLeft(total);
    setIsActive(true);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ endTime, phase: 'focus', focusMinutes, breakMinutes }));
  };

  const handlePause = () => {
    setIsActive(false);
    localStorage.removeItem(SESSION_KEY);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(0);
    setPhase('focus');
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <Box mt={6}>
      <Paper elevation={8} sx={{ p: 5, borderRadius: 3, maxWidth: 600, mx: 'auto' }}>
        <Stack spacing={4} alignItems="center">
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
          <Pudding fraction={phase === 'focus' ? puddingFraction : 1} sleeping={phase === 'break'} size={150} />
          <Typography
            variant="h2"
            fontFamily="monospace"
            fontWeight="bold"
            sx={{ textAlign: 'center', fontSize: 56, color: 'primary.main' }}
          >
            {formatDuration(displayTime)}
          </Typography>
          <Stack direction="row" spacing={3} justifyContent="center">
            <TextField
              label="Focus (min)"
              type="number"
              value={focusMinutes}
              onChange={(e) => setFocusMinutes(clampMinutes(e.target.value, 120))}
              disabled={isActive || isPaused}
              sx={{ width: 120 }}
              slotProps={{ htmlInput: { min: 1, max: 120 } }}
            />
            <TextField
              label="Break (min)"
              type="number"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(clampMinutes(e.target.value, 30))}
              disabled={isActive || isPaused}
              sx={{ width: 120 }}
              slotProps={{ htmlInput: { min: 1, max: 30 } }}
            />
          </Stack>
          <Stack direction="row" spacing={3} justifyContent="center">
            <Button variant="contained" onClick={handleStart} disabled={isActive}>
              {isPaused ? 'Resume' : 'Start'}
            </Button>
            <Button variant="contained" color="secondary" onClick={handlePause} disabled={!isActive}>
              Pause
            </Button>
            <Button variant="outlined" onClick={handleReset}>
              Reset
            </Button>
          </Stack>
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
                  <Pudding key={i} size={32} golden={(i + 1) % 4 === 0} />
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
