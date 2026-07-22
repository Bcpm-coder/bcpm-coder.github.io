import { Component, effect, signal } from '@angular/core';
import { WallpaperService } from '../../services/wallpaper';

@Component({
  selector: 'app-wallpaper-background',
  templateUrl: './wallpaper-background.html',
  styleUrl: './wallpaper-background.css',
})
export class WallpaperBackgroundComponent {
  readonly videoFailed = signal(false);

  constructor(public readonly wallpaperService: WallpaperService) {
    effect(() => {
      this.wallpaperService.effectiveWallpaper();
      this.videoFailed.set(false);
    });
  }

  onVideoLoaded(event: Event): void {
    const video = event.currentTarget as HTMLVideoElement;
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    this.videoFailed.set(false);
    if (this.wallpaperService.prefersReducedMotion()) {
      video.pause();
      return;
    }

    video.play().catch(() => this.videoFailed.set(true));
  }

  onVideoError(): void {
    this.videoFailed.set(true);
  }
}
