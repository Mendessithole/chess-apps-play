// Programmatic chess sound effects using Web Audio API — fully offline
const AudioCtx = typeof window !== "undefined" ? (window.AudioContext || (window as any).webkitAudioContext) : null;
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx && AudioCtx) {
    ctx = new AudioCtx();
  }
  return ctx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.15) {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

function playNoise(duration: number, gain = 0.08) {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume();
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize);
  }
  const source = c.createBufferSource();
  source.buffer = buffer;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.setValueAtTime(800, c.currentTime);
  source.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  source.start();
}

export type SoundType = "move" | "capture" | "check" | "castle" | "promotion" | "gameOver" | "select" | "illegal";

export function playChessSound(type: SoundType) {
  switch (type) {
    case "move":
      // Soft wood knock
      playNoise(0.08, 0.12);
      playTone(300, 0.06, "triangle", 0.08);
      break;

    case "capture":
      // Heavier thud + crunch
      playNoise(0.12, 0.2);
      playTone(180, 0.1, "sawtooth", 0.1);
      playTone(120, 0.15, "triangle", 0.06);
      break;

    case "check":
      // Sharp alert tone
      playTone(880, 0.08, "square", 0.1);
      setTimeout(() => playTone(1100, 0.12, "square", 0.08), 80);
      break;

    case "castle":
      // Double knock
      playNoise(0.06, 0.1);
      setTimeout(() => {
        playNoise(0.06, 0.1);
        playTone(400, 0.06, "triangle", 0.06);
      }, 120);
      break;

    case "promotion":
      // Rising triumphant chord
      playTone(523, 0.3, "sine", 0.08);
      setTimeout(() => playTone(659, 0.25, "sine", 0.08), 80);
      setTimeout(() => playTone(784, 0.3, "sine", 0.1), 160);
      break;

    case "gameOver":
      // Dramatic ending
      playTone(440, 0.4, "sine", 0.1);
      setTimeout(() => playTone(350, 0.4, "sine", 0.1), 200);
      setTimeout(() => playTone(262, 0.6, "sine", 0.12), 400);
      break;

    case "select":
      // Light click
      playTone(600, 0.03, "sine", 0.06);
      break;

    case "illegal":
      // Error buzz
      playTone(150, 0.15, "sawtooth", 0.06);
      break;
  }
}
