import { useState, useEffect } from 'react';
import { Stack, Box, Typography } from '@mui/material';
import Pudding from './Pudding';

// A calm box-breathing guide: the pudding swells as you inhale and shrinks as
// you exhale (CSS handles the motion). The label flips every 4s to match the
// 8-second animation loop. Sits between focus sessions.
const BreathingPudding = () => {
  const [phase, setPhase] = useState('in');

  useEffect(() => {
    const id = setInterval(() => setPhase((p) => (p === 'in' ? 'out' : 'in')), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <Stack alignItems="center" spacing={1.5} sx={{ py: 1 }}>
      <Box className="pudding-breathe">
        <Pudding size={120} sleeping />
      </Box>
      <Typography sx={{ fontWeight: 700, color: 'primary.main', fontSize: 20 }}>
        {phase === 'in' ? 'Breathe in 🫧' : 'Breathe out 😮‍💨'}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
        Follow the pudding — grow as you breathe in, settle as you breathe out.
      </Typography>
    </Stack>
  );
};

export default BreathingPudding;
