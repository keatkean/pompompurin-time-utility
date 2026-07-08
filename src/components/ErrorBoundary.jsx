import { Component } from 'react';
import { Paper, Typography, Button, Stack } from '@mui/material';

// Last line of defense: without a boundary, one uncaught render error in any
// tab blanks the entire app (React unmounts the whole tree). The storage layer
// is defensive, but this catches whatever slips through — a reload re-parses
// persisted state from scratch, which fixes most one-off bad states.
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <Paper elevation={8} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3, maxWidth: 600, mx: 'auto', width: '100%' }}>
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
            Oops — Pompompurin tripped! 🍮
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Something went wrong showing this page. Reloading usually fixes it.
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </Stack>
      </Paper>
    );
  }
}

export default ErrorBoundary;
