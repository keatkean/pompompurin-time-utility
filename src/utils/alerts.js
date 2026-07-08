// Sound + notification helpers shared by Timer and Pomodoro.
//
// The AudioContext must be created/resumed during a user gesture (browser
// autoplay policy), so call initAudio() from a click handler; the jingle can
// then play later when a countdown completes. Falls back to the bundled wav
// beep when Web Audio is unavailable.

let audioContext = null;

export function initAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  if (!audioContext) audioContext = new Ctx();
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
}

function playJingle(ctx) {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  const t0 = ctx.currentTime;
  notes.forEach((frequency, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = frequency;
    const t = t0 + i * 0.16;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.55);
  });
}

export function playCompletionSound() {
  if (audioContext && audioContext.state === 'running') {
    playJingle(audioContext);
    return;
  }
  const audio = new Audio(`${import.meta.env.BASE_URL}beep-07a.wav`);
  audio.play()?.catch(() => {
    // Autoplay can be blocked; the desktop notification still fires.
  });
}

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function notify(title) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title);
  } catch {
    // Some platforms (notably Android Chrome) forbid page-context Notification
    // construction and throw — notifications there must go through the service
    // worker registration. Callers rely on notify() never throwing.
    try {
      navigator.serviceWorker?.ready.then((reg) => reg.showNotification(title)).catch(() => {});
    } catch {
      // No notification channel available — the sound already played.
    }
  }
}
