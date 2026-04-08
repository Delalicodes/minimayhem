// Synthesized sound effects using Web Audio API — fully offline, no external files
let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq, duration, type = 'sine', volume = 0.3, decay = true) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    if (decay) {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    }
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) { /* ignore audio errors */ }
}

function playNoise(duration, volume = 0.2) {
  try {
    const ctx = getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch (e) { /* ignore */ }
}

export function playPass() {
  // Quick whoosh
  playTone(600, 0.1, 'sine', 0.2);
  setTimeout(() => playTone(800, 0.08, 'sine', 0.15), 30);
}

export function playTick() {
  playTone(1200, 0.05, 'square', 0.1);
}

export function playExplosion() {
  playNoise(0.6, 0.5);
  playTone(80, 0.5, 'sawtooth', 0.4);
  setTimeout(() => playTone(50, 0.4, 'sawtooth', 0.3), 100);
}

export function playPowerUp() {
  playTone(523, 0.1, 'sine', 0.2);
  setTimeout(() => playTone(659, 0.1, 'sine', 0.2), 80);
  setTimeout(() => playTone(784, 0.15, 'sine', 0.2), 160);
}

export function playRoundStart() {
  playTone(440, 0.15, 'square', 0.15);
  setTimeout(() => playTone(440, 0.15, 'square', 0.15), 200);
  setTimeout(() => playTone(660, 0.25, 'square', 0.2), 400);
}

export function playVictory() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.2), i * 150);
  });
}

export function playCountdownBeep() {
  playTone(880, 0.1, 'sine', 0.15);
}

// Initialize audio context on first user interaction
export function initAudio() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  } catch (e) { /* ignore */ }
}
