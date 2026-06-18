import { useState, useEffect, useRef } from 'react';
import { Button, Typography, List, ListItem, ListItemText, Box, Stack, Paper } from '@mui/material';
import { formatStopwatch } from '../utils/formatTime';
import Pudding from './Pudding';

const TICK_MS = 33;
const STORAGE_KEY = 'pompompurinStopwatch';

// While running we persist the absolute anchor (= now - elapsed) so a reload
// can recompute elapsed without drift; while stopped we persist the frozen
// elapsed. Laps ride along either way so a running stopwatch survives a reload.
function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.laps)) {
      if (saved.isActive && typeof saved.anchor === 'number') {
        return { anchor: saved.anchor, isActive: true, laps: saved.laps, elapsed: Date.now() - saved.anchor };
      }
      if (typeof saved.elapsed === 'number') {
        return { anchor: 0, isActive: false, laps: saved.laps, elapsed: saved.elapsed };
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return { anchor: 0, isActive: false, laps: [], elapsed: 0 };
}

const Stopwatch = () => {
  const [restored] = useState(loadSaved);
  const [elapsed, setElapsed] = useState(restored.elapsed);
  const [isActive, setIsActive] = useState(restored.isActive);
  const [laps, setLaps] = useState(restored.laps);
  const startTimeRef = useRef(restored.anchor);

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [isActive]);

  // Persist imperatively from the handlers (not on every tick) to avoid 30
  // localStorage writes per second while the stopwatch runs.
  const persistRunning = (currentLaps) =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ anchor: startTimeRef.current, isActive: true, laps: currentLaps }));
  const persistStopped = (currentElapsed, currentLaps) => {
    if (currentElapsed > 0 || currentLaps.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ elapsed: currentElapsed, isActive: false, laps: currentLaps }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleStart = () => {
    startTimeRef.current = Date.now() - elapsed;
    setIsActive(true);
    persistRunning(laps);
  };

  const handleStop = () => {
    const stopped = Date.now() - startTimeRef.current;
    setElapsed(stopped);
    setIsActive(false);
    persistStopped(stopped, laps);
  };

  const handleLap = () => {
    const lapTime = Date.now() - startTimeRef.current;
    setElapsed(lapTime);
    const nextLaps = [...laps, lapTime];
    setLaps(nextLaps);
    persistRunning(nextLaps);
  };

  const handleReset = () => {
    setIsActive(false);
    setElapsed(0);
    setLaps([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <Box mt={6}>
      <Paper elevation={8} sx={{ p: { xs: 2.5, sm: 5 }, borderRadius: 3, maxWidth: 600, mx: 'auto' }}>
        <Stack spacing={{ xs: 3, sm: 5 }} alignItems="center">
          {/* A living pudding that jiggles while the clock runs — and sleeps
              when it's stopped, so the Stopwatch shares the app's mascot. */}
          <Box className={isActive ? 'pudding-jiggle' : undefined}>
            <Pudding size={120} sleeping={!isActive && elapsed === 0} />
          </Box>
          <Typography
            variant="h2"
            fontFamily="monospace"
            fontWeight="bold"
            sx={{ textAlign: 'center', width: '100%', fontSize: 'clamp(1.6rem, 9vw, 3.5rem)', color: 'primary.main' }}
          >
            {formatStopwatch(elapsed)}
          </Typography>
          <Stack
            direction="row"
            spacing={{ xs: 1.5, sm: 3 }}
            justifyContent="center"
            flexWrap="wrap"
            useFlexGap
          >
            <Button variant="contained" onClick={handleStart} disabled={isActive}>
              Start
            </Button>
            <Button variant="contained" color="secondary" onClick={handleStop} disabled={!isActive}>
              Stop
            </Button>
            <Button variant="contained" color="secondary" onClick={handleLap} disabled={!isActive}>
              Lap
            </Button>
            <Button variant="outlined" onClick={handleReset}>
              Reset
            </Button>
          </Stack>
          {laps.length > 0 && (
            <List sx={{ width: '100%', maxWidth: 420, mx: 'auto', borderRadius: 4, bgcolor: 'background.default' }}>
              {laps.map((lap, index) => {
                const delta = lap - (index > 0 ? laps[index - 1] : 0);
                return (
                  <ListItem key={index} divider sx={{ border: 'none' }}>
                    <ListItemText
                      primary={`Lap ${index + 1}: ${formatStopwatch(delta)}`}
                      secondary={`Total: ${formatStopwatch(lap)}`}
                      slotProps={{
                        primary: { fontWeight: 700, color: 'text.primary' },
                        secondary: { color: 'text.secondary' },
                      }}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default Stopwatch;
