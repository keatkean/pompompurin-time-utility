import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Container, Box, Tabs, Tab, CssBaseline, Paper, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimerIcon from '@mui/icons-material/Timer';
import ShutterSpeedIcon from '@mui/icons-material/ShutterSpeed';
import WorldClock from './components/WorldClock';
import Timer from './components/Timer';
import Stopwatch from './components/Stopwatch';

// Pompompurin SVG (simple, for demo)
const PompompurinSVG = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="32" cy="40" rx="24" ry="18" fill="#FFF8DC" stroke="#A67C52" strokeWidth="2"/>
    <ellipse cx="32" cy="28" rx="20" ry="16" fill="#FFF8DC" stroke="#A67C52" strokeWidth="2"/>
    <ellipse cx="32" cy="20" rx="8" ry="6" fill="#A67C52"/>
    <ellipse cx="24" cy="28" rx="2" ry="3" fill="#A67C52"/>
    <ellipse cx="40" cy="28" rx="2" ry="3" fill="#A67C52"/>
    <ellipse cx="32" cy="34" rx="3" ry="2" fill="#A67C52"/>
    <ellipse cx="32" cy="38" rx="1.5" ry="1" fill="#A67C52"/>
  </svg>
);

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
    fontFamily: `'Baloo 2', 'Quicksand', 'Nunito', 'Comic Sans MS', cursive, sans-serif`,
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
          fontSize: 18,
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
            <PompompurinSVG />
            <Typography variant="h4" fontWeight={700} color="primary" sx={{ mt: 1, mb: 2, fontFamily: 'Baloo 2, Quicksand, Nunito, Comic Sans MS, cursive, sans-serif' }}>
              Pompompurin Time Utility
            </Typography>
          </Box>
          <Paper elevation={6} sx={{ p: 2, mb: 4, borderRadius: 6, maxWidth: 520, mx: 'auto', bgcolor: 'background.paper' }}>
            <Tabs
              value={value}
              onChange={handleChange}
              centered
              slotProps={{ indicator: { style: { background: '#A67C52', height: 4, borderRadius: 2 } } }}
              variant="fullWidth"
            >
              <Tab icon={<AccessTimeIcon />} label="World Clock" />
              <Tab icon={<TimerIcon />} label="Timer" />
              <Tab icon={<ShutterSpeedIcon />} label="Stopwatch" />
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
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
