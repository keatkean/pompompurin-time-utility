import { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Container, Box, Tabs, Tab, CssBaseline, Paper, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimerIcon from '@mui/icons-material/Timer';
import ShutterSpeedIcon from '@mui/icons-material/ShutterSpeed';
import SchoolIcon from '@mui/icons-material/School';
import WorldClock from './components/WorldClock';
import Timer from './components/Timer';
import Stopwatch from './components/Stopwatch';
import Pomodoro from './components/Pomodoro';

const pompompurinTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#FFF8DC', // Creamy yellow
      paper: '#E6CBA8',   // Light brown
    },
    primary: {
      main: '#A67C52',    // Chocolate brown (beret)
      contrastText: '#FFF8DC',
    },
    secondary: {
      main: '#FFD1DC',    // Accent pink
    },
    text: {
      primary: '#6B4F2B', // Deep brown
      secondary: '#A67C52',
    },
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
          background: '#E6CBA8',
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
          background: '#E6CBA8',
        },
        indicator: {
          background: '#A67C52',
          height: 4,
          borderRadius: 2,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: '#A67C52',
          fontWeight: 700,
          fontSize: 14,
          minWidth: 0,
        },
      },
    },
  },
});

function App() {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <ThemeProvider theme={pompompurinTheme}>
      <CssBaseline />
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" sx={{ background: 'linear-gradient(135deg, #FFF8DC 60%, #E6CBA8 100%)' }}>
        <Container maxWidth="sm" disableGutters>
          <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
            <img
              src={`${import.meta.env.BASE_URL}pompompurin.svg`}
              alt="Pompompurin"
              width={80}
              height={80}
            />
            <Typography variant="h4" component="h1" fontWeight={700} color="primary" sx={{ mt: 1, mb: 2 }}>
              Pompompurin Time Utility
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
              <Tab icon={<TimerIcon />} label="Timer" />
              <Tab icon={<ShutterSpeedIcon />} label="Stopwatch" />
              <Tab icon={<SchoolIcon />} label="Pomodoro" />
            </Tabs>
          </Paper>
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={420}>
            <Box sx={{ display: value === 0 ? 'block' : 'none', width: '100%' }}>
              <WorldClock />
            </Box>
            <Box sx={{ display: value === 1 ? 'block' : 'none', width: '100%' }}>
              <Timer />
            </Box>
            <Box sx={{ display: value === 2 ? 'block' : 'none', width: '100%' }}>
              <Stopwatch />
            </Box>
            <Box sx={{ display: value === 3 ? 'block' : 'none', width: '100%' }}>
              <Pomodoro />
            </Box>
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
    </ThemeProvider>
  );
}

export default App;
