import { Injectable, OnDestroy, computed, signal } from '@angular/core';
import {
  GENERATED_DEFAULT_WALLPAPER_ID,
  GENERATED_STATIC_FALLBACK_WALLPAPER_ID,
  GENERATED_WALLPAPERS,
} from '../generated/wallpaper-catalog';
import { WallpaperDefinition } from '../models/wallpaper';

@Injectable({ providedIn: 'root' })
export class WallpaperService implements OnDestroy {
  readonly wallpapers = GENERATED_WALLPAPERS;
  readonly isDesktop = signal(window.matchMedia('(min-width: 641px)').matches);
  readonly prefersReducedMotion = signal(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  private readonly selectedId = signal(this.getInitialWallpaperId());
  private readonly desktopQuery = window.matchMedia('(min-width: 641px)');
  private readonly reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

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
    return selected.kind === 'video' && !this.isDesktop()
      ? this.staticFallbackWallpaper
      : selected;
  });

  private readonly onDesktopChange = (event: MediaQueryListEvent) => {
    this.isDesktop.set(event.matches);
  };

  private readonly onReducedMotionChange = (event: MediaQueryListEvent) => {
    this.prefersReducedMotion.set(event.matches);
  };

  constructor() {
    this.desktopQuery.addEventListener('change', this.onDesktopChange);
    this.reducedMotionQuery.addEventListener('change', this.onReducedMotionChange);

    if (localStorage.getItem('bg-image') !== this.selectedId()) {
      localStorage.setItem('bg-image', this.selectedId());
    }
  }

  selectWallpaper(wallpaper: WallpaperDefinition): boolean {
    if (wallpaper.kind === 'video' && !this.isDesktop()) return false;

    this.selectedId.set(wallpaper.id);
    localStorage.setItem('bg-image', wallpaper.id);
    return true;
  }

  isSelectable(wallpaper: WallpaperDefinition): boolean {
    return wallpaper.kind !== 'video' || this.isDesktop();
  }

  ngOnDestroy(): void {
    this.desktopQuery.removeEventListener('change', this.onDesktopChange);
    this.reducedMotionQuery.removeEventListener('change', this.onReducedMotionChange);
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
