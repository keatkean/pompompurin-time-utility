import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sealCapsule, openCapsule, loadShelf, saveShelf, safeSlice, MAX_MESSAGE_CHARS } from './capsule';

const HOUR = 3_600_000;

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sealCapsule / openCapsule', () => {
  it('roundtrips a message once the unlock time has passed', async () => {
    const openAt = Date.now() - 1000;
    const blob = await sealCapsule({ message: '加油 future me! 🍮', from: 'kk', openAt });
    expect(await openCapsule(blob)).toEqual({ message: '加油 future me! 🍮', from: 'kk', openAt });
  });

  it('stays locked before the unlock time, revealing only the date', async () => {
    const openAt = Date.now() + HOUR;
    const blob = await sealCapsule({ message: 'sealed tight', openAt });
    expect(await openCapsule(blob)).toEqual({ locked: true, openAt });
  });

  it('rejects a link whose date was tampered with to open early', async () => {
    const openAt = Date.now() + HOUR;
    const blob = await sealCapsule({ message: 'no peeking', openAt });
    // The attack: rewrite the (plaintext) date field to the past. AES-GCM's
    // additional-data binding must make decryption fail, not open early.
    const parts = blob.split('.');
    parts[2] = (Date.now() - HOUR).toString(36);
    expect(await openCapsule(parts.join('.'))).toEqual({ invalid: true });
  });

  it('rejects tampered ciphertext', async () => {
    const blob = await sealCapsule({ message: 'intact', openAt: Date.now() - 1000 });
    const parts = blob.split('.');
    const ct = parts[5];
    parts[5] = (ct[0] === 'A' ? 'B' : 'A') + ct.slice(1);
    expect(await openCapsule(parts.join('.'))).toEqual({ invalid: true });
  });

  it('rejects garbage without throwing', async () => {
    expect(await openCapsule('hello there')).toEqual({ invalid: true });
    expect(await openCapsule('')).toEqual({ invalid: true });
    expect(await openCapsule('v1.9.zzz.!!.!!.!!')).toEqual({ invalid: true });
    expect(await openCapsule(undefined)).toEqual({ invalid: true });
  });

  it('caps the message length', async () => {
    const blob = await sealCapsule({ message: 'x'.repeat(1000), openAt: Date.now() - 1 });
    const { message } = await openCapsule(blob);
    expect(message).toHaveLength(MAX_MESSAGE_CHARS);
  });

  it('still roundtrips where CompressionStream is unavailable (older Safari)', async () => {
    vi.stubGlobal('CompressionStream', undefined);
    vi.stubGlobal('DecompressionStream', undefined);
    const openAt = Date.now() - 1000;
    const blob = await sealCapsule({ message: 'no streams here', openAt });
    expect(blob.split('.')[1]).toBe('0'); // uncompressed flag
    expect(await openCapsule(blob)).toEqual({ message: 'no streams here', from: '', openAt });
  });

  it('produces link-sized output for a maximum-length message', async () => {
    const blob = await sealCapsule({ message: '布丁 pudding! '.repeat(42), openAt: Date.now() + HOUR });
    expect(blob.length).toBeLessThan(2000);
    expect(blob).toMatch(/^v1\.[01]\.[0-9a-z]+\.[\w-]+\.[\w-]+\.[\w-]+$/);
  });
});

describe('capsule shelf storage', () => {
  it('starts empty and survives corrupted storage', () => {
    expect(loadShelf()).toEqual([]);
    localStorage.setItem('pompompurinCapsules', '{not json');
    expect(loadShelf()).toEqual([]);
  });

  it('roundtrips capsules and filters malformed entries', () => {
    const good = { blob: 'v1.x', openAt: 123456, createdAt: 1, opened: false };
    expect(saveShelf([good, { blob: 42, openAt: 'soon' }, null])).toBe(true);
    // Write raw to simulate a hand-edited mixture too.
    localStorage.setItem(
      'pompompurinCapsules',
      JSON.stringify([good, { blob: 42, openAt: 'soon' }, null, { blob: 'v1.y', openAt: -5 }])
    );
    expect(loadShelf()).toEqual([good]);
  });

  it('returns false when storage throwing occurs', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(saveShelf([{ blob: 'v1.test', openAt: 1 }])).toBe(false);
  });
});

describe('safeSlice', () => {
  it('safely slices multi-byte emoji surrogate pairs without corruption', () => {
    const emojiStr = '🍮'.repeat(10);
    expect(safeSlice(emojiStr, 5)).toBe('🍮🍮🍮🍮🍮');
    expect(safeSlice(123, 5)).toBe('');
  });
});

