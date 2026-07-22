import { Component, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { AppConfigService, App } from '../../services/app-config';
import { WindowManagerService } from '../../services/window-manager';
import { DesktopIconComponent } from '../desktop-icon/desktop-icon';
import { SidebarComponent } from '../sidebar/sidebar';
import { WindowComponent } from '../window/window';
import { NavbarComponent } from '../navbar/navbar';
import { AllApplicationsComponent } from '../all-applications/all-applications';
import { WelcomeScreenComponent } from '../welcome-screen/welcome-screen';
import { BootScreenComponent } from '../boot-screen/boot-screen';
import { MusicPlayerComponent } from '../music-player/music-player';

type DesktopPhase = 'locked' | 'booting' | 'ready';
const GAME_APP_IDS = ['2048', 'hextris', 'card-2048'] as const;

@Component({
  selector: 'app-desktop',
  imports: [CommonModule, KeyValuePipe, DesktopIconComponent, SidebarComponent, WindowComponent, NavbarComponent, AllApplicationsComponent, WelcomeScreenComponent, BootScreenComponent, MusicPlayerComponent],
  templateUrl: './desktop.html',
  styleUrl: './desktop.css',
})
export class DesktopComponent implements OnInit, OnDestroy {
  desktopApps = signal<App[]>([]);
  hideSidebar = signal(false);
  backgroundImage = signal('wall-1');
  allAppsView = signal(false);
  desktopPhase = signal<DesktopPhase>('locked');
  welcomeVisible = computed(() => this.desktopPhase() === 'locked');
  booting = computed(() => this.desktopPhase() === 'booting');
  desktopReady = computed(() => this.desktopPhase() === 'ready');
  gameWindowOpen = computed(() => {
    const windows = this.windowManager.getWindows();
    return GAME_APP_IDS.some(id => windows.get(id)?.isOpen === true);
  });
  externalMusicReady = signal(false);
  musicPausedForLock = signal(false);
  externalMusicDragging = signal(false);
  externalMusicSnapping = signal(false);
  externalMusicPosition = signal<{ x: number; y: number } | null>(null);
  private backgroundChangeHandler?: (event: any) => void;
  private musicDragPointerId?: number;
  private musicDragOffset = { x: 0, y: 0 };
  private musicSnapTimer?: number;

  constructor(
    public appConfig: AppConfigService,
    public windowManager: WindowManagerService
  ) {}

  ngOnInit() {
    this.desktopApps.set(this.appConfig.getDesktopApps());
    
    // Load background image from localStorage or use default
    const savedBg = localStorage.getItem('bg-image');
    if (savedBg === 'wall-1' || savedBg === 'wall-2') {
      this.backgroundImage.set(savedBg);
    } else {
      this.backgroundImage.set('wall-1');
      localStorage.setItem('bg-image', 'wall-1');
    }

    // Listen for background changes
    this.backgroundChangeHandler = (event: any) => {
      this.backgroundImage.set(event.detail);
    };
    window.addEventListener('background-changed', this.backgroundChangeHandler);

  }

  ngOnDestroy() {
    if (this.backgroundChangeHandler) {
      window.removeEventListener('background-changed', this.backgroundChangeHandler);
    }
    if (this.musicSnapTimer !== undefined) {
      window.clearTimeout(this.musicSnapTimer);
    }
  }

  openApp(app: App) {
    if (app.isExternalApp && app.url) {
      window.open(app.url, '_blank');
    } else {
      this.windowManager.openWindow(app);
    }
    // Close all applications view when opening an app
    if (this.allAppsView()) {
      this.allAppsView.set(false);
    }
  }

  showAllApps() {
    this.allAppsView.update(view => !view);
  }

  onLockScreen() {
    document.querySelectorAll<HTMLMediaElement>('audio, video').forEach(media => media.pause());
    if (this.musicSnapTimer !== undefined) {
      window.clearTimeout(this.musicSnapTimer);
      this.musicSnapTimer = undefined;
    }
    this.musicPausedForLock.set(true);
    this.externalMusicDragging.set(false);
    this.externalMusicSnapping.set(false);
    this.externalMusicPosition.set(null);
    this.musicDragPointerId = undefined;
    this.allAppsView.set(false);
    this.desktopPhase.set('locked');
  }

  startDesktopMusic() {
    this.externalMusicReady.set(true);
    this.musicPausedForLock.set(false);
  }

  enterDesktop() {
    this.desktopPhase.set('booting');
  }

  finishBoot() {
    this.desktopPhase.set('ready');
  }

  startExternalMusicDrag(event: PointerEvent) {
    if ((event.target as HTMLElement).closest('button')) return;

    const header = event.currentTarget as HTMLElement;
    const widget = header.closest('.external-music-widget') as HTMLElement | null;
    if (!widget) return;

    if (this.musicSnapTimer !== undefined) {
      window.clearTimeout(this.musicSnapTimer);
      this.musicSnapTimer = undefined;
    }

    const rect = widget.getBoundingClientRect();
    this.musicDragPointerId = event.pointerId;
    this.musicDragOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    this.externalMusicPosition.set({ x: rect.left, y: rect.top });
    this.externalMusicSnapping.set(false);
    this.externalMusicDragging.set(true);
    header.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  moveExternalMusic(event: PointerEvent) {
    if (!this.externalMusicDragging() || event.pointerId !== this.musicDragPointerId) return;

    const widget = (event.currentTarget as HTMLElement).closest('.external-music-widget') as HTMLElement | null;
    if (!widget) return;

    const maxX = Math.max(4, window.innerWidth - widget.offsetWidth - 4);
    const maxY = Math.max(32, window.innerHeight - widget.offsetHeight - 4);
    this.externalMusicPosition.set({
      x: Math.min(maxX, Math.max(4, event.clientX - this.musicDragOffset.x)),
      y: Math.min(maxY, Math.max(32, event.clientY - this.musicDragOffset.y)),
    });
  }

  finishExternalMusicDrag(event: PointerEvent) {
    if (!this.externalMusicDragging() || event.pointerId !== this.musicDragPointerId) return;

    const header = event.currentTarget as HTMLElement;
    const widget = header.closest('.external-music-widget') as HTMLElement | null;
    if (header.hasPointerCapture(event.pointerId)) {
      header.releasePointerCapture(event.pointerId);
    }

    this.musicDragPointerId = undefined;
    this.externalMusicDragging.set(false);
    if (!widget) return;

    const left = window.innerWidth <= 640 ? 62 : 74;
    const bottom = window.innerWidth <= 640 ? 12 : 18;
    this.externalMusicSnapping.set(true);
    this.externalMusicPosition.set({
      x: Math.min(left, Math.max(4, window.innerWidth - widget.offsetWidth - 4)),
      y: Math.max(32, window.innerHeight - widget.offsetHeight - bottom),
    });

    this.musicSnapTimer = window.setTimeout(() => {
      this.externalMusicPosition.set(null);
      this.externalMusicSnapping.set(false);
      this.musicSnapTimer = undefined;
    }, 460);
  }

  onShutDown() {
    // TODO: Implement shutdown
    console.log('Shut down');
  }

  getBackgroundUrl() {
    const bgImages: { [key: string]: string } = {
      'wall-1': '/assets/images/wallpapers/wall-1.png',
      'wall-2': '/assets/images/wallpapers/wall-2.jpg',
      'wall-4': '/assets/images/wallpapers/wall-4.webp',
      'wall-5': '/assets/images/wallpapers/wall-5.webp',
      'wall-6': '/assets/images/wallpapers/wall-6.webp',
      'wall-7': '/assets/images/wallpapers/wall-7.webp',
      'wall-8': '/assets/images/wallpapers/wall-8.webp',
    };

    return bgImages[this.backgroundImage()] || bgImages['wall-1'];
  }

  getBackgroundStyle() {
    const bgImage = this.getBackgroundUrl();

    return {
      'background-image': `url('${bgImage}')`,
      'background-size': 'cover',
      'background-position': 'center',
      'background-repeat': 'no-repeat',
      'background-position-x': 'center'
    };
  }
}
