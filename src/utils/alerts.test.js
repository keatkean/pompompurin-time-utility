import { afterEach, describe, expect, it, vi } from 'vitest';
import { notify } from './alerts';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('notify', () => {
  it('does nothing when Notification is unavailable', () => {
    expect(() => notify('hi')).not.toThrow();
  });

  it('shows a notification when permission is granted', () => {
    const created = [];
    class FakeNotification {
      static permission = 'granted';
      constructor(title) {
        created.push(title);
      }
    }
    vi.stubGlobal('Notification', FakeNotification);

    notify('hello');
    expect(created).toEqual(['hello']);
  });

  it('stays silent without permission', () => {
    const created = [];
    class FakeNotification {
      static permission = 'denied';
      constructor(title) {
        created.push(title);
      }
    }
    vi.stubGlobal('Notification', FakeNotification);

    notify('hello');
    expect(created).toEqual([]);
  });

  it('never throws where page-context construction is forbidden (Android)', () => {
    // Android Chrome throws from `new Notification()` — callers (the Pomodoro
    // completion loop) rely on notify() swallowing this.
    class ThrowingNotification {
      static permission = 'granted';
      constructor() {
        throw new TypeError('Illegal constructor');
      }
    }
    vi.stubGlobal('Notification', ThrowingNotification);

    expect(() => notify('hello')).not.toThrow();
  });
});
