import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import {
  GENERATED_DEFAULT_WALLPAPER_ID,
  GENERATED_STATIC_FALLBACK_WALLPAPER_ID,
  GENERATED_WALLPAPERS,
} from '../generated/wallpaper-catalog';
import { WallpaperDefinition } from '../models/wallpaper';
import { ViewportService } from './viewport';

const MOBILE_DEFAULT_WALLPAPER: WallpaperDefinition = {
  id: 'mobile-default-furina-sea',
  label: '芙宁娜 海面（手机）',
  assetUrl: '/assets/images/wallpapers/mobile/furina-sea-mobile.mp4',
  kind: 'video',
};

@Injectable({ providedIn: 'root' })
export class WallpaperService implements OnDestroy {
  private readonly viewport = inject(ViewportService);
  private readonly reducedMotionQuery = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  readonly wallpapers = GENERATED_WALLPAPERS;
  readonly prefersReducedMotion = signal(this.reducedMotionQuery?.matches ?? false);

  private readonly selectedId = signal(this.getInitialWallpaperId());
  readonly defaultWallpaper =
    this.findWallpaper(GENERATED_DEFAULT_WALLPAPER_ID) ?? this.wallpapers[0];
  readonly staticFallbackWallpaper =
    this.findWallpaper(GENERATED_STATIC_FALLBACK_WALLPAPER_ID) ??
    this.wallpapers.find(wallpaper => wallpaper.kind === 'image') ??
    this.defaultWallpaper;
  readonly selectedWallpaper = computed(
    () => this.findWallpaper(this.selectedId()) ?? this.defaultWallpaper
  );
  readonly effectiveWallpaper = computed(() => {
    const selected = this.selectedWallpaper();
    return this.viewport.isMobile() && selected.id === this.defaultWallpaper.id
      ? MOBILE_DEFAULT_WALLPAPER
      : selected;
  });

  private readonly onReducedMotionChange = (event: MediaQueryListEvent) => {
    this.prefersReducedMotion.set(event.matches);
  };

  constructor() {
    this.reducedMotionQuery?.addEventListener('change', this.onReducedMotionChange);

    if (localStorage.getItem('bg-image') !== this.selectedId()) {
      localStorage.setItem('bg-image', this.selectedId());
    }
  }

  selectWallpaper(wallpaper: WallpaperDefinition): boolean {
    this.selectedId.set(wallpaper.id);
    localStorage.setItem('bg-image', wallpaper.id);
    return true;
  }

  isSelectable(wallpaper: WallpaperDefinition): boolean {
    return this.wallpapers.some(candidate => candidate.id === wallpaper.id);
  }

  ngOnDestroy(): void {
    this.reducedMotionQuery?.removeEventListener('change', this.onReducedMotionChange);
  }

  private getInitialWallpaperId(): string {
    const savedId = localStorage.getItem('bg-image');
    return savedId && this.findWallpaper(savedId)
      ? savedId
      : GENERATED_DEFAULT_WALLPAPER_ID;
  }

  private findWallpaper(id: string): WallpaperDefinition | undefined {
    return this.wallpapers.find(wallpaper => wallpaper.id === id);
  }
}
