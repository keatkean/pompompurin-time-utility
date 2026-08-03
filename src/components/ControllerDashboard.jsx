import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Chip,
  Card,
  CardContent,
  useTheme,
  Alert,
  TextField,
  ButtonGroup,
  IconButton,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimerIcon from '@mui/icons-material/Timer';
import ShutterSpeedIcon from '@mui/icons-material/ShutterSpeed';
import SchoolIcon from '@mui/icons-material/School';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import MicIcon from '@mui/icons-material/Mic';
import GroupIcon from '@mui/icons-material/Group';

const TAB_NAMES = ['World Clock', 'Calendar', 'Timer', 'Stopwatch', 'Pomodoro', 'Capsules'];
const TAB_ICONS = [
  <AccessTimeIcon key="0" fontSize="small" />,
  <CalendarMonthIcon key="1" fontSize="small" />,
  <TimerIcon key="2" fontSize="small" />,
  <ShutterSpeedIcon key="3" fontSize="small" />,
  <SchoolIcon key="4" fontSize="small" />,
  <CardGiftcardIcon key="5" fontSize="small" />,
];

export default function ControllerDashboard({
  pin,
  setPin,
  isConnected,
  isConnecting,
  peerError,
  syncedState,
  onSendCommand,
  onConnectPin,
}) {
  const [inputPin, setInputPin] = useState(pin || '');
  const [showDebug, setShowDebug] = useState(false);
  const muiTheme = useTheme();


  // Use synced presenter mode if available, fallback to local theme mode
  const isDark = syncedState?.mode ? syncedState.mode === 'dark' : muiTheme.palette.mode === 'dark';

  const activeTab = syncedState?.activeTab ?? 0;
  const timerState = syncedState?.timerState;
  const stopwatchState = syncedState?.stopwatchState;
  const pomodoroState = syncedState?.pomodoroState;

  const currentTimerMode = timerState?.mode || 'quick';
  const speakerCount = timerState?.speakerCount || 3;
  const speakerMins = timerState?.speakerMins || 5;
  const qaMins = timerState?.qaMins || 5;
  const activeSegment = timerState?.activeSegmentInfo;

  const handleConnectSubmit = (e) => {
    e.preventDefault();
    if (inputPin.trim()) {
      setPin(inputPin.trim());
      if (onConnectPin) onConnectPin(inputPin.trim());
    }
  };

  let liveTitle = TAB_NAMES[activeTab] || 'Presenter App';
  let liveTimeText = '00:00';
  let liveStatus = 'Ready';

  if (activeTab === 2 && timerState) {
    liveTimeText = timerState.formattedTime || '00:00';
    liveStatus = timerState.isRunning ? '⏱️ Countdown Running' : '⏸️ Paused';
  } else if (activeTab === 3 && stopwatchState) {
    liveTimeText = stopwatchState.formattedTime || '00:00.0';
    liveStatus = stopwatchState.isRunning ? '⏲️ Stopwatch Running' : '⏸️ Paused';
  } else if (activeTab === 4 && pomodoroState) {
    liveTimeText = pomodoroState.formattedTime || '25:00';
    liveStatus = `${pomodoroState.modeName || 'Focus'} (${pomodoroState.isRunning ? 'Running' : 'Paused'})`;
  }

  // Theme color variables
  const containerBg = isDark
    ? 'linear-gradient(180deg, #2E2A3D 0%, #1F1C2B 100%)'
    : 'linear-gradient(180deg, #FFFDF5 0%, #FFF8DC 100%)';
  const paperBg = isDark ? '#3D3750' : 'linear-gradient(180deg, #FFFDF8 0%, #FFF8DC 100%)';
  const borderTone = isDark ? '#564F6F' : '#FFE082';
  const titleColor = isDark ? '#FFF3D6' : '#5B4222';
  const subtitleColor = isDark ? '#E6CBA8' : '#7A5C37';

  return (
    <Box minHeight="100vh" sx={{ background: containerBg, py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 2 } }}>
      <Container maxWidth="xs" sx={{ px: { xs: 1, sm: 2 } }}>
        {/* App Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1.2}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                bgcolor: isDark ? 'rgba(255, 217, 138, 0.18)' : '#FFF3D6',
                border: `1.5px solid ${borderTone}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              <img
                src={`${import.meta.env.BASE_URL}pompompurin.svg`}
                alt="Pompompurin"
                style={{
                  width: '26px',
                  height: '26px',
                  objectFit: 'contain',
                  display: 'block',
                  margin: 'auto',
                }}
              />
            </Box>
            <Box display="flex" flexDirection="column" justifyContent="center">
              <Typography variant="h6" fontWeight={800} sx={{ color: titleColor, lineHeight: 1.15, fontSize: '1.05rem' }}>
                Presenter Remote 📱
              </Typography>
              <Typography variant="caption" sx={{ color: subtitleColor, fontWeight: 700, lineHeight: 1.1, mt: 0.2 }}>
                {isDark ? '🌙 Bedtime Mode' : '☀️ Daytime Mode'}
              </Typography>
            </Box>
          </Box>

          <Chip
            icon={isConnected ? <WifiIcon /> : <WifiOffIcon />}
            label={isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Offline'}
            color={isConnected ? 'success' : isConnecting ? 'warning' : 'default'}
            size="small"
            sx={{ fontWeight: 800, borderRadius: '12px' }}
          />
        </Box>

        {/* Manual Connection Card (if not connected) */}
        {!isConnected && (
          <Paper
            elevation={4}
            sx={{
              p: { xs: 1.8, sm: 2.5 },
              mb: 2,
              borderRadius: '20px',
              textAlign: 'center',
              background: paperBg,
              border: `2px solid ${borderTone}`,
            }}
          >
            <Typography variant="subtitle2" sx={{ color: titleColor, fontWeight: 800, mb: 1.2 }}>
              Enter Presenter PIN Code
            </Typography>
            <Box component="form" onSubmit={handleConnectSubmit} display="flex" gap={1}>
              <TextField
                size="small"
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
                placeholder="e.g. Tc27Sa"
                inputProps={{ maxLength: 8, style: { textAlign: 'center', fontWeight: 800, letterSpacing: 2, fontSize: '1rem' } }}
                fullWidth
                sx={{ bgcolor: isDark ? '#2E2A3D' : '#FFFFFF', borderRadius: '12px' }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={isConnecting}
                sx={{
                  fontWeight: 800,
                  borderRadius: '12px',
                  minWidth: '90px',
                  px: 2,
                  fontSize: '0.85rem',
                  background: isDark
                    ? 'linear-gradient(135deg, #FFD98A 0%, #E6CBA8 100%)'
                    : 'linear-gradient(135deg, #A67C52 0%, #6B4F2B 100%)',
                  color: isDark ? '#3E2F18' : '#FFF8DC',
                }}
              >
                {isConnecting ? '...' : 'CONNECT'}
              </Button>
            </Box>
            {peerError && (
              <Alert severity="warning" sx={{ mt: 1.5, borderRadius: '12px', textAlign: 'left', fontSize: '0.78rem' }}>
                {peerError}
              </Alert>
            )}
          </Paper>
        )}

        {/* Live Synced Time Card */}
        <Card
          elevation={5}
          sx={{
            mb: 2,
            borderRadius: '20px',
            background: isDark
              ? 'linear-gradient(135deg, #564F6F 0%, #2E2A3D 100%)'
              : 'linear-gradient(135deg, #FFF8DC 0%, #FFE082 100%)',
            color: isDark ? '#FFF3D6' : '#5B4222',
            textAlign: 'center',
            boxShadow: isDark ? '0 8px 20px rgba(0,0,0,0.3)' : '0 8px 20px rgba(166, 124, 82, 0.2)',
            border: isDark ? '2px solid #FFD98A' : '2.5px solid #FFD180',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ py: 1.8, px: 1.5, '&:last-child': { pb: 1.8 } }}>
            <Chip
              label={liveTitle}
              sx={{
                fontWeight: 800,
                mb: 0.5,
                bgcolor: isDark ? '#FFD98A' : '#A67C52',
                color: isDark ? '#3E2F18' : '#FFF8DC',
                fontSize: '0.8rem',
                height: 24,
              }}
            />
            <Typography
              variant="h2"
              fontWeight={800}
              sx={{
                fontFamily: "'Baloo 2', cursive, monospace",
                letterSpacing: 2,
                my: 0.2,
                fontSize: { xs: '2.4rem', sm: '2.9rem' },
                lineHeight: 1.1,
              }}
            >
              {liveTimeText}
            </Typography>

            {/* Active Segment Badge if Presentation Mode */}
            {activeTab === 2 && currentTimerMode === 'presentation' && activeSegment ? (
              <Box
                sx={{
                  mt: 0.8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.8,
                  px: 1.5,
                  py: 0.3,
                  borderRadius: '12px',
                  bgcolor: isDark ? 'rgba(255, 217, 138, 0.2)' : 'rgba(166, 124, 82, 0.15)',
                  border: `1px solid ${borderTone}`,
                }}
              >
                <MicIcon sx={{ fontSize: '0.9rem', color: isDark ? '#FFD98A' : '#5B4222' }} />
                <Typography variant="caption" fontWeight={800} sx={{ fontSize: '0.78rem' }}>
                  {activeSegment.label} ({activeSegment.index + 1}/{activeSegment.total})
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" fontWeight={800} sx={{ opacity: 0.9, fontSize: '0.8rem' }}>
                {liveStatus}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Quick Timer Remote Controls */}
        <Paper
          elevation={4}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            borderRadius: '20px',
            background: paperBg,
            border: `2px solid ${borderTone}`,
            overflow: 'hidden',
          }}
        >
          <Typography variant="subtitle2" sx={{ color: titleColor, fontWeight: 800, mb: 1.2, textAlign: 'center' }}>
            ⏱️ Quick Controls
          </Typography>

          <Grid container spacing={0.8} mb={1}>
            <Grid size={{ xs: 4 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<PlayArrowIcon sx={{ fontSize: '1rem !important' }} />}
                onClick={() => onSendCommand('TIMER_START')}
                sx={{
                  height: 40,
                  minWidth: 0,
                  borderRadius: '14px',
                  px: 0.5,
                  background: 'linear-gradient(135deg, #66BB6A 0%, #388E3C 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: { xs: '0.75rem', sm: '0.82rem' },
                  boxShadow: '0 4px 10px rgba(56, 142, 60, 0.3)',
                }}
              >
                Start
              </Button>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<PauseIcon sx={{ fontSize: '1rem !important' }} />}
                onClick={() => onSendCommand('TIMER_PAUSE')}
                sx={{
                  height: 40,
                  minWidth: 0,
                  borderRadius: '14px',
                  px: 0.5,
                  background: 'linear-gradient(135deg, #FFA726 0%, #F57C00 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: { xs: '0.75rem', sm: '0.82rem' },
                  boxShadow: '0 4px 10px rgba(245, 124, 0, 0.3)',
                }}
              >
                Pause
              </Button>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<RestartAltIcon sx={{ fontSize: '1rem !important' }} />}
                onClick={() => onSendCommand('TIMER_RESET')}
                sx={{
                  height: 40,
                  minWidth: 0,
                  borderRadius: '14px',
                  px: 0.5,
                  background: 'linear-gradient(135deg, #EF5350 0%, #D32F2F 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: { xs: '0.75rem', sm: '0.82rem' },
                  boxShadow: '0 4px 10px rgba(211, 47, 47, 0.3)',
                }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>

          <Grid container spacing={0.8}>
            <Grid size={{ xs: 4 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<AddIcon sx={{ fontSize: '0.9rem !important' }} />}
                onClick={() => onSendCommand('ADD_TIME', 60)}
                sx={{
                  height: 36,
                  minWidth: 0,
                  borderRadius: '12px',
                  px: 0.5,
                  borderColor: isDark ? '#FFD98A' : '#A67C52',
                  color: titleColor,
                  fontWeight: 800,
                  fontSize: { xs: '0.72rem', sm: '0.78rem' },
                  bgcolor: isDark ? 'rgba(86, 79, 111, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                }}
              >
                +1 Min
              </Button>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<AddIcon sx={{ fontSize: '0.9rem !important' }} />}
                onClick={() => onSendCommand('ADD_TIME', 300)}
                sx={{
                  height: 36,
                  minWidth: 0,
                  borderRadius: '12px',
                  px: 0.5,
                  borderColor: isDark ? '#FFD98A' : '#A67C52',
                  color: titleColor,
                  fontWeight: 800,
                  fontSize: { xs: '0.72rem', sm: '0.78rem' },
                  bgcolor: isDark ? 'rgba(86, 79, 111, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                }}
              >
                +5 Min
              </Button>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<RemoveIcon sx={{ fontSize: '0.9rem !important' }} />}
                onClick={() => onSendCommand('ADD_TIME', -60)}
                sx={{
                  height: 36,
                  minWidth: 0,
                  borderRadius: '12px',
                  px: 0.5,
                  borderColor: isDark ? '#FFD98A' : '#A67C52',
                  color: isDark ? '#E6CBA8' : '#8D6E63',
                  fontWeight: 800,
                  fontSize: { xs: '0.72rem', sm: '0.78rem' },
                  bgcolor: isDark ? 'rgba(86, 79, 111, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                }}
              >
                -1 Min
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Presentation Segments Remote Control Panel */}
        <Paper
          elevation={4}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            borderRadius: '20px',
            background: paperBg,
            border: `2px solid ${borderTone}`,
            overflow: 'hidden',
          }}
        >
          <Typography variant="subtitle2" sx={{ color: titleColor, fontWeight: 800, mb: 1.2, textAlign: 'center' }}>
            🎤 Presentation Segments Control
          </Typography>

          {/* Mode Selector */}
          <Box display="flex" gap={0.5} mb={1.5}>
            {[
              { id: 'quick', label: '⚡ Quick' },
              { id: 'presentation', label: '🎤 Presentation' },
              { id: 'exam', label: '📝 Exam' },
            ].map((m) => (
              <Button
                key={m.id}
                variant={currentTimerMode === m.id ? 'contained' : 'outlined'}
                onClick={() => onSendCommand('SET_TIMER_MODE', m.id)}
                sx={{
                  flex: 1,
                  height: 34,
                  minWidth: 0,
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  px: 0.5,
                  borderColor: borderTone,
                  bgcolor: currentTimerMode === m.id ? (isDark ? '#FFD98A' : '#A67C52') : 'transparent',
                  color: currentTimerMode === m.id ? (isDark ? '#3E2F18' : '#FFF8DC') : titleColor,
                }}
              >
                {m.label}
              </Button>
            ))}
          </Box>

          {/* Next Speaker Button */}
          <Button
            variant="contained"
            fullWidth
            startIcon={<SkipNextIcon />}
            onClick={() => onSendCommand('NEXT_SPEAKER')}
            sx={{
              height: 42,
              borderRadius: '14px',
              mb: 1.5,
              background: 'linear-gradient(135deg, #AB47BC 0%, #7B1FA2 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.82rem',
              boxShadow: '0 4px 12px rgba(123, 31, 162, 0.3)',
            }}
          >
            Next Speaker / Skip Segment 🎤
          </Button>

          {/* Presenter / Segment Configurator */}
          <Box
            sx={{
              p: 1.2,
              borderRadius: '14px',
              bgcolor: isDark ? 'rgba(46, 42, 61, 0.6)' : 'rgba(255, 255, 255, 0.7)',
              border: `1px solid ${borderTone}`,
            }}
          >
            <Typography variant="caption" fontWeight={800} sx={{ color: subtitleColor, display: 'block', mb: 1, textAlign: 'center' }}>
              Configure Presenters & Durations
            </Typography>

            <Grid container spacing={1} alignItems="center">
              {/* Speaker Count */}
              <Grid size={{ xs: 12 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="caption" fontWeight={800} sx={{ color: titleColor, fontSize: '0.78rem' }}>
                    🎙️ Speakers: {speakerCount}
                  </Typography>
                  <Box display="flex" gap={0.5}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onSendCommand('SET_PRESENTATION_CONFIG', { speakers: Math.max(1, speakerCount - 1) })}
                      sx={{ minWidth: 28, width: 28, height: 28, p: 0, borderRadius: '8px', fontWeight: 800 }}
                    >
                      -
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onSendCommand('SET_PRESENTATION_CONFIG', { speakers: speakerCount + 1 })}
                      sx={{ minWidth: 28, width: 28, height: 28, p: 0, borderRadius: '8px', fontWeight: 800 }}
                    >
                      +
                    </Button>
                  </Box>
                </Box>
              </Grid>

              {/* Mins per Speaker */}
              <Grid size={{ xs: 12 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="caption" fontWeight={800} sx={{ color: titleColor, fontSize: '0.78rem' }}>
                    ⏱️ Mins / Speaker: {speakerMins}m
                  </Typography>
                  <Box display="flex" gap={0.5}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onSendCommand('SET_PRESENTATION_CONFIG', { speakerMins: Math.max(1, speakerMins - 1) })}
                      sx={{ minWidth: 28, width: 28, height: 28, p: 0, borderRadius: '8px', fontWeight: 800 }}
                    >
                      -
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onSendCommand('SET_PRESENTATION_CONFIG', { speakerMins: speakerMins + 1 })}
                      sx={{ minWidth: 28, width: 28, height: 28, p: 0, borderRadius: '8px', fontWeight: 800 }}
                    >
                      +
                    </Button>
                  </Box>
                </Box>
              </Grid>

              {/* Q&A Mins */}
              <Grid size={{ xs: 12 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="caption" fontWeight={800} sx={{ color: titleColor, fontSize: '0.78rem' }}>
                    💬 Q&A Session: {qaMins}m
                  </Typography>
                  <Box display="flex" gap={0.5}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onSendCommand('SET_PRESENTATION_CONFIG', { qaMins: Math.max(0, qaMins - 1) })}
                      sx={{ minWidth: 28, width: 28, height: 28, p: 0, borderRadius: '8px', fontWeight: 800 }}
                    >
                      -
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onSendCommand('SET_PRESENTATION_CONFIG', { qaMins: qaMins + 1 })}
                      sx={{ minWidth: 28, width: 28, height: 28, p: 0, borderRadius: '8px', fontWeight: 800 }}
                    >
                      +
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Tab Switcher Grid */}
        <Paper
          elevation={4}
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            borderRadius: '20px',
            background: paperBg,
            border: `2px solid ${borderTone}`,
            overflow: 'hidden',
          }}
        >
          <Typography variant="subtitle2" sx={{ color: titleColor, fontWeight: 800, mb: 1.2, textAlign: 'center' }}>
            📱 Switch Presentation Tab
          </Typography>

          <Grid container spacing={0.8}>
            {TAB_NAMES.map((name, index) => {
              const isSelected = activeTab === index;
              return (
                <Grid size={{ xs: 6 }} key={name}>
                  <Button
                    variant={isSelected ? 'contained' : 'outlined'}
                    fullWidth
                    startIcon={TAB_ICONS[index]}
                    onClick={() => onSendCommand('CHANGE_TAB', index)}
                    sx={{
                      height: 42,
                      minWidth: 0,
                      borderRadius: '14px',
                      justifyContent: 'center',
                      px: 1,
                      fontWeight: 800,
                      fontSize: { xs: '0.74rem', sm: '0.8rem' },
                      background: isSelected
                        ? isDark
                          ? 'linear-gradient(135deg, #FFD98A 0%, #E6CBA8 100%)'
                          : 'linear-gradient(135deg, #A67C52 0%, #6B4F2B 100%)'
                        : isDark
                        ? 'rgba(86, 79, 111, 0.5)'
                        : 'rgba(255, 255, 255, 0.8)',
                      color: isSelected ? (isDark ? '#3E2F18' : '#FFF8DC') : titleColor,
                      borderColor: isSelected ? 'transparent' : borderTone,
                      boxShadow: isSelected ? '0 4px 10px rgba(0,0,0,0.2)' : 'none',
                    }}
                  >
                    {name}
                  </Button>
                </Grid>
              );
            })}
          </Grid>
        </Paper>

        {/* Display Theme Toggle */}
        <Paper
          elevation={3}
          sx={{
            py: 1.5,
            px: { xs: 1.8, sm: 2.2 },
            borderRadius: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: isDark ? '#3D3750' : '#FFFDF8',
            border: `2px solid ${borderTone}`,
          }}
        >
          <Typography variant="body2" fontWeight={800} sx={{ color: titleColor, fontSize: { xs: '0.78rem', sm: '0.85rem' } }}>
            Presenter Theme:
          </Typography>
          <Button
            variant="outlined"
            startIcon={isDark ? <Brightness7Icon sx={{ fontSize: '1rem !important' }} /> : <Brightness4Icon sx={{ fontSize: '1rem !important' }} />}
            onClick={() => onSendCommand('TOGGLE_THEME')}
            size="small"
            sx={{
              height: 36,
              minWidth: 0,
              borderRadius: '12px',
              px: 1.5,
              fontWeight: 800,
              fontSize: { xs: '0.74rem', sm: '0.8rem' },
              borderColor: isDark ? '#FFD98A' : '#A67C52',
              color: titleColor,
            }}
          >
            {isDark ? 'Day Mode' : 'Night Mode'}
          </Button>
        </Paper>

        {/* On-Screen Mobile Debugger */}
        <Box textAlign="center" mt={2}>
          <Button
            size="small"
            onClick={() => setShowDebug((d) => !d)}
            sx={{ color: subtitleColor, fontSize: '0.72rem', fontWeight: 700, textTransform: 'none' }}
          >
            {showDebug ? 'Hide Diagnostics 🛠️' : '🐞 Troubleshoot & Mobile Diagnostics'}
          </Button>
          {showDebug && (
            <Paper
              elevation={2}
              sx={{
                mt: 1,
                p: 1.5,
                borderRadius: '14px',
                bgcolor: isDark ? '#1F1C2B' : '#F5F5F5',
                textAlign: 'left',
                fontSize: '0.72rem',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
              }}
            >
              <Typography variant="caption" fontWeight={800} display="block" color="error" mb={0.5}>
                [Diagnostic Logs]
              </Typography>
              <div>🌐 Online: {navigator.onLine ? 'YES ✅' : 'NO ❌'}</div>
              <div>🔑 Pairing PIN: {pin || inputPin || 'None'}</div>
              <div>⚡ Connected: {isConnected ? 'YES ✅' : 'NO ❌'}</div>
              <div>⏳ Connecting: {isConnecting ? 'YES' : 'NO'}</div>
              <div>⚠️ Peer Error: {peerError || 'None'}</div>
              <div>🔗 Phone URL: {typeof window !== 'undefined' ? window.location.href : ''}</div>
            </Paper>
          )}
        </Box>
      </Container>
    </Box>
  );
}

