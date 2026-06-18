import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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
});
