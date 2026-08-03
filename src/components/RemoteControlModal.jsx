import { useState, useEffect } from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Stack,
  useTheme,

  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckIcon from '@mui/icons-material/Check';
import { QRCodeSVG } from 'qrcode.react';

export default function RemoteControlModal({
  open,
  onClose,
  pin,
  isConnected,
  connectedCount,
  peerError,
  onRegeneratePin,
  onDisconnectAll,
}) {

  const [copied, setCopied] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isCompactHeight = useMediaQuery('(max-height:680px)');

  const controllerUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?mode=controller&pin=${pin}`
      : `?mode=controller&pin=${pin}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(controllerUrl);
      setCopied(true);
    } catch {
      // fallback
    }
  };

  // Auto-close modal when controller device connects successfully
  useEffect(() => {
    if (isConnected && open) {
      const timer = setTimeout(() => {
        onClose();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, open, onClose]);


  // Color tokens based on light/dark mode
  const bgGradient = isDark
    ? 'linear-gradient(180deg, #3D3750 0%, #2E2A3D 100%)'
    : 'linear-gradient(180deg, #FFFDF8 0%, #FFF8DC 100%)';
  const borderTone = isDark ? '#FFD98A' : '#FFE082';
  const titleColor = isDark ? '#FFF3D6' : '#5B4222';
  const subtitleColor = isDark ? '#E6CBA8' : '#7A5C37';
  const pinCardBg = isDark ? 'rgba(86, 79, 111, 0.65)' : 'rgba(255, 255, 255, 0.85)';
  const pinTextColor = isDark ? '#FFD98A' : '#5B4222';
  const doneBtnBg = isDark
    ? 'linear-gradient(135deg, #FFD98A 0%, #E6CBA8 100%)'
    : 'linear-gradient(135deg, #A67C52 0%, #6B4F2B 100%)';
  const doneBtnText = isDark ? '#3E2F18' : '#FFF8DC';

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px', // Standard 24px corners - eliminates corner truncation
            background: bgGradient,
            boxShadow: isDark ? '0 20px 60px rgba(0, 0, 0, 0.5)' : '0 20px 60px rgba(91, 66, 34, 0.25)',
            border: `3px solid ${borderTone}`,
            maxHeight: 'calc(100vh - 32px)',
            display: 'flex',
            flexDirection: 'column',
            m: 2,
            overflow: 'hidden',
          },
        }}
      >
        {/* Header - aligned icon, title text, and top-right close button */}
        <DialogTitle
          sx={{
            m: 0,
            pt: 2.5,
            pb: 1,
            px: 3,
            pr: 6,
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <Box display="flex" alignItems="center" gap={1.2}>
            <Box
              sx={{
                width: 36,
                height: 36,
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
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{ color: titleColor, fontSize: '1.2rem', lineHeight: 1.2 }}
            >
              Presenter Remote 📱
            </Typography>
          </Box>

          <IconButton
            onClick={onClose}
            aria-label="close"
            size="small"
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              color: isDark ? '#FFD98A' : '#5B4222',
              bgcolor: isDark ? 'rgba(255, 217, 138, 0.15)' : 'rgba(166, 124, 82, 0.12)',
              border: `1px solid ${isDark ? 'rgba(255, 217, 138, 0.3)' : 'rgba(166, 124, 82, 0.2)'}`,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: isDark ? 'rgba(255, 217, 138, 0.3)' : 'rgba(166, 124, 82, 0.25)',
                transform: 'scale(1.08)',
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>



        {/* Content Body with vertical auto-scroll safety */}
        <DialogContent
          sx={{
            textAlign: 'center',
            px: 3,
            py: 1,
            overflowY: 'auto',
            flex: '1 1 auto',
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': { bgcolor: isDark ? '#564F6F' : '#E6CBA8', borderRadius: 3 },
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: subtitleColor, mb: 1.2, fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.35 }}
          >
            Scan with your phone camera or open the link on Laptop B to control the presentation.
          </Typography>

          {/* QR Code Container */}
          <Box
            sx={{
              p: isCompactHeight ? 1.2 : 1.5,
              bgcolor: '#FFFFFF',
              borderRadius: 4,
              display: 'inline-flex',
              alignItems: 'center',
              justify: 'center',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
              border: `3px solid ${borderTone}`,
              mb: 1.2,
            }}
          >
            <QRCodeSVG
              value={controllerUrl}
              size={isCompactHeight ? 110 : 125}
              level="M"
              fgColor="#2E2A3D"
              bgColor="#FFFFFF"
            />
          </Box>

          {/* Pairing PIN Card */}
          <Box
            sx={{
              bgcolor: pinCardBg,
              borderRadius: 4,
              py: 1.2,
              px: 2,
              border: `2px dashed ${borderTone}`,
              mb: 1.2,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: subtitleColor, fontWeight: 800, letterSpacing: 1.5, fontSize: '0.7rem', display: 'block', mb: 0.2 }}
            >
              PAIRING PIN CODE
            </Typography>

            <Typography
              variant="h4"
              fontWeight={800}
              sx={{
                color: pinTextColor,
                letterSpacing: { xs: 3, sm: 5 },
                fontFamily: "'Baloo 2', cursive, monospace",
                fontSize: { xs: '1.6rem', sm: '1.9rem' },
                lineHeight: 1.2,
                textAlign: 'center',
                width: '100%',
              }}
            >
              {pin}
            </Typography>

            <Tooltip title="Generate new PIN">
              <IconButton
                onClick={onRegeneratePin}
                size="small"
                sx={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: isDark ? '#3E2F18' : '#A67C52',
                  bgcolor: isDark ? '#FFD98A' : '#FFF8DC',
                  border: `1.5px solid ${borderTone}`,
                  p: 0.6,
                  '&:hover': {
                    bgcolor: '#FFE082',
                    transform: 'translateY(-50%) rotate(180deg)',
                    transition: 'transform 0.3s',
                  },
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>



          {/* Connection Status Badge */}
          <Box mb={1.2}>
            {peerError ? (
              <Alert severity="warning" sx={{ borderRadius: 3, textAlign: 'left', fontSize: '0.78rem', py: 0.2 }}>
                {peerError}
              </Alert>
            ) : isConnected ? (
              <Stack alignItems="center" spacing={1}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.8,
                    px: 1.8,
                    py: 0.4,
                    borderRadius: 20,
                    bgcolor: isDark ? 'rgba(46, 125, 50, 0.25)' : '#E8F5E9',
                    border: isDark ? '1.5px solid #81C784' : '2px solid #A5D6A7',
                    color: isDark ? '#A5D6A7' : '#2E7D32',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#4CAF50',
                      boxShadow: '0 0 0 3px rgba(76, 175, 80, 0.3)',
                    }}
                  />
                  Connected ({connectedCount} device{connectedCount > 1 ? 's' : ''})
                </Box>
                {onDisconnectAll && (
                  <Button
                    size="small"
                    color="error"
                    variant="text"
                    onClick={onDisconnectAll}
                    sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'none' }}
                  >
                    🚫 Revoke & Disconnect All Devices
                  </Button>
                )}
              </Stack>

            ) : (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.8,
                  px: 1.8,
                  py: 0.4,
                  borderRadius: 20,
                  bgcolor: isDark ? 'rgba(255, 179, 0, 0.18)' : '#FFF8E1',
                  border: `1.5px solid ${borderTone}`,
                  color: isDark ? '#FFD98A' : '#B78103',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#FFB300',
                    animation: 'pulse 1.5s infinite',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(255, 179, 0, 0.7)' },
                      '70%': { transform: 'scale(1)', boxShadow: '0 0 0 5px rgba(255, 179, 0, 0)' },
                      '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(255, 179, 0, 0)' },
                    },
                  }}
                />
                Waiting for controller...
              </Box>
            )}
          </Box>

          {/* Copy Link Button */}
          <Button
            variant="outlined"
            startIcon={copied ? <CheckIcon color="success" /> : <ContentCopyIcon />}
            onClick={handleCopyLink}
            fullWidth
            sx={{
              borderRadius: 3.5,
              borderColor: borderTone,
              color: titleColor,
              fontWeight: 700,
              py: 0.8,
              fontSize: '0.85rem',
              bgcolor: isDark ? 'rgba(86, 79, 111, 0.4)' : 'rgba(255, 255, 255, 0.6)',
              '&:hover': {
                borderColor: borderTone,
                bgcolor: isDark ? 'rgba(86, 79, 111, 0.7)' : '#FFF3D6',
              },
            }}
          >
            {copied ? 'Copied to Clipboard! 📋' : 'Copy Controller Link'}
          </Button>
        </DialogContent>

        {/* Footer Actions - comfortable bottom padding so Done button is never cut off */}
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, flexShrink: 0 }}>
          <Button
            onClick={onClose}
            variant="contained"
            fullWidth
            sx={{
              borderRadius: 4,
              py: 1.1,
              background: doneBtnBg,
              color: doneBtnText,
              fontWeight: 800,
              fontSize: '0.95rem',
              boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.4)' : '0 4px 14px rgba(107, 79, 43, 0.3)',
              '&:hover': {
                opacity: 0.9,
              },
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={copied}
        autoHideDuration={2500}
        onClose={() => setCopied(false)}
        message="Controller link copied to clipboard! 🍮"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}
