// Pudding time capsules — a message sealed until a chosen moment, carried
// entirely inside a share link (no server).
//
// Sealing = deflate compression (when the browser has CompressionStream) +
// AES-GCM encryption, with the unlock timestamp bound into the cipher's
// additional authenticated data. The random key travels inside the link, so
// the seal is "polite": it defeats casual decoding and link tampering — in
// particular, editing the date in a link to open it early breaks decryption —
// but it is not safebox cryptography, and the README says so.
//
// Sealed format: `v1.<flags>.<openAt base36>.<iv>.<key>.<ciphertext>`
// (binary parts base64url; flags bit 0 = payload was compressed).

const VERSION = 'v1';
export const MAX_MESSAGE_CHARS = 500;
const SHELF_KEY = 'pompompurinCapsules';

function toB64url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromB64url(s) {
  const bin = atob(s.replaceAll('-', '+').replaceAll('_', '/'));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Checked per call (not at module load) so environments without the Streams
// API — and tests that stub it away — just take the uncompressed path.
const compressionAvailable = () =>
  typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';

// Built on raw ReadableStream (not Blob/Response) — it ships together with
// CompressionStream everywhere, including the Node/jsdom test environment.
async function pipeThrough(bytes, transform) {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  }).pipeThrough(transform);

  const reader = stream.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

// Seal a message so it can only be read from `openAt` (epoch ms) onward.
// Returns the sealed string used both in share links and on the local shelf.
export async function sealCapsule({ message, from = '', openAt }) {
  const payload = new TextEncoder().encode(
    JSON.stringify({ m: String(message).slice(0, MAX_MESSAGE_CHARS), f: String(from) })
  );
  const compressed = compressionAvailable();
  const body = compressed
    ? await pipeThrough(payload, new CompressionStream('deflate-raw'))
    : payload;

  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 128 }, true, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const additionalData = new TextEncoder().encode(String(openAt));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData }, key, body)
  );
  const rawKey = new Uint8Array(await crypto.subtle.exportKey('raw', key));

  return [
    VERSION,
    compressed ? '1' : '0',
    openAt.toString(36),
    toB64url(iv),
    toB64url(rawKey),
    toB64url(ciphertext),
  ].join('.');
}

// Open a sealed capsule. Never throws:
//   { locked: true, openAt }        — too early (the only readable fact)
//   { message, from, openAt }       — unsealed
//   { invalid: true }               — malformed, corrupted, or tampered
export async function openCapsule(blob, now = Date.now()) {
  try {
    const [version, flags, openAt36, ivS, keyS, ctS] = String(blob).split('.');
    if (version !== VERSION || !openAt36 || !ivS || !keyS || !ctS) return { invalid: true };
    const openAt = parseInt(openAt36, 36);
    if (!Number.isFinite(openAt) || openAt <= 0) return { invalid: true };
    if (now < openAt) return { locked: true, openAt };

    const key = await crypto.subtle.importKey('raw', fromB64url(keyS), 'AES-GCM', false, ['decrypt']);
    const additionalData = new TextEncoder().encode(String(openAt));
    const body = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: fromB64url(ivS), additionalData },
        key,
        fromB64url(ctS)
      )
    );
    const wasCompressed = flags === '1';
    if (wasCompressed && !compressionAvailable()) return { invalid: true };
    const payload = wasCompressed
      ? await pipeThrough(body, new DecompressionStream('deflate-raw'))
      : body;

    const { m, f } = JSON.parse(new TextDecoder().decode(payload));
    if (typeof m !== 'string') return { invalid: true };
    return { message: m, from: typeof f === 'string' ? f : '', openAt };
  } catch {
    // Wrong key, tampered date (AAD mismatch), bad base64, bad JSON — all the
    // same to the caller: this pudding is scrambled.
    return { invalid: true };
  }
}

// --- local shelf (persisted capsules), defensive like every storage read ---

export function loadShelf() {
  try {
    const saved = JSON.parse(localStorage.getItem(SHELF_KEY));
    if (Array.isArray(saved)) {
      return saved.filter(
        (c) => typeof c?.blob === 'string' && typeof c?.openAt === 'number' && c.openAt > 0
      );
    }
  } catch {
    // Corrupted storage — start with an empty shelf.
  }
  return [];
}

export function saveShelf(capsules) {
  try {
    localStorage.setItem(SHELF_KEY, JSON.stringify(capsules));
    return true;
  } catch {
    return false;
  }
}

// Unicode code-point safe string slicing to prevent breaking surrogate pair emojis
export function safeSlice(str, max) {
  if (typeof str !== 'string') return '';
  return Array.from(str).slice(0, max).join('');
}

