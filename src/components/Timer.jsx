import { useState, useEffect, useRef, useMemo } from 'react';
import {
  TextField,
  Button,
  Typography,
  Stack,
  Paper,
  Box,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import TimerIcon from '@mui/icons-material/Timer';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { formatDuration, parseDuration } from '../utils/formatTime';
import { initAudio, playCompletionSound, requestNotificationPermission, notify } from '../utils/alerts';
import Pudding from './Pudding';
import Sprinkles from './Sprinkles';

const TIMER_KEY = 'pompompurinTimer';
const MODE_KEY = 'pompompurinTimerMode';

// Standard single-timer presets
const PRESETS = [
  { label: 'Tea 🍵', seconds: 3 * 60 },
  { label: 'Coffee ☕', seconds: 4 * 60 },
  { label: 'Egg 🥚', seconds: 6 * 60 },
  { label: 'Nap 😴', seconds: 20 * 60 },
  { label: 'Focus 🍮', seconds: 25 * 60 },
];

// Presentation quick presets
const PRESENTATION_PRESETS = [
  { label: '30m: 5 Students (5m each) + 5m Q&A', speakers: 5, speakerMins: 5, qaMins: 5 },
  { label: '13m: Pair (4m each) + 5m Q&A', speakers: 2, speakerMins: 4, qaMins: 5 },
];

const clampNumber = (value, min, max) => Math.max(min, Math.min(max, parseInt(value, 10) || min));

function loadSavedTimer() {
  try {
    const saved = JSON.parse(localStorage.getItem(TIMER_KEY));
    if (saved && saved.paused && typeof saved.remaining === 'number' && typeof saved.initialTime === 'number') {
      return { paused: { remaining: saved.remaining, initialTime: saved.initialTime, segments: saved.segments, examTitle: saved.examTitle } };
    }
    if (saved && typeof saved.endTime === 'number' && typeof saved.initialTime === 'number') {
      const remaining = Math.ceil((saved.endTime - Date.now()) / 1000);
      if (remaining > 0) return { running: { ...saved, remaining } };
      localStorage.removeItem(TIMER_KEY);
      return { finishedWhileAway: true };
    }
  } catch {
    localStorage.removeItem(TIMER_KEY);
  }
  return {};
}

function loadSavedMode() {
  try {
    const mode = localStorage.getItem(MODE_KEY);
    if (mode === 'presentation' || mode === 'exam' || mode === 'quick') return mode;
  } catch {
    // Fall back to default
  }
  return 'quick';
}

const Timer = () => {
  const [restored] = useState(loadSavedTimer);
  const restoredTimer = restored.running ?? restored.paused;

  const [mode, setMode] = useState(loadSavedMode);

  // Quick mode inputs
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [quickInput, setQuickInput] = useState('');

  // Presentation mode inputs
  const [speakerCount, setSpeakerCount] = useState(5);
  const [speakerMins, setSpeakerMins] = useState(5);
  const [qaMins, setQaMins] = useState(5);

  // Exam mode inputs
  const [examTitle, setExamTitle] = useState(restoredTimer?.examTitle ?? 'Midterm Exam');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Timer runtime state
  const [isActive, setIsActive] = useState(Boolean(restored.running));
  const [timeLeft, setTimeLeft] = useState(restoredTimer?.remaining ?? 0);
  const [initialTime, setInitialTime] = useState(restoredTimer?.initialTime ?? 0);
  const [finished, setFinished] = useState(Boolean(restored.finishedWhileAway));
  const [savedSegments, setSavedSegments] = useState(restoredTimer?.segments ?? null);

  const endTimeRef = useRef(restored.running?.endTime ?? 0);
  const firedRef = useRef(false);
  const lastAnnouncedSegmentRef = useRef(-1);

  // Sync native browser fullscreen change event
  useEffect(() => {
    const onFSChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  // Save mode preference
  useEffect(() => {
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      // Best effort
    }
  }, [mode]);

  // Compute presentation segments
  const activeSegments = useMemo(() => {
    if (savedSegments && (isActive || timeLeft > 0)) {
      return savedSegments;
    }
    const segs = [];
    for (let i = 1; i <= speakerCount; i += 1) {
      segs.push({ label: `Student ${i}`, duration: speakerMins * 60 });
    }
    if (qaMins > 0) {
      segs.push({ label: 'Q&A Session', duration: qaMins * 60 });
    }
    return segs;
  }, [savedSegments, isActive, timeLeft, speakerCount, speakerMins, qaMins]);

  const presentationTotalSeconds = useMemo(() => {
    return activeSegments.reduce((acc, s) => acc + s.duration, 0);
  }, [activeSegments]);

  // Compute active presentation segment details
  const activeSegmentInfo = useMemo(() => {
    if (mode !== 'presentation' || initialTime <= 0 || activeSegments.length === 0) {
      return null;
    }
    const elapsed = Math.max(0, initialTime - timeLeft);
    let cumulative = 0;
    for (let i = 0; i < activeSegments.length; i += 1) {
      const seg = activeSegments[i];
      if (elapsed < cumulative + seg.duration || i === activeSegments.length - 1) {
        const segElapsed = elapsed - cumulative;
        const segRemaining = Math.max(0, seg.duration - segElapsed);
        return { index: i, label: seg.label, remaining: segRemaining, duration: seg.duration, total: activeSegments.length };
      }
      cumulative += seg.duration;
    }
    return null;
  }, [mode, initialTime, timeLeft, activeSegments]);

  // Trigger segment transition sound/notification
  useEffect(() => {
    if (isActive && mode === 'presentation' && activeSegmentInfo) {
      if (lastAnnouncedSegmentRef.current !== -1 && lastAnnouncedSegmentRef.current !== activeSegmentInfo.index) {
        playCompletionSound();
        notify(`Next segment: ${activeSegmentInfo.label}! 🍮`);
      }
      lastAnnouncedSegmentRef.current = activeSegmentInfo.index;
    }
  }, [isActive, mode, activeSegmentInfo]);

  // Timer Tick Interval
  useEffect(() => {
    if (!isActive) return;
    const fire = () => {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0 && !firedRef.current) {
        firedRef.current = true;
        setIsActive(false);
        setFinished(true);
        localStorage.removeItem(TIMER_KEY);
        playCompletionSound();
        notify('Timer finished! 🍮');
      }
    };
    const id = setInterval(fire, 250);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fire();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isActive]);

  useEffect(() => {
    if (restored.finishedWhileAway) {
      notify('Timer finished! 🍮');
      playCompletionSound();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPaused = !isActive && timeLeft > 0;
  const inputSeconds = hours * 3600 + minutes * 60 + seconds;
  const targetSeconds = mode === 'presentation' ? presentationTotalSeconds : inputSeconds;
  const displayTime = isActive || isPaused ? timeLeft : targetSeconds;
  const showWarning = isActive && timeLeft > 0 && initialTime > 0 && timeLeft / initialTime <= 0.1;
  const examWarning5m = mode === 'exam' && isActive && timeLeft > 0 && timeLeft <= 300;
  const examWarning15m = mode === 'exam' && isActive && timeLeft > 300 && timeLeft <= 900;
  const puddingFraction = (isActive || isPaused) && initialTime > 0 ? timeLeft / initialTime : 1;

  // Target Clock End-Time for Exam Mode
  const targetEndTimeLabel = useMemo(() => {
    if (displayTime <= 0) return null;
    const endTime = new Date(Date.now() + displayTime * 1000);
    return endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [displayTime]);

  const handleStart = () => {
    const total = isPaused ? timeLeft : targetSeconds;
    if (total <= 0) return;
    const init = isPaused ? initialTime : total;
    if (!isPaused) {
      setInitialTime(total);
      if (mode === 'presentation') {
        setSavedSegments(activeSegments);
      }
    }
    const endTime = Date.now() + total * 1000;
    endTimeRef.current = endTime;
    setTimeLeft(total);
    setIsActive(true);
    setFinished(false);
    firedRef.current = false;
    lastAnnouncedSegmentRef.current = activeSegmentInfo ? activeSegmentInfo.index : 0;
    localStorage.setItem(
      TIMER_KEY,
      JSON.stringify({
        endTime,
        initialTime: init,
        segments: mode === 'presentation' ? activeSegments : undefined,
        examTitle: mode === 'exam' ? examTitle : undefined,
      })
    );
    initAudio();
    requestNotificationPermission();
  };

  const handlePause = () => {
    setIsActive(false);
    localStorage.setItem(
      TIMER_KEY,
      JSON.stringify({
        paused: true,
        remaining: timeLeft,
        initialTime,
        segments: savedSegments,
        examTitle: mode === 'exam' ? examTitle : undefined,
      })
    );
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(0);
    setInitialTime(0);
    setFinished(false);
    setSavedSegments(null);
    firedRef.current = false;
    lastAnnouncedSegmentRef.current = -1;
    localStorage.removeItem(TIMER_KEY);
  };

  // Next Speaker / Skip Segment action
  const handleNextSegment = () => {
    if ((!isActive && !isPaused) || !activeSegmentInfo || activeSegmentInfo.remaining <= 0) return;
    const skipAmount = activeSegmentInfo.remaining;
    const newTimeLeft = Math.max(0, timeLeft - skipAmount);
    setTimeLeft(newTimeLeft);
    if (isActive) {
      const newEndTime = Date.now() + newTimeLeft * 1000;
      endTimeRef.current = newEndTime;
    }
    playCompletionSound();
    notify(`Advanced to next segment! 🍮`);
  };

  const applyPreset = (totalSeconds) => {
    setHours(Math.floor(totalSeconds / 3600));
    setMinutes(Math.floor((totalSeconds % 3600) / 60));
    setSeconds(totalSeconds % 60);
    setFinished(false);
  };

  const applyPresentationPreset = (p) => {
    setSpeakerCount(p.speakers);
    setSpeakerMins(p.speakerMins);
    setQaMins(p.qaMins);
    setSavedSegments(null);
    setFinished(false);
  };

  const handleQuickSet = () => {
    const total = parseDuration(quickInput);
    if (total && total > 0) {
      applyPreset(total);
      setQuickInput('');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const timeFields = [
    { label: 'Hours', value: hours, setter: (v) => setHours(clampNumber(v, 0, 99)), max: 99 },
    { label: 'Minutes', value: minutes, setter: (v) => setMinutes(clampNumber(v, 0, 59)), max: 59 },
    { label: 'Seconds', value: seconds, setter: (v) => setSeconds(clampNumber(v, 0, 59)), max: 59 },
  ];

  return (
    <Box mt={6}>
      <Paper elevation={8} sx={{ p: { xs: 2.5, sm: 5 }, borderRadius: 3, maxWidth: 600, mx: 'auto' }}>
        <Stack spacing={{ xs: 3, sm: 4 }} alignItems="center">

          {/* Mode Switcher + Fullscreen Toggle Button */}
          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" flexWrap="wrap" useFlexGap width="100%">
            <Chip
              icon={<TimerIcon fontSize="small" />}
              label="Quick Timer"
              onClick={() => setMode('quick')}
              color={mode === 'quick' ? 'primary' : 'default'}
              variant={mode === 'quick' ? 'filled' : 'outlined'}
              disabled={isActive}
              sx={{ fontWeight: 700 }}
            />
            <Chip
              icon={<GroupsIcon fontSize="small" />}
              label="Presentation Segments"
              onClick={() => setMode('presentation')}
              color={mode === 'presentation' ? 'primary' : 'default'}
              variant={mode === 'presentation' ? 'filled' : 'outlined'}
              disabled={isActive}
              sx={{ fontWeight: 700 }}
            />
            <Chip
              icon={<SchoolIcon fontSize="small" />}
              label="Classroom Exam"
              onClick={() => setMode('exam')}
              color={mode === 'exam' ? 'primary' : 'default'}
              variant={mode === 'exam' ? 'filled' : 'outlined'}
              disabled={isActive}
              sx={{ fontWeight: 700 }}
            />
            <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Mode'}>
              <IconButton onClick={toggleFullscreen} color="primary" size="medium" aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Mode'}>
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Warnings */}
          {showWarning && mode !== 'exam' && (
            <Alert severity="warning" sx={{ fontWeight: 'bold', fontSize: 18 }}>
              Hurry up! Less than 10% time remaining.
            </Alert>
          )}

          {examWarning5m && (
            <Alert severity="error" sx={{ fontWeight: 'bold', fontSize: 18 }}>
              🚨 Final 5 Minutes Remaining! Wrap up your answers.
            </Alert>
          )}

          {examWarning15m && (
            <Alert severity="warning" sx={{ fontWeight: 'bold', fontSize: 18 }}>
              ⚠️ 15 Minutes Remaining. Check your work!
            </Alert>
          )}

          {/* Mascot */}
          <Box
            sx={{ position: 'relative' }}
            className={showWarning || examWarning5m ? 'pudding-wobble' : finished ? 'pudding-bounce' : undefined}
          >
            <Pudding fraction={puddingFraction} size={150} />
            {finished && <Sprinkles />}
          </Box>

          {finished && (
            <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
              Yum! Time&apos;s up! 🍮
            </Typography>
          )}

          {/* Presentation Mode Running / Paused Dual-Timer Display */}
          {mode === 'presentation' && (isActive || isPaused) && activeSegmentInfo && (
            <Paper elevation={4} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4, width: '100%', bgcolor: 'background.default', textAlign: 'center' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  CURRENT SPEAKER ({activeSegmentInfo.index + 1} of {activeSegmentInfo.total})
                </Typography>
                <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Presentation Mode'}>
                  <IconButton onClick={toggleFullscreen} color="primary" size="small" aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Mode'}>
                    {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Stack>
              <Typography variant="h5" color="primary" sx={{ fontWeight: 800, mb: 1, mt: 0.5 }}>
                🎙️ {activeSegmentInfo.label}
              </Typography>

              {/* Presenter's Allocated Segment Countdown — LARGE & PROMINENT */}
              <Box sx={{ my: 1.5, p: { xs: 1.5, sm: 2.5 }, borderRadius: 3, bgcolor: 'action.hover', border: '2px solid', borderColor: 'primary.main' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Presenter Time Remaining
                </Typography>
                <Typography
                  variant="h2"
                  fontFamily="monospace"
                  fontWeight="bold"
                  sx={{
                    fontSize: 'clamp(2.8rem, 14vw, 5rem)',
                    color: activeSegmentInfo.remaining <= 60 ? 'error.main' : 'primary.main',
                    transition: 'color 0.3s',
                    lineHeight: 1.1,
                  }}
                >
                  {formatDuration(activeSegmentInfo.remaining)}
                </Typography>
              </Box>

              {/* Total Overall Presentation Time Left */}
              <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mt: 1.5 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={700}>
                  ⏱️ Total Overall Time Left:
                </Typography>
                <Typography variant="h6" fontFamily="monospace" fontWeight={800} color="text.primary">
                  {formatDuration(displayTime)}
                </Typography>
              </Stack>
            </Paper>
          )}

          {/* Quick & Exam Modes Main Countdown Display (and Presentation setup state) */}
          {(mode !== 'presentation' || (!isActive && !isPaused)) && (
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} width="100%">
              <Typography
                variant="h2"
                fontFamily="monospace"
                fontWeight="bold"
                sx={{
                  textAlign: 'center',
                  fontSize: mode === 'exam' ? 'clamp(2.5rem, 14vw, 4.5rem)' : 'clamp(2rem, 12vw, 3.5rem)',
                  color: examWarning5m ? 'error.main' : examWarning15m ? 'warning.main' : showWarning ? 'warning.main' : 'primary.main',
                  transition: 'color 0.3s',
                }}
              >
                {formatDuration(displayTime)}
              </Typography>
              <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Mode'}>
                <IconButton onClick={toggleFullscreen} color="primary" size="large" aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Mode'}>
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
              </Tooltip>
            </Stack>
          )}

          {/* Target Clock End-Time for Exam Mode */}
          {mode === 'exam' && targetEndTimeLabel && (
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 700 }}>
              🕒 Exam Ends at: {targetEndTimeLabel}
            </Typography>
          )}

          {/* Presentation Segment Stepper Bar */}
          {mode === 'presentation' && activeSegments.length > 0 && (
            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap width="100%">
              {activeSegments.map((seg, idx) => {
                const isCurrent = activeSegmentInfo?.index === idx;
                const isDone = activeSegmentInfo ? activeSegmentInfo.index > idx : finished;
                return (
                  <Chip
                    key={`${seg.label}-${idx}`}
                    label={`${seg.label} (${Math.round(seg.duration / 60)}m)`}
                    color={isCurrent ? 'primary' : isDone ? 'success' : 'default'}
                    variant={isCurrent || isDone ? 'filled' : 'outlined'}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                );
              })}
            </Stack>
          )}

          {/* QUICK TIMER CONFIGURATION */}
          {mode === 'quick' && !isActive && !isPaused && (
            <>
              <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ width: '100%', maxWidth: 360 }}>
                <TextField
                  size="small"
                  fullWidth
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQuickSet();
                  }}
                  label="Quick set — e.g. 25m, 1h30m, 90s"
                />
                <Button variant="contained" onClick={handleQuickSet} disabled={!quickInput.trim()} sx={{ minWidth: 64 }}>
                  Set
                </Button>
              </Stack>

              <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
                {PRESETS.map(({ label, seconds: presetSeconds }) => (
                  <Chip
                    key={label}
                    label={label}
                    onClick={() => applyPreset(presetSeconds)}
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: 14, bgcolor: 'background.default' }}
                  />
                ))}
              </Stack>

              <Stack direction="row" spacing={{ xs: 1.5, sm: 3 }} justifyContent="center" flexWrap="wrap" useFlexGap>
                {timeFields.map(({ label, value, setter, max }) => (
                  <TextField
                    key={label}
                    label={label}
                    type="number"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    disabled={isActive || isPaused}
                    sx={{ width: 90 }}
                    slotProps={{ htmlInput: { min: 0, max } }}
                  />
                ))}
              </Stack>
            </>
          )}

          {/* PRESENTATION SEGMENTS CONFIGURATION */}
          {mode === 'presentation' && !isActive && !isPaused && (
            <Stack spacing={2} width="100%" alignItems="center">
              <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
                {PRESENTATION_PRESETS.map((p) => (
                  <Chip
                    key={p.label}
                    label={p.label}
                    onClick={() => applyPresentationPreset(p)}
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: 13, bgcolor: 'background.default' }}
                  />
                ))}
              </Stack>

              <Stack direction="row" spacing={2} justifyContent="center">
                <TextField
                  label="Presenters"
                  type="number"
                  value={speakerCount}
                  onChange={(e) => setSpeakerCount(clampNumber(e.target.value, 1, 10))}
                  sx={{ width: 110 }}
                  slotProps={{ htmlInput: { min: 1, max: 10 } }}
                />
                <TextField
                  label="Time/Person (m)"
                  type="number"
                  value={speakerMins}
                  onChange={(e) => setSpeakerMins(clampNumber(e.target.value, 1, 60))}
                  sx={{ width: 140 }}
                  slotProps={{ htmlInput: { min: 1, max: 60 } }}
                />
                <TextField
                  label="Q&A Time (m)"
                  type="number"
                  value={qaMins}
                  onChange={(e) => setQaMins(clampNumber(e.target.value, 0, 60))}
                  sx={{ width: 130 }}
                  slotProps={{ htmlInput: { min: 0, max: 60 } }}
                />
              </Stack>
            </Stack>
          )}

          {/* EXAM MODE CONFIGURATION */}
          {mode === 'exam' && !isActive && !isPaused && (
            <Stack spacing={2} width="100%" alignItems="center">
              <TextField
                label="Exam / Test Title"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value.slice(0, 50))}
                fullWidth
                sx={{ maxWidth: 380 }}
              />
              <Stack direction="row" spacing={{ xs: 1.5, sm: 3 }} justifyContent="center" flexWrap="wrap" useFlexGap>
                {timeFields.map(({ label, value, setter, max }) => (
                  <TextField
                    key={label}
                    label={label}
                    type="number"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    disabled={isActive || isPaused}
                    sx={{ width: 90 }}
                    slotProps={{ htmlInput: { min: 0, max } }}
                  />
                ))}
              </Stack>
            </Stack>
          )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={{ xs: 1.5, sm: 3 }} justifyContent="center" flexWrap="wrap" useFlexGap>
            <Button variant="contained" onClick={handleStart} disabled={isActive || displayTime <= 0}>
              {isPaused ? 'Resume' : 'Start'}
            </Button>

            {mode === 'presentation' && (isActive || isPaused) && activeSegmentInfo && (
              <Button
                variant="contained"
                color="info"
                startIcon={<SkipNextIcon />}
                onClick={handleNextSegment}
              >
                Next Speaker
              </Button>
            )}

            <Button variant="contained" color="secondary" onClick={handlePause} disabled={!isActive}>
              Pause
            </Button>
            <Button variant="outlined" onClick={handleReset}>
              Reset
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Timer;
