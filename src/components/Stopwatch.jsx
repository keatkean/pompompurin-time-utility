import React, { useState, useEffect, useRef } from 'react';
import { Button, Typography, List, ListItem, ListItemText, Box, Stack, Paper } from '@mui/material';

const Stopwatch = () => {
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [laps, setLaps] = useState([]);
  const countRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      countRef.current = setInterval(() => {
        setTime((time) => time + 10);
      }, 10);
    } else {
      clearInterval(countRef.current);
    }
    return () => clearInterval(countRef.current);
  }, [isActive]);

  const handleStart = () => {
    setIsActive(true);
  };

  const handleStop = () => {
    setIsActive(false);
  };

  const handleLap = () => {
    setLaps([...laps, time]);
  };

  const handleReset = () => {
    setIsActive(false);
    setTime(0);
    setLaps([]);
  };

  const formatTime = (timeInMs) => {
    const hours = Math.floor(timeInMs / 3600000).toString().padStart(2, '0');
    const minutes = Math.floor((timeInMs % 3600000) / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((timeInMs % 60000) / 1000).toString().padStart(2, '0');
    const milliseconds = (timeInMs % 1000).toString().padStart(3, '0').slice(0, 2);
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  };

  return (
    <Box mt={6}>
      <Paper elevation={8} sx={{ p: 5, borderRadius: 8, maxWidth: 600, mx: 'auto', bgcolor: '#3a3c42', boxShadow: 8 }}>
        <Stack spacing={5} alignItems="center">
          <Typography
            variant="h2"
            fontFamily="monospace"
            fontWeight="bold"
            mb={2}
            sx={{
              textAlign: 'center',
              fontSize: 56,
              color: '#A67C52',
            }}
          >
            {formatTime(time)}
          </Typography>
          <Stack direction="row" spacing={3} justifyContent="center" sx={{ mt: 2, mb: 2 }}>
            <Button variant="contained" onClick={handleStart} disabled={isActive}
              sx={{ minWidth: 100, borderRadius: 6, bgcolor: '#90caf9', color: '#222', fontWeight: 'bold', fontSize: 18, '&:hover': { bgcolor: '#b3e5fc' } }}>
              Start
            </Button>
            <Button variant="contained" onClick={handleStop} disabled={!isActive}
              sx={{ minWidth: 100, borderRadius: 6, bgcolor: '#616161', color: '#fff', fontWeight: 'bold', fontSize: 18, '&:hover': { bgcolor: '#757575' } }}>
              Stop
            </Button>
            <Button variant="contained" onClick={handleLap} disabled={!isActive}
              sx={{ minWidth: 100, borderRadius: 6, bgcolor: '#616161', color: '#fff', fontWeight: 'bold', fontSize: 18, '&:hover': { bgcolor: '#757575' } }}>
              Lap
            </Button>
            <Button variant="contained" onClick={handleReset}
              sx={{ minWidth: 100, borderRadius: 6, bgcolor: '#90caf9', color: '#222', fontWeight: 'bold', fontSize: 18, '&:hover': { bgcolor: '#b3e5fc' } }}>
              Reset
            </Button>
          </Stack>
          <List sx={{ width: '100%', maxWidth: 420, mx: 'auto', borderRadius: 4, bgcolor: '#23272F', mt: 2, boxShadow: 2 }}>
            {laps.map((lap, index) => (
              <ListItem key={index} divider sx={{ border: 'none' }}>
                <ListItemText
                  primary={`Lap ${index + 1}: ${formatTime(lap)}`}
                  primaryTypographyProps={{ style: { color: '#6B4F2B', fontWeight: 700 } }}
                />
              </ListItem>
            ))}
          </List>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Stopwatch;
