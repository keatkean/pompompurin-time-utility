import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Capsules from './Capsules';
import { formatCountdown } from '../utils/formatTime';
import { sealCapsule, saveShelf } from '../utils/capsule';

// Real timers throughout: the seal/open paths are async Web Crypto, and the
// component's 30s shelf tick is irrelevant at test timescales.
beforeEach(() => {
  localStorage.clear();
  window.location.hash = '';
  vi.stubGlobal(
    'Audio',
    class {
      play = vi.fn(() => Promise.resolve());
    }
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.location.hash = '';
});

const HOUR = 3_600_000;

describe('Capsules', () => {
  it('seals a message onto the shelf and clears the form', async () => {
    render(<Capsules />);
    fireEvent.change(screen.getByLabelText('Your message'), { target: { value: 'hi future' } });
    fireEvent.change(screen.getByLabelText('Opens at'), { target: { value: '2099-01-01T09:00' } });
    fireEvent.click(screen.getByRole('button', { name: /Seal the pudding/ }));

    await waitFor(() => expect(screen.getByText(/Sealed — opens in/)).toBeInTheDocument());
    expect(screen.getByLabelText('Your message')).toHaveValue('');

    const saved = JSON.parse(localStorage.getItem('pompompurinCapsules'));
    expect(saved).toHaveLength(1);
    expect(saved[0].blob).toMatch(/^v1\./);
    expect(saved[0].opened).toBe(false);
  });

  it('refuses to seal into the past', () => {
    render(<Capsules />);
    fireEvent.change(screen.getByLabelText('Your message'), { target: { value: 'time travel?' } });
    fireEvent.change(screen.getByLabelText('Opens at'), { target: { value: '2001-01-01T09:00' } });
    expect(screen.getByRole('button', { name: /Seal the pudding/ })).toBeDisabled();
  });

  it('opens a ready capsule with sprinkles and the message', async () => {
    const openAt = Date.now() - 1000;
    const blob = await sealCapsule({ message: 'surprise! 🍮', from: 'past me', openAt });
    saveShelf([{ blob, openAt, createdAt: openAt - HOUR, opened: false }]);

    render(<Capsules />);
    expect(screen.getByText(/Ready! Tap the pudding/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open this capsule' }));
    await waitFor(() => expect(screen.getByText('surprise! 🍮')).toBeInTheDocument());
    expect(screen.getByText('— past me')).toBeInTheDocument();
  });

  it('shows an incoming locked capsule from a share link and keeps it', async () => {
    const openAt = Date.now() + 24 * HOUR;
    const blob = await sealCapsule({ message: 'not yet!', openAt });
    window.location.hash = `#capsule=${blob}`;

    render(<Capsules />);
    await waitFor(() =>
      expect(screen.getByText(/Someone sent you a sealed capsule/)).toBeInTheDocument()
    );
    expect(screen.queryByText('not yet!')).not.toBeInTheDocument(); // sealed means sealed

    fireEvent.click(screen.getByRole('button', { name: 'Keep it' }));
    const saved = JSON.parse(localStorage.getItem('pompompurinCapsules'));
    expect(saved).toHaveLength(1);
    expect(saved[0].openAt).toBe(openAt);
  });

  it('reveals an incoming capsule that is already ripe', async () => {
    const blob = await sealCapsule({ message: 'happy birthday!! 🎂', from: 'kk', openAt: Date.now() - 1000 });
    window.location.hash = `#capsule=${blob}`;

    render(<Capsules />);
    await waitFor(() => expect(screen.getByText('happy birthday!! 🎂')).toBeInTheDocument());
  });

  it('shows a friendly error for a scrambled link instead of crashing', async () => {
    window.location.hash = '#capsule=v1.this-is-not-a-capsule';
    render(<Capsules />);
    await waitFor(() => expect(screen.getByText(/scrambled in transit/)).toBeInTheDocument());
  });
});

describe('formatCountdown', () => {
  it('formats coarse, honest countdowns', () => {
    expect(formatCountdown(23 * 24 * HOUR + 4 * HOUR)).toBe('23d 4h');
    expect(formatCountdown(3 * HOUR + 12 * 60000)).toBe('3h 12m');
    expect(formatCountdown(90_000)).toBe('2m');
    expect(formatCountdown(10)).toBe('1m'); // never "0m" while still locked
  });
});
