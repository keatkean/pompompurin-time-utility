import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import Timer from './Timer';

const playMock = vi.fn(() => Promise.resolve());

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.stubGlobal(
    'Audio',
    class {
      play = playMock;
    }
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  playMock.mockClear();
});

describe('Timer', () => {
  it('sanitizes cleared and out-of-range inputs', () => {
    render(<Timer />);
    const seconds = screen.getByLabelText('Seconds');
    const minutes = screen.getByLabelText('Minutes');

    fireEvent.change(seconds, { target: { value: '' } });
    expect(seconds).toHaveValue(0);

    fireEvent.change(minutes, { target: { value: '75' } });
    expect(minutes).toHaveValue(59);

    fireEvent.change(minutes, { target: { value: '-5' } });
    expect(minutes).toHaveValue(0);
  });

  it('does not start when no time is set', () => {
    render(<Timer />);
    expect(screen.getByRole('button', { name: 'Start' })).toBeDisabled();
    expect(playMock).not.toHaveBeenCalled();
  });

  it('counts down wall-clock time and celebrates on completion', () => {
    render(<Timer />);
    fireEvent.change(screen.getByLabelText('Seconds'), { target: { value: '2' } });
    expect(screen.getByText('00:00:02')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText('00:00:01')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1000));
    expect(playMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Time's up/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled();
  });

  it('resumes from where it was paused', () => {
    render(<Timer />);
    fireEvent.change(screen.getByLabelText('Minutes'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));

    act(() => vi.advanceTimersByTime(99 * 1000));
    expect(screen.getByText('00:03:21')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText('00:03:20')).toBeInTheDocument();
  });

  it('restores a running timer after a page refresh', () => {
    localStorage.setItem(
      'pompompurinTimer',
      JSON.stringify({ endTime: Date.now() + 90_000, initialTime: 120 })
    );
    render(<Timer />);

    expect(screen.getByText('00:01:30')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeEnabled();

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText('00:01:29')).toBeInTheDocument();
  });

  it('shows the celebration when the timer finished while the page was closed', () => {
    localStorage.setItem(
      'pompompurinTimer',
      JSON.stringify({ endTime: Date.now() - 5_000, initialTime: 60 })
    );
    render(<Timer />);

    expect(screen.getByText(/Time's up/)).toBeInTheDocument();
    expect(localStorage.getItem('pompompurinTimer')).toBeNull();
  });
});
