import { Injectable, signal } from '@angular/core';
import { App } from './app-config';

export interface WindowState {
  id: string;
  app: App;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

@Injectable({
  providedIn: 'root'
})
export class WindowManagerService {
  private windows = signal<Map<string, WindowState>>(new Map());
  private nextZIndex = signal(1000);

  getWindows() {
    return this.windows();
  }

  openWindow(app: App) {
    const windows = new Map(this.windows());
    const existingWindow = windows.get(app.id);

    if (existingWindow && existingWindow.isMinimized) {
      // Restore minimized window
      existingWindow.isMinimized = false;
      existingWindow.isFocused = true;
      existingWindow.zIndex = this.nextZIndex();
      this.nextZIndex.update(v => v + 1);
      windows.set(app.id, existingWindow);
      this.windows.set(windows);
      return;
    }

    if (existingWindow && existingWindow.isOpen) {
      // Focus existing window
      this.focusWindow(app.id);
      return;
    }

    // Create new window - center it on screen with slight offset for multiple windows
    const openWindows = Array.from(windows.values()).filter(w => w.isOpen && !w.isMinimized);
    const windowCount = openWindows.length;
    
    const windowWidthPercent = 60;
    const windowHeightPercent = 70;
    
    // Calculate centered position
    const centerX = (100 - windowWidthPercent) / 2;
    const centerY = (100 - windowHeightPercent) / 2;
    
    // Add offset for multiple windows (cascade effect)
    const offsetPercent = 3; // 3% offset per window
    const finalX = Math.max(5, Math.min(centerX + (windowCount * offsetPercent), 100 - windowWidthPercent - 5));
    const finalY = Math.max(5, Math.min(centerY + (windowCount * offsetPercent), 100 - windowHeightPercent - 5));
    
    const opensMaximized = app.defaultMaximized === true;

    windows.forEach(window => {
      window.isFocused = false;
    });

    const newWindow: WindowState = {
      id: app.id,
      app,
      isOpen: true,
      isMinimized: false,
      isMaximized: opensMaximized,
      isFocused: true,
      x: finalX,
      y: finalY,
      width: windowWidthPercent,
      height: windowHeightPercent,
      zIndex: this.nextZIndex()
    };

    this.nextZIndex.update(v => v + 1);
    windows.set(app.id, newWindow);
    this.windows.set(windows);
  }

  closeWindow(id: string) {
    const windows = new Map(this.windows());
    const window = windows.get(id);
    if (window) {
      window.isOpen = false;
      window.isFocused = false;
      windows.set(id, window);
      this.focusTopWindow(windows);
      this.windows.set(windows);
    }
  }

  minimizeWindow(id: string) {
    const windows = new Map(this.windows());
    const window = windows.get(id);
    if (window) {
      window.isMinimized = true;
      window.isFocused = false;
      windows.set(id, window);
      this.focusTopWindow(windows);
      this.windows.set(windows);
    }
  }

  maximizeWindow(id: string) {
    const windows = new Map(this.windows());
    const window = windows.get(id);
    if (window) {
      window.isMaximized = !window.isMaximized;
      windows.set(id, window);
      this.windows.set(windows);
    }
  }

  focusWindow(id: string) {
    const windows = new Map(this.windows());
    windows.forEach((window, key) => {
      window.isFocused = window.isOpen && !window.isMinimized && key === id;
      if (key === id) {
        window.zIndex = this.nextZIndex();
        this.nextZIndex.update(v => v + 1);
      }
    });
    this.windows.set(windows);
  }

  updateWindowPosition(id: string, x: number, y: number) {
    const windows = new Map(this.windows());
    const window = windows.get(id);
    if (window && !window.isMaximized) {
      window.x = x;
      window.y = y;
      windows.set(id, window);
      this.windows.set(windows);
    }
  }

  updateWindowSize(id: string, width: number, height: number) {
    const windows = new Map(this.windows());
    const window = windows.get(id);
    if (window && !window.isMaximized) {
      window.width = width;
      window.height = height;
      windows.set(id, window);
      this.windows.set(windows);
    }
  }

  private focusTopWindow(windows: Map<string, WindowState>): void {
    const nextWindow = Array.from(windows.values())
      .filter(window => window.isOpen && !window.isMinimized)
      .sort((a, b) => b.zIndex - a.zIndex)[0];

    if (!nextWindow) return;

    nextWindow.isFocused = true;
    nextWindow.zIndex = this.nextZIndex();
    this.nextZIndex.update(value => value + 1);
    windows.set(nextWindow.id, nextWindow);
  }
}
