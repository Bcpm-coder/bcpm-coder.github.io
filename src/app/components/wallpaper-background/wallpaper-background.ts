import { Component, OnDestroy, effect, signal } from '@angular/core';
import { WallpaperService } from '../../services/wallpaper';

@Component({
  selector: 'app-wallpaper-background',
  templateUrl: './wallpaper-background.html',
  styleUrl: './wallpaper-background.css',
})
export class WallpaperBackgroundComponent implements OnDestroy {
  readonly videoFailed = signal(false);
  private activeVideo?: HTMLVideoElement;
  private retryTimer?: number;
  private retryAttempt = 0;
  private playPending = false;

  private readonly retryPlayback = () => this.tryPlay();
  private readonly retryWhenVisible = () => {
    if (document.visibilityState === 'visible') this.tryPlay();
  };

  constructor(public readonly wallpaperService: WallpaperService) {
    effect(() => {
      this.wallpaperService.effectiveWallpaper();
      this.clearRetry();
      this.activeVideo = undefined;
      this.retryAttempt = 0;
      this.playPending = false;
      this.videoFailed.set(false);
    });

    effect(() => {
      if (this.wallpaperService.prefersReducedMotion()) {
        this.activeVideo?.pause();
      } else {
        this.tryPlay();
      }
    });

    document.addEventListener('click', this.retryPlayback, true);
    document.addEventListener('visibilitychange', this.retryWhenVisible);
    window.addEventListener('pageshow', this.retryPlayback);
  }

  onVideoLoaded(event: Event): void {
    const video = event.currentTarget as HTMLVideoElement;
    this.activeVideo = video;
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    this.videoFailed.set(false);
    if (this.wallpaperService.prefersReducedMotion()) {
      video.pause();
      return;
    }

    this.tryPlay();
  }

  onVideoCanPlay(event: Event): void {
    this.activeVideo = event.currentTarget as HTMLVideoElement;
    this.tryPlay();
  }

  onVideoPlaying(): void {
    this.retryAttempt = 0;
    this.playPending = false;
    this.clearRetry();
  }

  onVideoError(): void {
    this.clearRetry();
    this.videoFailed.set(true);
  }

  ngOnDestroy(): void {
    this.clearRetry();
    document.removeEventListener('click', this.retryPlayback, true);
    document.removeEventListener('visibilitychange', this.retryWhenVisible);
    window.removeEventListener('pageshow', this.retryPlayback);
  }

  private tryPlay(): void {
    const video = this.activeVideo;
    if (
      !video ||
      this.videoFailed() ||
      this.wallpaperService.prefersReducedMotion() ||
      this.playPending
    ) {
      return;
    }

    if (!video.paused) {
      this.onVideoPlaying();
      return;
    }

    video.muted = true;
    video.defaultMuted = true;
    this.playPending = true;
    video.play()
      .then(() => this.onVideoPlaying())
      .catch(() => {
        this.playPending = false;
        this.scheduleRetry();
      });
  }

  private scheduleRetry(): void {
    this.clearRetry();
    const delays = [450, 1200, 2500];
    if (this.retryAttempt >= delays.length) return;

    const delay = delays[this.retryAttempt++];
    this.retryTimer = window.setTimeout(() => {
      this.retryTimer = undefined;
      this.tryPlay();
    }, delay);
  }

  private clearRetry(): void {
    if (this.retryTimer !== undefined) {
      window.clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }
  }
}
