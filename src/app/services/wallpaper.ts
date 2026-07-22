import { Injectable, OnDestroy, computed, inject, signal } from '@angular/core';
import {
  GENERATED_DEFAULT_WALLPAPER_ID,
  GENERATED_STATIC_FALLBACK_WALLPAPER_ID,
  GENERATED_WALLPAPERS,
} from '../generated/wallpaper-catalog';
import { WallpaperDefinition } from '../models/wallpaper';
import { ViewportService } from './viewport';

@Injectable({ providedIn: 'root' })
export class WallpaperService implements OnDestroy {
  private readonly viewport = inject(ViewportService);
  private readonly reducedMotionQuery = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  readonly wallpapers = GENERATED_WALLPAPERS;
  readonly isDesktop = computed(() => !this.viewport.isMobile());
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
    return selected.kind === 'video' && !this.isDesktop()
      ? this.staticFallbackWallpaper
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
    if (wallpaper.kind === 'video' && !this.isDesktop()) return false;

    this.selectedId.set(wallpaper.id);
    localStorage.setItem('bg-image', wallpaper.id);
    return true;
  }

  isSelectable(wallpaper: WallpaperDefinition): boolean {
    return wallpaper.kind !== 'video' || this.isDesktop();
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
