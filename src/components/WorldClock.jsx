import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Button,
  Autocomplete,
  TextField,
  Stack,
  Box,
  IconButton
} from '@mui/material';
import AddCircle from '@mui/icons-material/AddCircle';
import CloseIcon from '@mui/icons-material/Close';
import timeZoneNames from './timeZoneNames';

const WorldClock = () => {
  const [timeZones, setTimeZones] = useState([
    { city: 'Singapore', timeZone: 'Asia/Singapore' }
  ]);
  const [selectedTimeZone, setSelectedTimeZone] = useState(null);

  useEffect(() => {
    // Load from localStorage on mount
    const saved = localStorage.getItem('worldClockTimeZones');
    if (saved) {
      setTimeZones(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Save to localStorage on change
    localStorage.setItem('worldClockTimeZones', JSON.stringify(timeZones));
  }, [timeZones]);

  const handleAddTimeZone = () => {
    if (selectedTimeZone && !timeZones.some(tz => tz.timeZone === selectedTimeZone)) {
      const city = selectedTimeZone.split('/').pop().replace('_', ' ');
      setTimeZones([...timeZones, { city, timeZone: selectedTimeZone }]);
      setSelectedTimeZone(null);
    }
  };

  const handleRemoveTimeZone = (timeZoneToRemove) => {
    setTimeZones(timeZones.filter(tz => tz.timeZone !== timeZoneToRemove));
  };

  return (
    <Box mt={6}>
      <Paper elevation={8} sx={{ p: 5, borderRadius: 8, maxWidth: 600, mx: 'auto', bgcolor: '#3a3c42', boxShadow: 8 }}>
        <Stack spacing={5} alignItems="center" width="100%">
          <Stack spacing={4} width="100%">
            {timeZones.map((tz) => {
              const now = new Date();
              const date = now.toLocaleDateString('en-US', {
                timeZone: tz.timeZone,
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
              const timeString = now.toLocaleTimeString('en-US', { timeZone: tz.timeZone, hour12: true });
              return (
                <Paper
                  key={tz.timeZone}
                  elevation={4}
                  sx={{
                    p: 4,
                    borderRadius: 6,
                    maxWidth: 480,
                    mx: 'auto',
                    bgcolor: '#23272F',
                    boxShadow: 4,
                    width: '100%',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <IconButton
                    onClick={() => handleRemoveTimeZone(tz.timeZone)}
                    size="small"
                    aria-label={`Remove ${tz.city}`}
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      color: 'primary.light',
                      bgcolor: 'transparent',
                      transition: 'background 0.2s',
                      '&:hover': {
                        bgcolor: 'rgba(144,202,249,0.15)',
                        color: 'primary.main',
                      },
                      zIndex: 1,
                    }}
                  >
                    <CloseIcon fontSize="medium" />
                  </IconButton>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 1, textAlign: 'center', fontSize: 32, color: '#A67C52' }}>
                    {tz.city}
                  </Typography>
                  <Typography color="text.secondary" mb={2} sx={{ textAlign: 'center', fontSize: 18, color: '#6B4F2B', fontWeight: 700 }}>
                    {date}
                  </Typography>
                  <Typography variant="h2" fontFamily="monospace" fontWeight="bold" sx={{ textAlign: 'center', fontSize: 48, mb: 2, color: '#A67C52' }}>
                    {timeString}
                  </Typography>
                </Paper>
              );
            })}
          </Stack>
          <Box width="100%" maxWidth={480}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'left', fontSize: 16 }}>
              Add another time zone
            </Typography>
            <Stack direction="row" spacing={2} maxWidth={480} mx="auto" width="100%" alignItems="center">
              <Autocomplete
                options={timeZoneNames}
                value={selectedTimeZone}
                onChange={(event, newValue) => {
                  setSelectedTimeZone(newValue);
                }}
                fullWidth
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Add Time Zone"
                    variant="outlined"
                    sx={{ borderRadius: 3, bgcolor: '#23272F' }}
                    InputProps={{ ...params.InputProps, style: { borderRadius: 12, fontSize: 18, fontFamily: 'monospace' } }}
                  />
                )}
                slots={{ paper: (props) => <Paper {...props} sx={{ borderRadius: 3, boxShadow: 4 }} /> }}
              />
              <Button
                onClick={handleAddTimeZone}
                variant="contained"
                sx={{ minWidth: 56, borderRadius: 6, boxShadow: 2, bgcolor: '#90caf9', color: '#222', fontWeight: 'bold', fontSize: 22, height: 56, '&:hover': { bgcolor: '#b3e5fc' } }}
              >
                <AddCircle fontSize="large" />
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default WorldClock;
