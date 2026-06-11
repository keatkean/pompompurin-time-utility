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
});
