import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import CursorChaser from './CursorChaser';

// jsdom has no matchMedia; the component treats that as "not chase-worthy", so
// tests stub it to simulate a mouse-and-motion-friendly environment.
function stubMatchMedia({ finePointer = true, reducedMotion = false } = {}) {
  vi.stubGlobal('matchMedia', (query) => ({
    matches: query.includes('pointer') ? finePointer : reducedMotion,
  }));
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const moveMouse = (x, y) => fireEvent.mouseMove(window, { clientX: x, clientY: y });

describe('CursorChaser', () => {
  it('renders nothing until the mouse first moves', () => {
    stubMatchMedia();
    render(<CursorChaser />);
    expect(screen.queryByTestId('cursor-chaser')).not.toBeInTheDocument();

    act(() => moveMouse(100, 100));
    expect(screen.getByTestId('cursor-chaser')).toBeInTheDocument();
  });

  it('is invisible to assistive tech and never blocks clicks', () => {
    stubMatchMedia();
    render(<CursorChaser />);
    act(() => moveMouse(100, 100));

    const chaser = screen.getByTestId('cursor-chaser');
    expect(chaser).toHaveAttribute('aria-hidden', 'true');
    expect(chaser).toHaveStyle({ pointerEvents: 'none' });
  });

  it('stays away when disabled via the toggle', () => {
    stubMatchMedia();
    render(<CursorChaser enabled={false} />);
    act(() => moveMouse(100, 100));
    expect(screen.queryByTestId('cursor-chaser')).not.toBeInTheDocument();
  });

  it('stays away on touch devices and for reduced-motion users', () => {
    stubMatchMedia({ finePointer: false });
    const { unmount } = render(<CursorChaser />);
    act(() => moveMouse(100, 100));
    expect(screen.queryByTestId('cursor-chaser')).not.toBeInTheDocument();
    unmount();

    stubMatchMedia({ reducedMotion: true });
    render(<CursorChaser />);
    act(() => moveMouse(100, 100));
    expect(screen.queryByTestId('cursor-chaser')).not.toBeInTheDocument();
  });

  it('falls asleep when the mouse goes idle and wakes on movement', () => {
    stubMatchMedia();
    render(<CursorChaser />);
    act(() => moveMouse(100, 100));
    expect(screen.queryByText('💤')).not.toBeInTheDocument();

    // Idle past the sleep threshold; the rAF loop notices on its next frames.
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByText('💤')).toBeInTheDocument();

    act(() => moveMouse(200, 200));
    expect(screen.queryByText('💤')).not.toBeInTheDocument();
  });
});
