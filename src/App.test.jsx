import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders App title without throwing runtime reference errors', () => {
    render(<App />);
    expect(screen.getByText('Pompompurin Time Utility')).toBeDefined();
  });
});
