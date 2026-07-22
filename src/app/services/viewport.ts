import { Injectable, OnDestroy, signal } from '@angular/core';

const MOBILE_QUERY = '(max-width: 640px)';

@Injectable({ providedIn: 'root' })
export class ViewportService implements OnDestroy {
  private readonly mediaQuery = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(MOBILE_QUERY)
    : null;
  private readonly onViewportChange = (event: MediaQueryListEvent) => this.isMobile.set(event.matches);

  readonly isMobile = signal(this.mediaQuery?.matches ?? false);

  constructor() {
    this.mediaQuery?.addEventListener('change', this.onViewportChange);
  }

  ngOnDestroy(): void {
    this.mediaQuery?.removeEventListener('change', this.onViewportChange);
  }
}
