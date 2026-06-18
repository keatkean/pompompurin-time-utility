import { useState, useEffect, useMemo } from 'react';
import {
  Paper,
  Typography,
  Button,
  Autocomplete,
  TextField,
  Stack,
  Box,
  IconButton,
  Slider,
  createFilterOptions
} from '@mui/material';
import AddCircle from '@mui/icons-material/AddCircle';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Snackbar from '@mui/material/Snackbar';
import { getLocalHour, dayPhase, isPoliteHour, PHASE_STYLES } from '../utils/dayPhase';
import { TZ_OPTIONS, cityFromTimeZone, getOffsetMinutes, formatOffset } from '../utils/timezones';
import Pudding from './Pudding';

const STORAGE_KEY = 'worldClockTimeZones';
const DEFAULT_TIME_ZONES = [{ city: 'Singapore', timeZone: 'Asia/Singapore' }];

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

const URL_PARAM = 'tz';

// A shareable clock lives in the URL: `?tz=Asia/Singapore,Europe/London`.
// Returns null when there is no usable `tz` param so the caller can fall back
// to localStorage. Invalid zones are dropped (never thrown on) and duplicates
// are collapsed, so a hand-edited or stale link can't crash or double up.
function timeZonesFromUrl() {
  try {
    const raw = new URLSearchParams(window.location.search).get(URL_PARAM);
    if (!raw) return null;
    const seen = new Set();
    const result = [];
    for (const zone of raw.split(',').map((z) => z.trim())) {
      if (zone && isValidTimeZone(zone) && !seen.has(zone)) {
        seen.add(zone);
        result.push({ city: cityFromTimeZone(zone), timeZone: zone });
      }
    }
    return result.length > 0 ? result : null;
  } catch {
    return null;
  }
}

// Precedence on load: a shared link wins, then the last-saved list, then the
// default — so opening someone's link shows their clock, not yours.
function loadInitialTimeZones() {
  return timeZonesFromUrl() ?? loadSavedTimeZones();
}

// The overlap strip spans a full day around "now": −12h … +12h, one cell/hour.
const OVERLAP_OFFSETS = Array.from({ length: 25 }, (_, i) => i - 12);

