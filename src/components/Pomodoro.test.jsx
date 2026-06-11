import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import Pomodoro from './Pomodoro';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.stubGlobal(
    'Audio',
    class {
      play = vi.fn(() => Promise.resolve());
    }
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
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

  it('clamps the focus and break inputs', () => {
    render(<Pomodoro />);
    const focus = screen.getByLabelText('Focus (min)');
    fireEvent.change(focus, { target: { value: '999' } });
    expect(focus).toHaveValue(120);
    fireEvent.change(focus, { target: { value: '' } });
    expect(focus).toHaveValue(1);
  });
});
