import { Injectable, signal } from '@angular/core';

const DEFAULT_VOLUME = 0.75;

@Injectable({
  providedIn: 'root',
})
export class AudioSettingsService {
  private readonly volumeSignal = signal(this.loadVolume());
  readonly volume = this.volumeSignal.asReadonly();

  setVolume(level: number) {
    if (!Number.isFinite(level)) {
      return;
    }
    const normalizedLevel = Math.min(1, Math.max(0, level));
    this.volumeSignal.set(normalizedLevel);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sound-level', Math.round(normalizedLevel * 100).toString());
    }

    if (typeof document !== 'undefined') {
      document.querySelectorAll<HTMLMediaElement>('audio, video').forEach(media => {
        media.volume = normalizedLevel;
      });
    }
  }

  applyTo(media: HTMLMediaElement) {
    media.volume = this.volumeSignal();
  }

  private loadVolume() {
    if (typeof localStorage === 'undefined') {
      return DEFAULT_VOLUME;
    }

    const savedLevel = Number(localStorage.getItem('sound-level'));
    return Number.isFinite(savedLevel) && savedLevel >= 0 && savedLevel <= 100
      ? savedLevel / 100
      : DEFAULT_VOLUME;
  }
}
