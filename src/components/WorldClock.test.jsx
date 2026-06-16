import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import WorldClock from './WorldClock';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('WorldClock', () => {
  it('renders the default clock and ticks every second', () => {
    // 04:00 UTC is 12:00:00 PM in Singapore (UTC+8).
    vi.setSystemTime(new Date('2026-06-11T04:00:00Z'));
    render(<WorldClock />);

    expect(screen.getByText('Singapore')).toBeInTheDocument();
    expect(screen.getByText(/12:00:00/)).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText(/12:00:01/)).toBeInTheDocument();
  });

  it('restores saved time zones from localStorage', () => {
    localStorage.setItem(
      'worldClockTimeZones',
      JSON.stringify([{ city: 'Tokyo', timeZone: 'Asia/Tokyo' }])
    );
    render(<WorldClock />);

    expect(screen.getByText('Tokyo')).toBeInTheDocument();
    expect(screen.queryByText('Singapore')).not.toBeInTheDocument();
  });

  it('falls back to the default when saved data is corrupted', () => {
    localStorage.setItem('worldClockTimeZones', '{not valid json');
    render(<WorldClock />);

    expect(screen.getByText('Singapore')).toBeInTheDocument();
  });

  it('disables removing the only remaining time zone', () => {
    render(<WorldClock />);
    expect(screen.getByRole('button', { name: 'Remove Singapore' })).toBeDisabled();
  });

  it('falls back to the default when a saved time zone is not a real IANA zone', () => {
    // A syntactically valid array whose timeZone is a string but not a real
    // zone used to pass validation and then throw a RangeError during render,
    // white-screening the whole app on every reload.
    localStorage.setItem(
      'worldClockTimeZones',
      JSON.stringify([{ city: 'X', timeZone: 'Foo/Bar' }])
    );
    render(<WorldClock />);

    expect(screen.getByText('Singapore')).toBeInTheDocument();
  });
});
