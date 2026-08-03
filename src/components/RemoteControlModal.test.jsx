import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RemoteControlModal from './RemoteControlModal';

describe('RemoteControlModal Component', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    pin: '1234',
    isConnected: false,
    connectedCount: 0,
    peerError: null,
    onRegeneratePin: vi.fn(),
  };

  it('renders modal with title and pairing PIN', () => {
    render(<RemoteControlModal {...defaultProps} />);
    expect(screen.getByText(/Presenter Remote/i)).toBeInTheDocument();
    expect(screen.getByText('1234')).toBeInTheDocument();
    expect(screen.getByText(/Waiting for controller/i)).toBeInTheDocument();

  });

  it('renders connected status badge when isConnected is true', () => {
    render(<RemoteControlModal {...defaultProps} isConnected={true} connectedCount={1} />);
    expect(screen.getByText(/Connected \(1 device\)/i)).toBeInTheDocument();
  });

  it('calls onRegeneratePin when refresh button is clicked', () => {
    render(<RemoteControlModal {...defaultProps} />);
    const refreshBtn = screen.getByRole('button', { name: /Generate new PIN/i });
    fireEvent.click(refreshBtn);
    expect(defaultProps.onRegeneratePin).toHaveBeenCalled();
  });

  it('calls onClose when Done or Close button is clicked', () => {
    render(<RemoteControlModal {...defaultProps} />);
    const doneBtn = screen.getByRole('button', { name: /Done/i });
    fireEvent.click(doneBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
