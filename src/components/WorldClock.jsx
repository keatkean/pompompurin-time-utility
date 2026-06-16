import { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Button,
  Autocomplete,
  TextField,
  Stack,
  Box,
  IconButton,
  Slider
} from '@mui/material';
import AddCircle from '@mui/icons-material/AddCircle';
import CloseIcon from '@mui/icons-material/Close';
import { getLocalHour, dayPhase, isPoliteHour, PHASE_STYLES } from '../utils/dayPhase';
import Pudding from './Pudding';

const STORAGE_KEY = 'worldClockTimeZones';
const DEFAULT_TIME_ZONES = [{ city: 'Singapore', timeZone: 'Asia/Singapore' }];

// Used only where Intl.supportedValuesOf is unavailable (older Safari / some
// webviews) — a real list keeps the "Add Time Zone" picker usable instead of
// offering the single already-added default.
const FALLBACK_TIME_ZONES = [
  'Asia/Singapore', 'America/New_York', 'America/Los_Angeles', 'America/Chicago',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
  'Asia/Kolkata', 'Asia/Dubai', 'Australia/Sydney', 'Pacific/Auckland', 'UTC',
];

const timeZoneNames =
  typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('timeZone')
    : FALLBACK_TIME_ZONES;

// A persisted timeZone string must be a real IANA zone — otherwise the render
// path (toLocaleTimeString / Intl.DateTimeFormat) throws an uncaught RangeError
// that, with no error boundary, blanks the whole app on every reload.
const isValidTimeZone = (timeZone) => {
  if (typeof timeZone !== 'string') return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
};

function loadSavedTimeZones() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (
      Array.isArray(saved) &&
      saved.length > 0 &&
      saved.every((tz) => isValidTimeZone(tz?.timeZone) && typeof tz?.city === 'string')
    ) {
      return saved;
    }
  } catch {
    // Corrupted storage — fall back to the defaults below.
  }
  return DEFAULT_TIME_ZONES;
}

const cityFromTimeZone = (timeZone) => timeZone.split('/').pop().replaceAll('_', ' ');

const WorldClock = () => {
  const [timeZones, setTimeZones] = useState(loadSavedTimeZones);
  const [selectedTimeZone, setSelectedTimeZone] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [scrubOffset, setScrubOffset] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timeZones));
  }, [timeZones]);

  const handleAddTimeZone = () => {
    if (selectedTimeZone && !timeZones.some((tz) => tz.timeZone === selectedTimeZone)) {
      setTimeZones([
        ...timeZones,
        { city: cityFromTimeZone(selectedTimeZone), timeZone: selectedTimeZone }
      ]);
      setSelectedTimeZone(null);
    }
  };

  const handleRemoveTimeZone = (timeZoneToRemove) => {
    // Keep at least one clock — an empty list renders a confusing blank panel
    // and would silently be replaced by the default on the next reload anyway.
    if (timeZones.length <= 1) return;
    setTimeZones(timeZones.filter((tz) => tz.timeZone !== timeZoneToRemove));
  };

  const scrubbing = scrubOffset !== 0;
  const displayed = scrubbing ? new Date(now.getTime() + scrubOffset * 3600000) : now;

  return (
    <Box mt={6}>
      <Paper elevation={8} sx={{ p: 5, borderRadius: 3, maxWidth: 600, mx: 'auto' }}>
        <Stack spacing={4} alignItems="center" width="100%">
          <Stack spacing={4} width="100%" alignItems="center">
            {timeZones.map((tz) => {
              const date = displayed.toLocaleDateString('en-US', {
                timeZone: tz.timeZone,
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
              const timeString = displayed.toLocaleTimeString('en-US', { timeZone: tz.timeZone, hour12: true });
              const hour = getLocalHour(displayed, tz.timeZone);
              const phase = PHASE_STYLES[dayPhase(hour)];
              const polite = isPoliteHour(hour);
              return (
                <Paper
                  key={tz.timeZone}
                  elevation={4}
                  sx={{
                    p: 4,
                    borderRadius: 6,
                    maxWidth: 480,
                    bgcolor: phase.bg,
                    width: '100%',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    border: '3px solid',
                    borderColor: scrubbing && polite ? '#8BC34A' : 'transparent',
                    opacity: scrubbing && !polite ? 0.85 : 1,
                    transition: 'background-color 0.4s, border-color 0.3s, opacity 0.3s',
                  }}
                >
                  <Box sx={{ position: 'relative', width: '100%', mb: 1 }}>
                    <Typography sx={{ textAlign: 'center', fontSize: 32, fontWeight: 700, color: phase.accent }} variant="h5">
                      {tz.city}
                    </Typography>
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Pudding size={36} sleeping={dayPhase(hour) === 'night'} />
                      {dayPhase(hour) === 'night' && <Typography sx={{ fontSize: 13, color: phase.text }}>💤</Typography>}
                    </Box>
                    <IconButton
                      onClick={() => handleRemoveTimeZone(tz.timeZone)}
                      size="small"
                      aria-label={`Remove ${tz.city}`}
                      disabled={timeZones.length <= 1}
                      sx={{
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: phase.accent,
                        bgcolor: phase.closeBg,
                        '&:hover': { bgcolor: phase.closeBg, filter: 'brightness(1.15)' },
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography sx={{ mb: 2, textAlign: 'center', fontSize: 18, fontWeight: 700, color: phase.text }}>
                    {phase.icon} {date}
                  </Typography>
                  <Typography
                    variant="h2"
                    fontFamily="monospace"
                    fontWeight="bold"
                    sx={{ textAlign: 'center', fontSize: 48, color: phase.accent }}
                  >
                    {timeString}
                  </Typography>
                </Paper>
              );
            })}
          </Stack>
          <Box width="100%" maxWidth={480}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, textAlign: 'left', fontSize: 16 }}>
              Time travel — preview other hours {scrubbing ? `(${scrubOffset > 0 ? '+' : ''}${scrubOffset}h)` : '(now)'}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Slider
                value={scrubOffset}
                onChange={(event, value) => setScrubOffset(value)}
                min={-12}
                max={12}
                step={1}
                marks={[{ value: 0, label: '' }]}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => (v > 0 ? `+${v}h` : `${v}h`)}
                aria-label="Time travel offset in hours"
              />
              <Button
                size="small"
                variant="outlined"
                onClick={() => setScrubOffset(0)}
                sx={{ minWidth: 64, visibility: scrubbing ? 'visible' : 'hidden' }}
              >
                Now
              </Button>
            </Stack>
            {scrubbing && (
              <Typography variant="caption" color="text.secondary">
                Green border = friendly calling hours (8am–10pm local)
              </Typography>
            )}
          </Box>
          <Box width="100%" maxWidth={480}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'left', fontSize: 16 }}>
              Add another time zone
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Autocomplete
                options={timeZoneNames}
                value={selectedTimeZone}
                onChange={(event, newValue) => setSelectedTimeZone(newValue)}
                getOptionDisabled={(option) => timeZones.some((tz) => tz.timeZone === option)}
                fullWidth
                renderInput={(params) => <TextField {...params} label="Add Time Zone" />}
              />
              <Button
                onClick={handleAddTimeZone}
                variant="contained"
                aria-label="Add time zone"
                disabled={!selectedTimeZone}
                sx={{ minWidth: 56, height: 56 }}
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
