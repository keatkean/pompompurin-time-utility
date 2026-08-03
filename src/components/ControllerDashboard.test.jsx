import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ControllerDashboard from './ControllerDashboard';

describe('ControllerDashboard Component', () => {
  const defaultProps = {
    pin: '1234',
    setPin: vi.fn(),
    isConnected: true,
    peerError: null,
    syncedState: {
      activeTab: 2, // Timer
      mode: 'light',
      timerState: {
        formattedTime: '03:45',
        isRunning: true,
      },
    },
    onSendCommand: vi.fn(),
    onConnectPin: vi.fn(),
  };

  it('renders presenter controller header and live remaining time banner', () => {
    render(<ControllerDashboard {...defaultProps} />);
    expect(screen.getByText(/Presenter Remote/i)).toBeInTheDocument();

    expect(screen.getByText('03:45')).toBeInTheDocument();
    expect(screen.getByText(/Countdown Running/i)).toBeInTheDocument();
  });

  it('triggers onSendCommand with TIMER_START when Start button is clicked', () => {
    render(<ControllerDashboard {...defaultProps} />);
    const startBtn = screen.getByRole('button', { name: /Start/i });
    fireEvent.click(startBtn);
    expect(defaultProps.onSendCommand).toHaveBeenCalledWith('TIMER_START');
  });

  it('triggers onSendCommand with TIMER_PAUSE when Pause button is clicked', () => {
    render(<ControllerDashboard {...defaultProps} />);
    const pauseBtn = screen.getByRole('button', { name: /Pause/i });
    fireEvent.click(pauseBtn);
    expect(defaultProps.onSendCommand).toHaveBeenCalledWith('TIMER_PAUSE');
  });

  it('triggers onSendCommand with ADD_TIME when +1 Min button is clicked', () => {
    render(<ControllerDashboard {...defaultProps} />);
    const addBtn = screen.getByRole('button', { name: /\+1 Min/i });
    fireEvent.click(addBtn);
    expect(defaultProps.onSendCommand).toHaveBeenCalledWith('ADD_TIME', 60);
  });

  it('triggers onSendCommand with CHANGE_TAB when tab button is clicked', () => {
    render(<ControllerDashboard {...defaultProps} />);
    const pomodoroTabBtn = screen.getByRole('button', { name: /Pomodoro/i });
    fireEvent.click(pomodoroTabBtn);
    expect(defaultProps.onSendCommand).toHaveBeenCalledWith('CHANGE_TAB', 4);
  });
});
