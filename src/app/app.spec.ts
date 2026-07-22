import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { AppConfigService } from './services/app-config';
import { WindowManagerService } from './services/window-manager';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the minimal lock-screen profile and entry control', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('bcpm');
    expect(compiled.querySelector<HTMLButtonElement>('button[aria-label="进入桌面"]')).toBeTruthy();
  });

  it('should expose only the active application set', () => {
    const config = TestBed.inject(AppConfigService);
    const appIds = config.getApps().map(app => app.id);

    expect(appIds).not.toContain('chrome');
    expect(appIds).not.toContain('projects');
    expect(config.getFavouriteApps().map(app => app.id)).toEqual(['blog', 'settings']);
  });

  it('should focus the next window after closing the active window', () => {
    const config = TestBed.inject(AppConfigService);
    const windows = TestBed.inject(WindowManagerService);
    const about = config.getAppById('about');
    const settings = config.getAppById('settings');

    expect(about).toBeTruthy();
    expect(settings).toBeTruthy();
    windows.openWindow(about!);
    windows.openWindow(settings!);
    windows.closeWindow('settings');

    expect(windows.getWindows().get('about')?.isFocused).toBe(true);
    expect(windows.getWindows().get('settings')?.isOpen).toBe(false);
  });
});
