import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import Calendar from './Calendar';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-18T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Calendar', () => {
  it('opens on the current month', () => {
    render(<Calendar />);
    expect(screen.getByText('June 2026')).toBeInTheDocument();
  });

  it('navigates between months and back to today', () => {
    render(<Calendar />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByText('May 2026')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('July 2026')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(screen.getByText('June 2026')).toBeInTheDocument();
  });

  it('shows the 万年历 detail for a clicked day', () => {
    render(<Calendar />);
    fireEvent.click(screen.getByRole('button', { name: /June 1, 2026/ }));

    expect(screen.getByText(/Monday, June 1, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/农历/)).toBeInTheDocument();
  });

  it('shows the solar term (节气) for the day it falls on', () => {
    render(<Calendar />);
    // 2026-06-21 is 夏至 (Summer Solstice) — in the default June view.
    fireEvent.click(screen.getByRole('button', { name: /June 21, 2026/ }));
    // Scope to the detail card's 节气 line (夏至 also appears in the grid cell).
    expect(screen.getByText(/节气 夏至/)).toBeInTheDocument();
  });

  it('jumps to a distant year via the title picker', () => {
    render(<Calendar />);
    fireEvent.click(screen.getByRole('button', { name: /June 2026/ }));

    // 2026 → 1986 (four decades back), then +1 twice → 1988.
    const back10 = screen.getByRole('button', { name: 'Previous decade' });
    for (let i = 0; i < 4; i += 1) fireEvent.click(back10);
    const up1 = screen.getByRole('button', { name: 'Next year' });
    fireEvent.click(up1);
    fireEvent.click(up1);

    fireEvent.click(screen.getByRole('button', { name: 'Mar' }));
    expect(screen.getByText('March 1988')).toBeInTheDocument();
  });

  it('shows the moon phase and a daily fortune in the detail card', () => {
    render(<Calendar />);
    // The fortune line (🥠) and a moon-phase glyph always render for the day.
    expect(screen.getByText(/🥠/)).toBeInTheDocument();
    expect(screen.getByText(/🌑|🌒|🌓|🌔|🌕|🌖|🌗|🌘/)).toBeInTheDocument();
  });

  it('reacts when the World Clock zone list changes', () => {
    localStorage.setItem(
      'worldClockTimeZones',
      JSON.stringify([{ city: 'New York', timeZone: 'America/New_York' }])
    );
    render(<Calendar />);
    // Today is selected by default, so the "around the world" footer lists zones.
    expect(screen.getByText(/New York/)).toBeInTheDocument();

    // Simulate the World Clock removing New York.
    act(() => {
      localStorage.setItem('worldClockTimeZones', JSON.stringify([]));
      window.dispatchEvent(new CustomEvent('worldclock-zones-changed'));
    });

    expect(screen.queryByText(/New York/)).not.toBeInTheDocument();
  });
});
