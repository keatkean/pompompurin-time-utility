import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { generatePin, getInitialControllerPin, isControllerMode } from './useRemoteSync';

describe('useRemoteSync utilities', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    delete window.location;
    window.location = new URL('http://localhost:5173/pompompurin-time-utility/');
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it('generatePin generates a 6-character case-sensitive alphanumeric string', () => {
    const pin = generatePin();
    expect(pin).toMatch(/^[a-zA-Z0-9]{6}$/);
  });



  it('isControllerMode returns false by default', () => {
    expect(isControllerMode()).toBe(false);
  });

  it('isControllerMode returns true when URL parameter mode=controller', () => {
    window.location = new URL('http://localhost:5173/pompompurin-time-utility/?mode=controller&pin=1234');
    expect(isControllerMode()).toBe(true);
    expect(getInitialControllerPin()).toBe('1234');
  });

  it('getInitialControllerPin extracts PIN from search params', () => {
    window.location = new URL('http://localhost:5173/pompompurin-time-utility/?mode=controller&pin=8888');
    expect(getInitialControllerPin()).toBe('8888');
  });
});
