import { useState, useEffect, useMemo } from 'react';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  Button,
  Stack,
  Select,
  MenuItem,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { lunarInfo, utcNoon } from '../utils/lunar';
import { getLocalHour, dayPhase } from '../utils/dayPhase';
import Pudding from './Pudding';

const STORAGE_KEY = 'worldClockTimeZones';
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// The y/m/d (0-based month) that `instant` falls on in a given zone — this is
// what makes the calendar "world": near midnight the day differs by zone.
function dateInZone(instant, timeZone) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(instant)
    .reduce((acc, x) => ((acc[x.type] = x.value), acc), {});
  return { year: +p.year, month: +p.month - 1, day: +p.day };
}

function loadSavedZones() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) {
      return saved.filter((z) => typeof z?.timeZone === 'string' && typeof z?.city === 'string');
    }
  } catch {
    // Corrupted storage — just offer the local zone below.
  }
  return [];
}

const sameDay = (a, b) => a.year === b.year && a.month === b.month && a.day === b.day;

const Calendar = () => {
  const [now, setNow] = useState(() => new Date());
  const [viewingZone, setViewingZone] = useState(localZone);
  const today = dateInZone(now, viewingZone);
  const [view, setView] = useState({ year: today.year, month: today.month });
  const [selected, setSelected] = useState(today);

  // A minute's resolution is plenty for a calendar — enough to roll over at
  // midnight and keep the "current date per zone" line fresh.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  // Local zone first, then the cities saved in the World Clock — so the two
  // "world" features share one list.
  const zoneOptions = useMemo(() => {
    const opts = [{ label: 'Your time', timeZone: localZone }];
    for (const z of loadSavedZones()) {
      if (z.timeZone !== localZone) opts.push({ label: z.city, timeZone: z.timeZone });
    }
    return opts;
  }, []);

  // 42 cells (6 weeks) covering the visible month plus the spill-over days that
  // fill the first and last rows.
  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const startDow = first.getDay();
    const out = [];
    for (let i = 0; i < 42; i += 1) {
      const d = new Date(view.year, view.month, 1 - startDow + i);
      out.push({
        date: d,
        ymd: { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() },
        inMonth: d.getMonth() === view.month,
        info: lunarInfo(utcNoon(d.getFullYear(), d.getMonth() + 1, d.getDate())),
      });
    }
    return out;
  }, [view]);

  const goMonth = (delta) => {
    const m = view.month + delta;
    setView({ year: view.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 });
  };
  const goToday = () => {
    setView({ year: today.year, month: today.month });
    setSelected(today);
  };

  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // ---- Selected-day 万年历 detail ----
  const selDate = new Date(selected.year, selected.month, selected.day);
  const selInfo = lunarInfo(utcNoon(selected.year, selected.month + 1, selected.day));
  const selGregorian = selDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const selWeekdayZh = selDate.toLocaleDateString('zh-CN', { weekday: 'long' });
  const fest = selInfo.festival || selInfo.solarFestival;
  const viewingAsleep = dayPhase(getLocalHour(now, viewingZone)) === 'night';
  const selectedIsToday = sameDay(selected, today);

  const cellLunarText = (info) =>
    info.festival?.[0] || info.solarFestival?.[0] || (info.isFirstOfMonth ? info.monthName : info.dayName);

  return (
    <Box mt={6}>
      <Paper elevation={8} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, maxWidth: 600, mx: 'auto' }}>
        <Stack spacing={2} alignItems="center" width="100%">
          {/* Month navigation */}
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} width="100%">
            <IconButton onClick={() => goMonth(-1)} aria-label="Previous month" sx={{ color: 'primary.main' }}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', minWidth: 180, textAlign: 'center' }}>
              {monthLabel}
            </Typography>
            <IconButton onClick={() => goMonth(1)} aria-label="Next month" sx={{ color: 'primary.main' }}>
              <ChevronRightIcon />
            </IconButton>
            <Button size="small" variant="outlined" onClick={goToday} sx={{ minWidth: 64 }}>
              Today
            </Button>
          </Stack>

          {/* Viewing-zone selector (shared with the World Clock list) */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Viewing in
            </Typography>
            <Select
              size="small"
              value={viewingZone}
              onChange={(e) => setViewingZone(e.target.value)}
              aria-label="Viewing time zone"
              sx={{ fontWeight: 700, borderRadius: 3 }}
            >
              {zoneOptions.map((z) => (
                <MenuItem key={z.timeZone} value={z.timeZone}>
                  {z.label}
                </MenuItem>
              ))}
            </Select>
          </Stack>

          {/* Weekday header */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', width: '100%', gap: 0.5 }}>
            {WEEKDAYS.map((w) => (
              <Typography
                key={w}
                variant="caption"
                sx={{ textAlign: 'center', fontWeight: 700, color: 'text.secondary' }}
              >
                {w}
              </Typography>
            ))}
            {/* Day cells */}
            {cells.map((cell) => {
              const isToday = sameDay(cell.ymd, today);
              const isSelected = sameDay(cell.ymd, selected);
              const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;
              const festive = Boolean(cell.info.festival || cell.info.solarFestival);
              return (
                <Box
                  component="button"
                  type="button"
                  key={cell.date.toISOString()}
                  onClick={() => setSelected(cell.ymd)}
                  aria-label={`${cell.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, ${cell.info.monthName}${cell.info.dayName}`}
                  aria-pressed={isSelected}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 0.5,
                    minHeight: 52,
                    cursor: 'pointer',
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: isSelected ? 'primary.main' : 'transparent',
                    bgcolor: isToday ? 'secondary.main' : 'transparent',
                    opacity: cell.inMonth ? 1 : 0.38,
                    transition: 'border-color 0.2s, background-color 0.2s',
                    '&:hover': { bgcolor: isToday ? 'secondary.main' : 'rgba(166,124,82,0.12)' },
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: 16,
                      lineHeight: 1.1,
                      color: isToday ? '#5B4222' : isWeekend ? 'primary.main' : 'text.primary',
                    }}
                  >
                    {cell.date.getDate()}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 11,
                      lineHeight: 1.1,
                      color: festive ? '#C0392B' : isToday ? '#5B4222' : 'text.secondary',
                      fontWeight: festive ? 700 : 400,
                    }}
                  >
                    {cellLunarText(cell.info)}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* 万年历 — detail for the selected day */}
          <Paper
            elevation={2}
            sx={{ p: 2, borderRadius: 4, bgcolor: 'background.default', width: '100%' }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Pudding size={64} sleeping={viewingAsleep} />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {selGregorian}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selWeekdayZh} · 农历 {selInfo.monthName}{selInfo.dayName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selInfo.ganzhi}年 · 属{selInfo.zodiacZh}
                  {selInfo.zodiacEn ? ` (Year of the ${selInfo.zodiacEn})` : ''}
                </Typography>
                {fest && (
                  <Typography variant="body2" sx={{ color: '#C0392B', fontWeight: 700, mt: 0.5 }}>
                    {selInfo.festival && `${selInfo.festival[0]} · ${selInfo.festival[1]}`}
                    {selInfo.festival && selInfo.solarFestival ? '　' : ''}
                    {selInfo.solarFestival && `${selInfo.solarFestival[0]} · ${selInfo.solarFestival[1]}`}
                  </Typography>
                )}
              </Box>
            </Stack>

            {/* Around the world — only meaningful for "now" */}
            {selectedIsToday && zoneOptions.length > 1 && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(166,124,82,0.25)' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Right now around the world
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {zoneOptions.map((z) => {
                    const dz = dateInZone(now, z.timeZone);
                    const rolled = !sameDay(dz, today);
                    return (
                      <Typography
                        key={z.timeZone}
                        variant="caption"
                        sx={{ fontWeight: rolled ? 700 : 400, color: rolled ? 'primary.main' : 'text.secondary' }}
                      >
                        {z.label} {dz.month + 1}/{dz.day}
                        {rolled ? ' ↗' : ''}
                      </Typography>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Paper>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Calendar;
