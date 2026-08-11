import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import Pomodoro from './Pomodoro';

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

describe('Pomodoro', () => {
  it('completes a focus session, awards a sticker, and auto-starts the break', () => {
    render(<Pomodoro />);
    fireEvent.change(screen.getByLabelText('Focus (min)'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Break (min)'), { target: { value: '1' } });
    expect(screen.getByText('00:01:00')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(screen.getByText('Focus time 📚')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByText('Break time ☁️')).toBeInTheDocument();
    expect(screen.getByText(/1 collected/)).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByText('Ready for a focus session?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start' })).toBeEnabled();
  });

  it('renders the saved sticker collection with golden sets', () => {
    localStorage.setItem('pompompurinPomodoroStickers', JSON.stringify(5));
    render(<Pomodoro />);
    expect(screen.getByText(/5 collected · 1 golden/)).toBeInTheDocument();
  });

  it('awards the sticker for a focus session that completed while the tab was closed', () => {
    localStorage.setItem(
      'pompompurinPomodoroSession',
      JSON.stringify({ endTime: Date.now() - 5_000, phase: 'focus', focusMinutes: 25, breakMinutes: 5 })
    );
    render(<Pomodoro />);

    expect(screen.getByText(/1 collected/)).toBeInTheDocument();
    expect(screen.getByText('Ready for a focus session?')).toBeInTheDocument();
    expect(localStorage.getItem('pompompurinPomodoroSession')).toBeNull();
  });

  it('restores a running session after a page refresh', () => {
    localStorage.setItem(
      'pompompurinPomodoroSession',
      JSON.stringify({ endTime: Date.now() + 30_000, phase: 'focus', focusMinutes: 25, breakMinutes: 5 })
    );
    render(<Pomodoro />);

    expect(screen.getByText('00:00:30')).toBeInTheDocument();
    expect(screen.getByText('Focus time 📚')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeEnabled();
  });

  it('reveals the breathing guide on demand', () => {
    render(<Pomodoro />);
    fireEvent.click(screen.getByRole('button', { name: /Take a breath/ }));
    expect(screen.getByText(/Breathe in/)).toBeInTheDocument();
  });

  it('keeps a paused session in storage so it survives a refresh', () => {
    render(<Pomodoro />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' })); // default 25 min focus

    act(() => vi.advanceTimersByTime(60_000));
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));

    const saved = JSON.parse(localStorage.getItem('pompompurinPomodoroSession'));
    expect(saved.paused).toBe(true);
    expect(saved.phase).toBe('focus');
    expect(saved.remaining).toBe(24 * 60);
  });

  it('restores a paused session after a page refresh', () => {
    localStorage.setItem(
      'pompompurinPomodoroSession',
      JSON.stringify({ paused: true, remaining: 90, phase: 'focus', focusMinutes: 25, breakMinutes: 5 })
    );
    render(<Pomodoro />);

    expect(screen.getByText('00:01:30')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume' })).toBeEnabled();

    // It is paused, so the clock does not advance on its own.
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText('00:01:30')).toBeInTheDocument();
  });

  it('fires each completion only once even when extra ticks land at zero', () => {
    render(<Pomodoro />);
    fireEvent.change(screen.getByLabelText('Focus (min)'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Break (min)'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));

    // Advance past each boundary in one act() so several interval ticks run at
    // remaining===0 before React re-renders and tears the interval down.
    act(() => {
      vi.advanceTimersByTime(60_000);
      vi.advanceTimersByTime(1000);
    });
    expect(playMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/1 collected/)).toBeInTheDocument();

    playMock.mockClear();
    act(() => {
      vi.advanceTimersByTime(59_000);
      vi.advanceTimersByTime(1000);
    });
    expect(playMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Ready for a focus session?')).toBeInTheDocument();
  });

  it('clamps the focus and break inputs', () => {
    render(<Pomodoro />);
    const focus = screen.getByLabelText('Focus (min)');
    fireEvent.change(focus, { target: { value: '999' } });
    expect(focus).toHaveValue(120);
    fireEvent.change(focus, { target: { value: '' } });
    expect(focus).toHaveValue(null);
    fireEvent.blur(focus);
    expect(focus).toHaveValue(1);
  });
});
