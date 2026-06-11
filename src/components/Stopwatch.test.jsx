import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import Stopwatch from './Stopwatch';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Stopwatch', () => {
  it('measures elapsed wall-clock time and freezes exactly on stop', () => {
    render(<Stopwatch />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));

    act(() => vi.advanceTimersByTime(1100));
    expect(screen.getByText(/00:00:01\.\d{2}/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(screen.getByText('00:00:01.10')).toBeInTheDocument();

    // Resuming continues from the frozen time.
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => vi.advanceTimersByTime(900));
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(screen.getByText('00:00:02.00')).toBeInTheDocument();
  });

  it('records laps as deltas with cumulative totals', () => {
    render(<Stopwatch />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));

    act(() => vi.advanceTimersByTime(1000));
    fireEvent.click(screen.getByRole('button', { name: 'Lap' }));
    act(() => vi.advanceTimersByTime(500));
    fireEvent.click(screen.getByRole('button', { name: 'Lap' }));

    expect(screen.getByText('Lap 1: 00:00:01.00')).toBeInTheDocument();
    expect(screen.getByText('Lap 2: 00:00:00.50')).toBeInTheDocument();
    expect(screen.getByText('Total: 00:00:01.50')).toBeInTheDocument();
  });

  it('resets time and laps', () => {
    render(<Stopwatch />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => vi.advanceTimersByTime(1000));
    fireEvent.click(screen.getByRole('button', { name: 'Lap' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(screen.getByText('00:00:00.00')).toBeInTheDocument();
    expect(screen.queryByText(/Lap 1/)).not.toBeInTheDocument();
  });
});
