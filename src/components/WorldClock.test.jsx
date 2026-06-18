import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import WorldClock from './WorldClock';

beforeEach(() => {
  localStorage.clear();
  // The component syncs the zone list into the URL, so reset it between tests
  // to keep one test's shared link from leaking into the next.
  window.history.replaceState(null, '', '/');
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

  it('builds the clock from a ?tz= share link', () => {
    window.history.replaceState(null, '', '/?tz=Asia/Tokyo,Europe/London');
    render(<WorldClock />);

    expect(screen.getByText('Tokyo')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.queryByText('Singapore')).not.toBeInTheDocument();
  });

  it('lets a share link override the saved list', () => {
    localStorage.setItem(
      'worldClockTimeZones',
      JSON.stringify([{ city: 'Tokyo', timeZone: 'Asia/Tokyo' }])
    );
    window.history.replaceState(null, '', '/?tz=Europe/London');
    render(<WorldClock />);

    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.queryByText('Tokyo')).not.toBeInTheDocument();
  });

  it('drops invalid zones from the link and keeps the valid ones', () => {
    window.history.replaceState(null, '', '/?tz=Foo/Bar,Asia/Tokyo');
    render(<WorldClock />);

    expect(screen.getByText('Tokyo')).toBeInTheDocument();
    expect(screen.queryByText('Singapore')).not.toBeInTheDocument();
  });

  it('falls back to the default when the link has only invalid zones', () => {
    window.history.replaceState(null, '', '/?tz=Foo/Bar');
    render(<WorldClock />);

    expect(screen.getByText('Singapore')).toBeInTheDocument();
  });

  const openPicker = (query) => {
    const input = screen.getByRole('combobox');
    // MUI only processes the typed value once the input is focused.
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: query } });
    return within(screen.getByRole('listbox'));
  };

  it('finds a zone by country alias rather than only its IANA city', () => {
    render(<WorldClock />);
    // "britain" appears nowhere in Europe/London's id or city — only the alias
    // map. (London's id is stable across platforms, unlike Asia/Kolkata, which
    // some engines still report as the legacy Asia/Calcutta.)
    const listbox = openPicker('britain');

    expect(listbox.getByText('London')).toBeInTheDocument();
    // ...and the filter really narrows: an unrelated zone is not in the list.
    expect(listbox.queryByText('Tokyo')).not.toBeInTheDocument();
  });

  it('shows the current UTC offset for an option', () => {
    render(<WorldClock />);
    const listbox = openPicker('singapore');

    // Singapore has no DST, so it is always UTC+8 (the regex also matches the
    // enclosing <li>, so allow more than one node).
    expect(listbox.getAllByText(/UTC\+8 ·/).length).toBeGreaterThan(0);
  });

  it('copies a shareable link with the current zones to the clipboard', () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<WorldClock />);
    fireEvent.click(screen.getByRole('button', { name: /Copy shareable link/i }));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(decodeURIComponent(writeText.mock.calls[0][0])).toContain('tz=Asia/Singapore');
    expect(screen.getByText(/Link copied/)).toBeInTheDocument();
  });
});
