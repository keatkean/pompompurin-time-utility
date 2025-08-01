import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Stack, Paper, Box, Alert } from '@mui/material';

const Timer = () => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0);
  const [initialTime, setInitialTime] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime((time) => time - 1);
      }, 1000);
    } else if (!isActive && time !== 0) {
      clearInterval(interval);
    } else if (time === 0 && isActive) {
      setIsActive(false);
      playAlert();
      showNotification();
    }
    return () => clearInterval(interval);
  }, [isActive, time]);

  // When user sets a new time, update initialTime
  useEffect(() => {
    const total = hours * 3600 + minutes * 60 + seconds;
    if (!isActive) {
      setInitialTime(total);
    }
  }, [hours, minutes, seconds, isActive]);

  // Show warning if time <= 10% of initialTime and timer is running
  useEffect(() => {
    if (initialTime > 0 && time / initialTime <= 0.1 && isActive && time > 0) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [time, initialTime, isActive]);

  const handleStart = () => {
    setTime(hours * 3600 + minutes * 60 + seconds);
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setTime(0);
    setHours(0);
    setMinutes(0);
    setSeconds(0);
  };

  const playAlert = () => {
    const audio = new Audio('/beep-07a.wav');
    audio.play();
  };

  const showNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('Timer Finished!');
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification('Timer Finished!');
        }
      });
    }
  };

  const formatTime = (timeInSeconds) => {
    const h = Math.floor(timeInSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((timeInSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (timeInSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <Box mt={6}>
      <Paper elevation={8} sx={{ p: 5, borderRadius: 8, maxWidth: 600, mx: 'auto', bgcolor: '#3a3c42', boxShadow: 8 }}>
        <Stack spacing={5} alignItems="center">
          {showWarning && (
            <Alert severity="warning" sx={{ fontWeight: 'bold', fontSize: 18, mb: 1 }}>
              Hurry up! Less than 10% time remaining.
            </Alert>
          )}
          <Typography
            variant="h2"
            fontFamily="monospace"
            fontWeight="bold"
            mb={2}
            sx={{
              textAlign: 'center',
              fontSize: 56,
              color: showWarning ? '#FF9800' : '#A67C52',
              transition: 'color 0.3s',
            }}
          >
            {formatTime(time)}
          </Typography>
          <Stack direction="row" spacing={3} justifyContent="center" sx={{ mb: 2 }}>
            <TextField
              label="Hours"
              type="number"
              value={hours}
              onChange={(e) => setHours(parseInt(e.target.value, 10))}
              sx={{ width: 90, borderRadius: 3, bgcolor: '#23272F' }}
              disabled={isActive}
              InputProps={{ style: { borderRadius: 12, fontSize: 20, fontFamily: 'monospace', color: '#A67C52', fontWeight: 700 } }}
              InputLabelProps={{ style: { color: '#6B4F2B', fontWeight: 700 } }}
            />
            <TextField
              label="Minutes"
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
              sx={{ width: 90, borderRadius: 3, bgcolor: '#23272F' }}
              disabled={isActive}
              InputProps={{ style: { borderRadius: 12, fontSize: 20, fontFamily: 'monospace', color: '#A67C52', fontWeight: 700 } }}
              InputLabelProps={{ style: { color: '#6B4F2B', fontWeight: 700 } }}
            />
            <TextField
              label="Seconds"
              type="number"
              value={seconds}
              onChange={(e) => setSeconds(parseInt(e.target.value, 10))}
              sx={{ width: 90, borderRadius: 3, bgcolor: '#23272F' }}
              disabled={isActive}
              InputProps={{ style: { borderRadius: 12, fontSize: 20, fontFamily: 'monospace', color: '#A67C52', fontWeight: 700 } }}
              InputLabelProps={{ style: { color: '#6B4F2B', fontWeight: 700 } }}
            />
          </Stack>
          <Stack direction="row" spacing={3} justifyContent="center">
            <Button variant="contained" onClick={handleStart} disabled={isActive}
              sx={{ minWidth: 100, borderRadius: 6, bgcolor: '#90caf9', color: '#222', fontWeight: 'bold', fontSize: 18, '&:hover': { bgcolor: '#b3e5fc' } }}>
              Start
            </Button>
            <Button variant="contained" onClick={handlePause} disabled={!isActive}
              sx={{ minWidth: 100, borderRadius: 6, bgcolor: '#616161', color: '#fff', fontWeight: 'bold', fontSize: 18, '&:hover': { bgcolor: '#757575' } }}>
              Pause
            </Button>
            <Button variant="contained" onClick={handleReset}
              sx={{ minWidth: 100, borderRadius: 6, bgcolor: '#90caf9', color: '#222', fontWeight: 'bold', fontSize: 18, '&:hover': { bgcolor: '#b3e5fc' } }}>
              Reset
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};
export default Timer;
