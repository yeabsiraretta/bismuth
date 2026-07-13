import { log } from '@/utils/log/logger';

const musicLog = log.child('ambient-music');

export type AmbientSound = 'rain' | 'forest' | 'cafe' | 'fireplace' | 'whitenoise' | 'none';

interface OscillatorVoice {
  oscillator: OscillatorNode;
  gain: GainNode;
}

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let voices: OscillatorVoice[] = [];
let currentSound: AmbientSound = 'none';
let _playing = false;
let _volume = 0.3;

function ensureContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = _volume;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function stopVoices(): void {
  for (const v of voices) {
    try {
      v.oscillator.stop();
      v.oscillator.disconnect();
      v.gain.disconnect();
    } catch {
      /* already stopped */
    }
  }
  voices = [];
}

function createNoise(ctx: AudioContext, type: 'white' | 'brown' | 'pink'): AudioBufferSourceNode {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  } else if (type === 'brown') {
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const w = Math.random() * 2 - 1;
      data[i] = (last + 0.02 * w) / 1.02;
      last = data[i];
    }
  } else {
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
      data[i] *= 0.11;
      b6 = w * 0.115926;
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

function buildSoundGraph(ctx: AudioContext, sound: AmbientSound): void {
  if (!masterGain) return;

  if (sound === 'whitenoise') {
    const noise = createNoise(ctx, 'white');
    const gain = ctx.createGain();
    gain.gain.value = 0.4;
    noise.connect(gain);
    gain.connect(masterGain);
    noise.start();
    voices.push({ oscillator: noise as unknown as OscillatorNode, gain });
  } else if (sound === 'rain') {
    const noise = createNoise(ctx, 'brown');
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    const gain = ctx.createGain();
    gain.gain.value = 0.6;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start();
    voices.push({ oscillator: noise as unknown as OscillatorNode, gain });
  } else if (sound === 'forest') {
    const noise = createNoise(ctx, 'pink');
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 0.5;
    const gain = ctx.createGain();
    gain.gain.value = 0.3;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start();
    voices.push({ oscillator: noise as unknown as OscillatorNode, gain });
  } else if (sound === 'cafe') {
    const noise = createNoise(ctx, 'pink');
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    const gain = ctx.createGain();
    gain.gain.value = 0.25;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start();
    voices.push({ oscillator: noise as unknown as OscillatorNode, gain });
  } else if (sound === 'fireplace') {
    const noise = createNoise(ctx, 'brown');
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    const gain = ctx.createGain();
    gain.gain.value = 0.5;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start();
    voices.push({ oscillator: noise as unknown as OscillatorNode, gain });
  }
}

export function playAmbient(sound: AmbientSound): void {
  stopVoices();
  currentSound = sound;
  if (sound === 'none') {
    _playing = false;
    musicLog.debug('Ambient stopped');
    return;
  }
  const ctx = ensureContext();
  buildSoundGraph(ctx, sound);
  _playing = true;
  musicLog.info('Ambient playing', { sound });
}

export function stopAmbient(): void {
  stopVoices();
  currentSound = 'none';
  _playing = false;
  musicLog.debug('Ambient stopped');
}

function setAmbientVolume(vol: number): void {
  _volume = Math.max(0, Math.min(1, vol));
  if (masterGain) masterGain.gain.value = _volume;
}

function getAmbientVolume(): number {
  return _volume;
}

function isAmbientPlaying(): boolean {
  return _playing;
}

export function getCurrentAmbientSound(): AmbientSound {
  return currentSound;
}

export function destroyAmbient(): void {
  stopVoices();
  if (audioCtx) {
    audioCtx.close().catch(() => {});
    audioCtx = null;
    masterGain = null;
  }
  _playing = false;
  currentSound = 'none';
}

export const AMBIENT_SOUNDS: { id: AmbientSound; label: string }[] = [
  { id: 'none', label: 'Off' },
  { id: 'rain', label: 'Rain' },
  { id: 'forest', label: 'Forest' },
  { id: 'cafe', label: 'Cafe' },
  { id: 'fireplace', label: 'Fireplace' },
  { id: 'whitenoise', label: 'White Noise' },
];
