import { useState, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Container, Box, Tabs, Tab, CssBaseline, Paper, Typography, IconButton, Tooltip, Snackbar } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimerIcon from '@mui/icons-material/Timer';
import ShutterSpeedIcon from '@mui/icons-material/ShutterSpeed';
import SchoolIcon from '@mui/icons-material/School';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import WorldClock from './components/WorldClock';
import Timer from './components/Timer';
import Stopwatch from './components/Stopwatch';
import Pomodoro from './components/Pomodoro';
import Calendar from './components/Calendar';
import ErrorBoundary from './components/ErrorBoundary';
import { dayPhase } from './utils/dayPhase';

const THEME_KEY = 'pompompurinThemeMode';

// Light = creamy daytime Pompompurin; dark = the "bedtime pudding" palette
// borrowed from the World Clock's night card. Both share the pink accent.
const PALETTES = {
  light: {
    defaultBg: '#FFF8DC',
    paperBg: '#E6CBA8',
    primary: '#A67C52',
    primaryContrast: '#FFF8DC',
    textPrimary: '#6B4F2B',
    textSecondary: '#A67C52',
    tabColor: '#A67C52',
    indicator: '#A67C52',
    gradient: 'linear-gradient(135deg, #FFF8DC 60%, #E6CBA8 100%)',
  },
  dark: {
    defaultBg: '#2E2A3D',
    paperBg: '#564F6F',
    primary: '#FFD98A',
    primaryContrast: '#3E2F18',
    textPrimary: '#FFF3D6',
    textSecondary: '#E6CBA8',
    tabColor: '#E6CBA8',
    indicator: '#FFD98A',
    gradient: 'linear-gradient(135deg, #2E2A3D 60%, #564F6F 100%)',
  },
};

function makeTheme(mode) {
  const p = PALETTES[mode] ?? PALETTES.light;
  return createTheme({
    appGradient: p.gradient,
    palette: {
      mode,
      background: { default: p.defaultBg, paper: p.paperBg },
      primary: { main: p.primary, contrastText: p.primaryContrast },
      secondary: { main: '#FFD1DC' },
      text: { primary: p.textPrimary, secondary: p.textSecondary },
    },
    typography: {
      fontFamily: `'Baloo 2', 'Quicksand', 'Comic Sans MS', cursive, sans-serif`,
      h2: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      button: { fontWeight: 700 },
    },
    shape: {
      borderRadius: 24,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            background: p.paperBg,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            fontWeight: 700,
            minWidth: 100,
            fontSize: 16,
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            borderRadius: 32,
            background: p.paperBg,
          },
          indicator: {
            background: p.indicator,
            height: 4,
            borderRadius: 2,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            color: p.tabColor,
            fontWeight: 700,
            fontSize: 14,
            minWidth: 0,
          },
        },
      },
    },
  });
}

// Greeting based on the visitor's own local time — reuses the World Clock's
// day/night phase buckets so the mascot's mood matches the clock cards.
const GREETINGS = {
  dawn: 'Good morning! 🌅',
  day: 'Hello there! ☀️',
  dusk: 'Good evening! 🌇',
  night: "Shh… Pompompurin's sleepy 🌙",
};

const currentGreeting = () => GREETINGS[dayPhase(new Date().getHours())];

function initialMode() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Storage blocked — fall through to the system preference.
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function App() {
  const [value, setValue] = useState(0);
  const [mode, setMode] = useState(initialMode);
  const [welcomeBack, setWelcomeBack] = useState(false);
  const [greeting, setGreeting] = useState(currentGreeting);
  const theme = useMemo(() => makeTheme(mode), [mode]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch {
      // Persisting the preference is best-effort.
    }
  }, [mode]);

  // Greet the user when they return after stepping away for a while — and
  // refresh the time-of-day greeting, which may have gone stale while hidden.
  useEffect(() => {
    let hiddenAt = null;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }
      setGreeting(currentGreeting());
      if (hiddenAt && Date.now() - hiddenAt > 60000) {
        setWelcomeBack(true);
      }
      hiddenAt = null;
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const toggleMode = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" sx={{ background: theme.appGradient }}>
        <Container maxWidth="sm" disableGutters sx={{ position: 'relative' }}>
          <Tooltip title={mode === 'dark' ? 'Switch to day mode' : 'Switch to night mode'}>
            <IconButton
              onClick={toggleMode}
              aria-label={mode === 'dark' ? 'Switch to day mode' : 'Switch to night mode'}
              sx={{ position: 'absolute', top: 8, right: 8, color: 'primary.main', zIndex: 1 }}
            >
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
          <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
            <img
              src={`${import.meta.env.BASE_URL}pompompurin.svg`}
              alt="Pompompurin"
              width={80}
              height={80}
            />
            <Typography variant="h4" component="h1" fontWeight={700} color="primary" sx={{ mt: 1, mb: 0.5 }}>
              Pompompurin Time Utility
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2, fontWeight: 700 }}>
              {greeting}
            </Typography>
          </Box>
          <Paper elevation={6} sx={{ p: 2, mb: 4, borderRadius: 6, maxWidth: 520, mx: 'auto' }}>
            <Tabs
              value={value}
              onChange={handleChange}
              centered
              variant="fullWidth"
            >
              <Tab icon={<AccessTimeIcon />} label="World Clock" />
              <Tab icon={<CalendarMonthIcon />} label="Calendar" />
              <Tab icon={<TimerIcon />} label="Timer" />
              <Tab icon={<ShutterSpeedIcon />} label="Stopwatch" />
              <Tab icon={<SchoolIcon />} label="Pomodoro" />
            </Tabs>
          </Paper>
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={420}>
            <ErrorBoundary>
              <Box sx={{ display: value === 0 ? 'block' : 'none', width: '100%' }}>
                <WorldClock />
              </Box>
              <Box sx={{ display: value === 1 ? 'block' : 'none', width: '100%' }}>
                <Calendar />
              </Box>
              <Box sx={{ display: value === 2 ? 'block' : 'none', width: '100%' }}>
                <Timer />
              </Box>
              <Box sx={{ display: value === 3 ? 'block' : 'none', width: '100%' }}>
                <Stopwatch />
              </Box>
              <Box sx={{ display: value === 4 ? 'block' : 'none', width: '100%' }}>
                <Pomodoro />
              </Box>
            </ErrorBoundary>
          </Box>
          <Typography
            variant="caption"
            component="footer"
            sx={{ display: 'block', textAlign: 'center', color: 'text.secondary', mt: 4, mb: 2, px: 2 }}
          >
            Unofficial fan project — Pompompurin © Sanrio Co., Ltd. Not affiliated with or endorsed by Sanrio.
          </Typography>
        </Container>
      </Box>
      <Snackbar
        open={welcomeBack}
        autoHideDuration={3500}
        onClose={() => setWelcomeBack(false)}
        message="Welcome back! Pompompurin missed you 🍮"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </ThemeProvider>
  );
}

export default App;