const WorldClock = () => {
  const [timeZones, setTimeZones] = useState(loadInitialTimeZones);
  const [selectedTimeZone, setSelectedTimeZone] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [scrubOffset, setScrubOffset] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 500);
    return () => clearInterval(id);
  }, []);

  // Keep the clock in both localStorage (this device) and the URL (so the link
  // in the address bar is always a shareable snapshot of the current list).
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timeZones));
    try {
      const url = new URL(window.location.href);
      url.searchParams.set(URL_PARAM, timeZones.map((tz) => tz.timeZone).join(','));
      window.history.replaceState(null, '', url);
    } catch {
      // History/URL unavailable (e.g. sandboxed) — localStorage still persists.
    }
  }, [timeZones]);

  const handleCopyLink = () => {
    let link = window.location.href;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set(URL_PARAM, timeZones.map((tz) => tz.timeZone).join(','));
      link = url.toString();
    } catch {
      // Fall back to the current href, which the effect above already synced.
    }
    // Clipboard API needs a secure context; if it's missing the address bar
    // already holds the shareable link, so still show the confirmation.
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopied(true);
  };

  // Live UTC offset + local time for every zone, shown in the picker so you can
  // choose by offset. Recomputed once a minute (offsets only shift at DST
  // boundaries), keyed off the current minute rather than the 500ms tick.
  const minuteKey = Math.floor(now.getTime() / 60000);
  const zoneInfo = useMemo(() => {
    const at = new Date(minuteKey * 60000);
    const map = new Map();
    for (const opt of TZ_OPTIONS) {
      map.set(opt.timeZone, {
        offsetLabel: formatOffset(getOffsetMinutes(opt.timeZone, at)),
        timeLabel: at.toLocaleTimeString('en-US', {
          timeZone: opt.timeZone,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
      });
    }
    return map;
  }, [minuteKey]);

  // Search across the precomputed terms (city, region, id, country, hints) plus
  // the live UTC offset, so "malaysia", "uk", or "+8" all find the right zone.
  const filterTimeZones = useMemo(
    () =>
      createFilterOptions({
        stringify: (option) => `${option.search} ${zoneInfo.get(option.timeZone)?.offsetLabel ?? ''}`,
      }),
    [zoneInfo]
  );

  const handleAddTimeZone = () => {
    if (selectedTimeZone && !timeZones.some((tz) => tz.timeZone === selectedTimeZone.timeZone)) {
      setTimeZones([
        ...timeZones,
        { city: selectedTimeZone.label, timeZone: selectedTimeZone.timeZone }
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

  // For each hour around "now", how many added zones are in friendly calling
  // hours. Anchored to the top of the current hour (not the live second) so the
  // strip is stable and only recomputes when the hour rolls over.
  const hourKey = Math.floor(now.getTime() / 3600000);
  const baseMs = hourKey * 3600000;
  const overlap = useMemo(() => {
    const base = hourKey * 3600000;
    return OVERLAP_OFFSETS.map((offset) => {
      const at = new Date(base + offset * 3600000);
      let polite = 0;
      timeZones.forEach((tz) => {
        if (isPoliteHour(getLocalHour(at, tz.timeZone))) polite += 1;
      });
      return { offset, polite, all: polite === timeZones.length };
    });
  }, [hourKey, timeZones]);

  // The longest contiguous run where every zone is in friendly hours.
  const bestWindow = useMemo(() => {
    let best = null;
    let run = null;
    overlap.forEach((cell) => {
      if (cell.all) {
        run = run ? { start: run.start, end: cell.offset } : { start: cell.offset, end: cell.offset };
        if (!best || run.end - run.start > best.end - best.start) best = run;
      } else {
        run = null;
      }
    });
    return best;
  }, [overlap]);

  const localHourLabel = (offset) =>
    new Date(baseMs + offset * 3600000).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

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
              {timeZones.length > 1 ? '🍮 Best time to reach everyone' : `When ${timeZones[0].city} is awake`}
            </Typography>
            <Box sx={{ display: 'flex', gap: '2px', width: '100%' }}>
              {overlap.map((cell) => (
                <Box
                  component="button"
                  type="button"
                  key={cell.offset}
                  onClick={() => setScrubOffset(cell.offset)}
                  aria-label={`Preview ${localHourLabel(cell.offset)} your time — ${cell.polite} of ${timeZones.length} awake`}
                  title={`${localHourLabel(cell.offset)} · ${cell.polite}/${timeZones.length} awake`}
                  sx={{
                    flex: 1,
                    height: 26,
                    p: 0,
                    borderRadius: '4px',
                    border: '2px solid',
                    borderColor: cell.offset === scrubOffset ? 'primary.main' : 'transparent',
                    cursor: 'pointer',
                    bgcolor: cell.all
                      ? '#8BC34A'
                      : cell.polite > 0
                        ? 'rgba(139, 195, 74, 0.28)'
                        : 'rgba(120, 110, 90, 0.18)',
                    transition: 'border-color 0.2s, background-color 0.3s',
                    '&:hover': { filter: 'brightness(1.08)' },
                  }}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.25 }}>
              <Typography variant="caption" color="text.secondary">−12h</Typography>
              <Typography variant="caption" color="text.secondary">now</Typography>
              <Typography variant="caption" color="text.secondary">+12h</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {bestWindow
                ? `${timeZones.length > 1 ? "Everyone's awake" : 'Awake'} ${localHourLabel(bestWindow.start)}–${localHourLabel(bestWindow.end + 1)} your time. Tap a slot to jump there.`
                : 'No single hour works for every zone — try removing a far-flung one.'}
            </Typography>
          </Box>
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
                options={TZ_OPTIONS}
                value={selectedTimeZone}
                onChange={(event, newValue) => setSelectedTimeZone(newValue)}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) => option.timeZone === value.timeZone}
                getOptionDisabled={(option) => timeZones.some((tz) => tz.timeZone === option.timeZone)}
                groupBy={(option) => option.region}
                filterOptions={filterTimeZones}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  const info = zoneInfo.get(option.timeZone);
                  return (
                    <Box
                      component="li"
                      key={key}
                      {...optionProps}
                      sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 15, color: 'text.primary' }} noWrap>
                          {option.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.region}
                        </Typography>
                      </Box>
                      {info && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ whiteSpace: 'nowrap', textAlign: 'right' }}
                        >
                          {info.offsetLabel} · {info.timeLabel}
                        </Typography>
                      )}
                    </Box>
                  );
                }}
                fullWidth
                renderInput={(params) => <TextField {...params} label="Add a city or time zone" />}
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
          <Button
            onClick={handleCopyLink}
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            sx={{ alignSelf: 'center' }}
          >
            Copy shareable link
          </Button>
        </Stack>
      </Paper>
      <Snackbar
        open={copied}
        autoHideDuration={2500}
        onClose={() => setCopied(false)}
        message="Link copied — share your clock! 🍮"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default WorldClock;
