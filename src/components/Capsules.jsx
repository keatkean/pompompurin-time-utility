import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Paper,
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Snackbar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RedeemIcon from '@mui/icons-material/Redeem';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  sealCapsule,
  openCapsule,
  loadShelf,
  saveShelf,
  safeSlice,
  MAX_MESSAGE_CHARS,
} from '../utils/capsule';
import { nextFullMoon, nextLunarFestival, utcNoon } from '../utils/lunar';
import { formatCountdown } from '../utils/formatTime';
import { initAudio, playCompletionSound, requestNotificationPermission, notify } from '../utils/alerts';
import Pudding from './Pudding';
import Sprinkles from './Sprinkles';

const HASH_PREFIX = '#capsule=';

// Web Crypto needs a secure context (https / localhost) — everywhere this app
// is served. If it's ever opened over plain http, hide the feature gracefully.
const sealingAvailable = () => Boolean(globalThis.crypto?.subtle);

// datetime-local wants "YYYY-MM-DDTHH:mm" in the visitor's local time. Quick
// picks land at 09:00 local on the target day (a friendly opening hour).
const toLocalInputValue = (year, month1, day, hour = 9) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${year}-${p(month1)}-${p(day)}T${p(hour)}:00`;
};

const Capsules = () => {
  const [message, setMessage] = useState('');
  const [from, setFrom] = useState('');
  const [openAtInput, setOpenAtInput] = useState('');
  const [shelf, setShelf] = useState(loadShelf);
  const [revealed, setRevealed] = useState(null); // { blob, message, from }
  const [incoming, setIncoming] = useState(null); // { blob, result }
  const [copied, setCopied] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  // Capsules that already announced their unlock this session.
  const announcedRef = useRef(new Set());

  // Tick every 1s (1000ms) for smooth real-time countdown updates
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const ok = saveShelf(shelf);
    if (!ok && shelf.length > 0) {
      setStorageError(true);
    }
  }, [shelf]);

  // A shared capsule arrives in the URL fragment (never sent to any server).
  // Consume it once and clean the address bar. Safely handles malformed URL components.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith(HASH_PREFIX)) return;
    let blob;
    try {
      blob = decodeURIComponent(hash.slice(HASH_PREFIX.length));
    } catch {
      setIncoming({ blob: '', result: { invalid: true } });
      return;
    }
    try {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch {
      // History unavailable — the stale hash is harmless.
    }
    let cancelled = false;
    openCapsule(blob).then((result) => {
      if (!cancelled) setIncoming({ blob, result });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // A locked incoming capsule unseals itself the moment its time arrives.
  useEffect(() => {
    if (!incoming?.result?.locked || now < incoming.result.openAt) return;
    let cancelled = false;
    openCapsule(incoming.blob).then((result) => {
      if (!cancelled) setIncoming({ blob: incoming.blob, result });
    });
    return () => {
      cancelled = true;
    };
  }, [now, incoming]);

  // Announce shelf capsules that come of age while the app is open — same
  // best-effort sound/notification contract as the Timer.
  useEffect(() => {
    shelf.forEach((c) => {
      if (c.openAt <= now && !c.opened && !announcedRef.current.has(c.blob)) {
        announcedRef.current.add(c.blob);
        // Skip the fanfare for capsules that were already ripe when the app
        // loaded — only a fresh unlock is news.
        if (now - c.openAt < 60000) {
          playCompletionSound();
          notify('A pudding capsule is ready to open! 🍮');
        }
      }
    });
  }, [now, shelf]);

  // Quick-pick chips — the lunar engine is the whole point of having them.
  const quickPicks = useMemo(() => {
    const today = new Date();
    const todayNoon = utcNoon(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const dayAfter = (d) => utcNoon(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate() + 1);
    const picks = [];
    // "Next" means strictly in the future — a festival today would unlock
    // instantly, which makes a poor capsule.
    const moon = nextFullMoon(dayAfter(todayNoon));
    if (moon) picks.push({ label: '🌕 Next full moon', date: moon.date });
    const cny = nextLunarFestival('1-1', dayAfter(todayNoon));
    if (cny) picks.push({ label: '🧧 春节 CNY', date: cny });
    const midAutumn = nextLunarFestival('8-15', dayAfter(todayNoon));
    if (midAutumn) picks.push({ label: '🥮 中秋节', date: midAutumn });
    picks.push({
      label: '🎉 New Year',
      date: utcNoon(today.getFullYear() + 1, 1, 1),
    });
    return picks;
  }, []);

  const applyPick = (date) =>
    setOpenAtInput(
      toLocalInputValue(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
    );

  const openAtMs = openAtInput ? new Date(openAtInput).getTime() : NaN;
  const messageCharLength = Array.from(message).length;
  const canSeal =
    sealingAvailable() && message.trim().length > 0 && Number.isFinite(openAtMs) && openAtMs > now;

  const handleSeal = async () => {
    if (!canSeal) return;
    initAudio();
    requestNotificationPermission();
    const blob = await sealCapsule({ message: message.trim(), from: from.trim(), openAt: openAtMs });
    setShelf((s) => [...s, { blob, openAt: openAtMs, createdAt: Date.now(), opened: false }]);
    const link = `${window.location.origin}${window.location.pathname}${HASH_PREFIX}${blob}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        setCopied(true);
      }).catch(() => {});
    }
    setMessage('');
    setFrom('');
    setOpenAtInput('');
  };

  const handleCopyLink = (blob) => {
    const link = `${window.location.origin}${window.location.pathname}${HASH_PREFIX}${blob}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        setCopied(true);
      }).catch(() => {});
    }
  };

  const handleOpen = async (blob, index) => {
    initAudio(); // the click is our user gesture for the jingle
    const result = await openCapsule(blob);
    if (result.message === undefined) return; // still locked or corrupted — nothing to celebrate
    playCompletionSound();
    setRevealed({ blob, message: result.message, from: result.from });
    setShelf((s) => s.map((c, i) => (i === index ? { ...c, opened: true } : c)));
  };

  const handleRemove = (blob) => {
    if (revealed?.blob === blob) setRevealed(null);
    setShelf((s) => s.filter((c) => c.blob !== blob));
  };

  const keepIncoming = () => {
    if (!incoming) return;
    const openAt = incoming.result.openAt;
    setShelf((s) =>
      s.some((c) => c.blob === incoming.blob)
        ? s
        : [...s, { blob: incoming.blob, openAt, createdAt: Date.now(), opened: false }]
    );
    setIncoming(null);
  };

  const capsuleCard = (c, index) => {
    const ready = c.openAt <= now;
    const isRevealed = revealed?.blob === c.blob;
    return (
      <Paper
        key={c.blob.slice(-24)}
        elevation={2}
        sx={{ p: 2, borderRadius: '18px', bgcolor: 'background.default', width: '100%', position: 'relative' }}
      >
        <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="center">
          <Box
            component={ready && !isRevealed ? 'button' : 'div'}
            type={ready && !isRevealed ? 'button' : undefined}
            onClick={ready && !isRevealed ? () => handleOpen(c.blob, index) : undefined}
            aria-label={ready && !isRevealed ? 'Open this capsule' : undefined}
            className={ready && !isRevealed ? 'pudding-wobble' : undefined}
            sx={{
              flexShrink: 0,
              position: 'relative',
              border: 'none',
              background: 'none',
              p: 0,
              cursor: ready && !isRevealed ? 'pointer' : undefined,
            }}
          >
            <Pudding size={56} sleeping={!ready} />
            {isRevealed && <Sprinkles />}
          </Box>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            {isRevealed ? (
              <>
                <Typography sx={{ fontWeight: 700, color: 'text.primary', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {revealed.message}
                </Typography>
                {revealed.from && (
                  <Typography variant="caption" color="text.secondary">
                    — {revealed.from}
                  </Typography>
                )}
              </>
            ) : ready ? (
              <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>
                Ready! Tap the pudding to open 🍮
              </Typography>
            ) : (
              <Typography color="text.secondary">
                Sealed — opens in {formatCountdown(c.openAt - now)}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {new Date(c.openAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
            <IconButton size="small" aria-label="Copy share link" onClick={() => handleCopyLink(c.blob)}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" aria-label="Discard capsule" onClick={() => handleRemove(c.blob)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Stack>
      </Paper>
    );
  };

  return (
    <Box mt={6}>
      <Paper elevation={8} sx={{ p: { xs: 2.5, sm: 5 }, borderRadius: 3, maxWidth: 600, mx: 'auto' }}>
        <Stack spacing={3} alignItems="center">
          <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
            Pudding Time Capsules 时光胶囊
          </Typography>

          {/* A capsule someone shared with us */}
          {incoming && (
            <Paper elevation={4} sx={{ p: 2.5, borderRadius: '18px', width: '100%', bgcolor: 'background.default' }}>
              {incoming.result.invalid ? (
                <Typography color="text.secondary">
                  Oh no — this pudding got scrambled in transit. The link is damaged or was
                  tampered with, so it can&apos;t be opened. 🍮💔
                </Typography>
              ) : incoming.result.locked ? (
                <Stack direction="row" spacing={2} alignItems="center">
                  <Pudding size={56} sleeping />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                      Someone sent you a sealed capsule!
                    </Typography>
                    <Typography color="text.secondary">
                      It opens in {formatCountdown(incoming.result.openAt - now)} — no peeking.
                    </Typography>
                  </Box>
                  <Button variant="contained" onClick={keepIncoming}>
                    Keep it
                  </Button>
                </Stack>
              ) : (
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ position: 'relative', flexShrink: 0 }}>
                    <Pudding size={56} />
                    <Sprinkles />
                  </Box>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, color: 'text.primary', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {incoming.result.message}
                    </Typography>
                    {incoming.result.from && (
                      <Typography variant="caption" color="text.secondary">
                        — {incoming.result.from}
                      </Typography>
                    )}
                  </Box>
                  <Button variant="outlined" size="small" onClick={keepIncoming} sx={{ flexShrink: 0 }}>
                    Keep it
                  </Button>
                  <IconButton size="small" aria-label="Dismiss capsule" onClick={() => setIncoming(null)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
              )}
            </Paper>
          )}

          {/* Seal a new capsule */}
          <Box width="100%">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: 16 }}>
              Write a note to the future — it stays sealed inside a pudding until the moment you pick.
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Your message"
                multiline
                minRows={2}
                value={message}
                onChange={(e) => setMessage(safeSlice(e.target.value, MAX_MESSAGE_CHARS))}
                helperText={`${messageCharLength}/${MAX_MESSAGE_CHARS}`}
                fullWidth
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="From (optional)"
                  value={from}
                  onChange={(e) => setFrom(safeSlice(e.target.value, 40))}
                  sx={{ flexGrow: 1 }}
                />
                <TextField
                  label="Opens at"
                  type="datetime-local"
                  value={openAtInput}
                  onChange={(e) => setOpenAtInput(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ flexGrow: 1 }}
                />
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {quickPicks.map((p) => (
                  <Chip
                    key={p.label}
                    label={p.label}
                    onClick={() => applyPick(p.date)}
                    variant="outlined"
                    sx={{ fontWeight: 700, bgcolor: 'background.default' }}
                  />
                ))}
              </Stack>
              <Button
                variant="contained"
                startIcon={<RedeemIcon />}
                onClick={handleSeal}
                disabled={!canSeal}
                sx={{ alignSelf: 'center' }}
              >
                Seal the pudding
              </Button>
              {!sealingAvailable() && (
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                  Sealing needs a secure (https) connection.
                </Typography>
              )}
            </Stack>
          </Box>

          {/* The shelf */}
          <Box width="100%">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: 16 }}>
              Your capsule shelf
            </Typography>
            {shelf.length === 0 ? (
              <Typography variant="caption" color="text.secondary">
                Nothing here yet — seal your first capsule above! Sealing also copies a share
                link, so you can send a capsule to a friend.
              </Typography>
            ) : (
              <Stack spacing={1.5}>{shelf.map(capsuleCard)}</Stack>
            )}
          </Box>
        </Stack>
      </Paper>
      <Snackbar
        open={copied}
        autoHideDuration={3500}
        onClose={() => setCopied(false)}
        message="Sealed! Share link copied — it can't be opened early 🍮"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
      <Snackbar
        open={storageError}
        autoHideDuration={4000}
        onClose={() => setStorageError(false)}
        message="Storage full — couldn't save capsule to local shelf 🍮⚠️"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default Capsules;
