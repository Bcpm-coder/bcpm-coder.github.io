import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type SystemTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'bcpm-system-theme';
const LEGACY_BLOG_THEME_KEY = 'blog-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly theme = signal<SystemTheme>(this.readInitialTheme());

  constructor() {
    localStorage.setItem(THEME_STORAGE_KEY, this.theme());
    this.applyTheme(this.theme());
  }

  setTheme(theme: SystemTheme): void {
    if (this.theme() === theme) return;

    this.theme.set(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    this.applyTheme(theme);
  }

  toggleTheme(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private readInitialTheme(): SystemTheme {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;

    const legacyTheme = localStorage.getItem(LEGACY_BLOG_THEME_KEY);
    if (legacyTheme === 'light' || legacyTheme === 'dark') {
      localStorage.setItem(THEME_STORAGE_KEY, legacyTheme);
      localStorage.removeItem(LEGACY_BLOG_THEME_KEY);
      return legacyTheme;
    }

    return 'dark';
  }

  private applyTheme(theme: SystemTheme): void {
    this.document.documentElement.dataset['systemTheme'] = theme;
    this.document.documentElement.style.colorScheme = theme;
  }
}
