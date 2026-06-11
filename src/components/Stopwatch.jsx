import { useState, useEffect, useRef } from 'react';
import { Button, Typography, List, ListItem, ListItemText, Box, Stack, Paper } from '@mui/material';
import { formatStopwatch } from '../utils/formatTime';

const TICK_MS = 33;

const Stopwatch = () => {
  const [elapsed, setElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [laps, setLaps] = useState([]);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [isActive]);

  const handleStart = () => {
    startTimeRef.current = Date.now() - elapsed;
    setIsActive(true);
  };

  const handleStop = () => {
    setElapsed(Date.now() - startTimeRef.current);
    setIsActive(false);
  };

  const handleLap = () => {
    const lapTime = Date.now() - startTimeRef.current;
    setElapsed(lapTime);
    setLaps((prev) => [...prev, lapTime]);
  };

  const handleReset = () => {
    setIsActive(false);
    setElapsed(0);
    setLaps([]);
  };

  return (
    <Box mt={6}>
      <Paper elevation={8} sx={{ p: 5, borderRadius: 3, maxWidth: 600, mx: 'auto' }}>
        <Stack spacing={5} alignItems="center">
          <Typography
            variant="h2"
            fontFamily="monospace"
            fontWeight="bold"
            sx={{ textAlign: 'center', fontSize: 56, color: 'primary.main' }}
          >
            {formatStopwatch(elapsed)}
          </Typography>
          <Stack direction="row" spacing={3} justifyContent="center">
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
