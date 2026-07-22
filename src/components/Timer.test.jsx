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

  it('accepts a natural-language quick set', () => {
    render(<Timer />);
    fireEvent.change(screen.getByLabelText(/Quick set/), { target: { value: '1h30m' } });
    fireEvent.click(screen.getByRole('button', { name: 'Set' }));
    expect(screen.getByText('01:30:00')).toBeInTheDocument();
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

  it('plays the alert when restoring a timer that finished while away', () => {
    localStorage.setItem(
      'pompompurinTimer',
      JSON.stringify({ endTime: Date.now() - 5_000, initialTime: 60 })
    );
    render(<Timer />);

    expect(playMock).toHaveBeenCalledTimes(1);
  });

  it('restores a paused timer after a page refresh', () => {
    // Pausing persists the frozen remaining time; a refresh should resume it
    // paused at that time rather than losing the timer entirely.
    localStorage.setItem(
      'pompompurinTimer',
      JSON.stringify({ paused: true, remaining: 200, initialTime: 300 })
    );
    render(<Timer />);

    expect(screen.getByText('00:03:20')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume' })).toBeEnabled();

    // It is paused, so the clock does not advance on its own.
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText('00:03:20')).toBeInTheDocument();
  });

  it('keeps a paused timer in storage so it survives a refresh', () => {
    render(<Timer />);
    fireEvent.change(screen.getByLabelText('Minutes'), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));

    act(() => vi.advanceTimersByTime(99 * 1000));
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));

    const saved = JSON.parse(localStorage.getItem('pompompurinTimer'));
    expect(saved.paused).toBe(true);
    expect(saved.remaining).toBe(201);
    expect(saved.initialTime).toBe(300);
  });

  it('switches between Quick, Presentation, and Exam modes', () => {
    render(<Timer />);
    fireEvent.click(screen.getByRole('button', { name: 'Presentation Segments' }));
    expect(screen.getByText(/30m: 5 Students/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Classroom Exam' }));
    expect(screen.getByLabelText('Exam / Test Title')).toBeInTheDocument();
  });

  it('configures presentation segments and advances speakers via Next Speaker', () => {
    render(<Timer />);
    fireEvent.click(screen.getByRole('button', { name: 'Presentation Segments' }));
    fireEvent.click(screen.getByText(/13m: Pair/)); // Pair @ 4m each + 5m Q&A = 13m

    expect(screen.getByText('00:13:00')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(screen.getAllByText(/Student 1/).length).toBeGreaterThan(0);

    // Advance to next speaker (Student 2)
    fireEvent.click(screen.getByRole('button', { name: 'Next Speaker' }));
    expect(screen.getAllByText(/Student 2/).length).toBeGreaterThan(0);
  });

  it('provides a fullscreen toggle button across all timer modes', () => {
    render(<Timer />);
    expect(screen.getAllByRole('button', { name: /Fullscreen/i }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Presentation Segments' }));
    expect(screen.getAllByRole('button', { name: /Fullscreen/i }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Classroom Exam' }));
    expect(screen.getAllByRole('button', { name: /Fullscreen/i }).length).toBeGreaterThan(0);
  });
});


