import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(projectRoot, 'src/assets/audio');
const sampleRate = 22050;
const duration = 18;

mkdirSync(outputDir, { recursive: true });

const tracks = [
  {
    file: 'demo-morning.wav',
    bpm: 92,
    melody: [60, 64, 67, 72, 67, 64, 62, 67, 69, 74, 69, 67, 60, 64, 67, 71],
    chord: [48, 55, 60],
  },
  {
    file: 'demo-walk.wav',
    bpm: 108,
    melody: [62, 66, 69, 71, 74, 71, 69, 66, 64, 67, 71, 74, 76, 74, 71, 67],
    chord: [50, 57, 62],
  },
  {
    file: 'demo-starlight.wav',
    bpm: 76,
    melody: [69, 72, 76, 81, 76, 72, 67, 71, 74, 79, 74, 71, 65, 69, 72, 76],
    chord: [45, 52, 57],
  },
];

function midiToFrequency(note) {
  return 440 * 2 ** ((note - 69) / 12);
}

function oscillator(frequency, time, brightness = 0.2) {
  const fundamental = Math.sin(2 * Math.PI * frequency * time);
  const second = Math.sin(2 * Math.PI * frequency * 2 * time) * brightness;
  const third = Math.sin(2 * Math.PI * frequency * 3 * time) * brightness * 0.35;
  return fundamental + second + third;
}

function renderTrack(track) {
  const sampleCount = sampleRate * duration;
  const pcm = new Int16Array(sampleCount);
  const beatLength = 60 / track.bpm;
  const noteLength = beatLength / 2;

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const noteIndex = Math.floor(time / noteLength) % track.melody.length;
    const noteTime = time % noteLength;
    const leadFrequency = midiToFrequency(track.melody[noteIndex]);
    const leadEnvelope = Math.min(noteTime / 0.035, 1) * Math.exp(-noteTime * 3.8);
    const lead = oscillator(leadFrequency, time, 0.16) * leadEnvelope * 0.34;

    const chord = track.chord.reduce((sum, note, chordIndex) => {
      const frequency = midiToFrequency(note + (Math.floor(time / (beatLength * 4)) % 2) * 2);
      return sum + Math.sin(2 * Math.PI * frequency * time + chordIndex * 0.35);
    }, 0) / track.chord.length;
    const padPulse = 0.72 + Math.sin(2 * Math.PI * (1 / (beatLength * 4)) * time) * 0.12;
    const pad = chord * padPulse * 0.2;

    const bassNote = track.chord[Math.floor(time / (beatLength * 2)) % track.chord.length] - 12;
    const bass = Math.sin(2 * Math.PI * midiToFrequency(bassNote) * time) * 0.16;

    const edgeFade = Math.min(1, time / 0.8, (duration - time) / 1.2);
    const sample = Math.max(-1, Math.min(1, (lead + pad + bass) * edgeFade));
    pcm[index] = Math.round(sample * 32767);
  }

  return createWaveFile(pcm);
}

function createWaveFile(pcm) {
  const dataLength = pcm.byteLength;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  for (let index = 0; index < pcm.length; index += 1) {
    buffer.writeInt16LE(pcm[index], 44 + index * 2);
  }

  return buffer;
}

for (const track of tracks) {
  writeFileSync(resolve(outputDir, track.file), renderTrack(track));
}

console.log(`Generated ${tracks.length} demo tracks in ${outputDir}`);
