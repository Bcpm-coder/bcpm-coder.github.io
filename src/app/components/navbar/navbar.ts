import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClockComponent } from '../clock/clock';
import { StatusComponent } from '../status/status';
import { StatusCardComponent } from '../status-card/status-card';
import { SystemTheme, ThemeService } from '../../services/theme';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, ClockComponent, StatusComponent, StatusCardComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent {
  @Output() lockScreen = new EventEmitter<void>();
  
  statusCardVisible = signal(false);

  constructor(public readonly themeService: ThemeService) {}

  setTheme(theme: SystemTheme): void {
    this.themeService.setTheme(theme);
  }

  onStatusBarClick() {
    this.statusCardVisible.update(v => !v);
  }

  onStatusCardClose() {
    this.statusCardVisible.set(false);
  }

  onLockScreen() {
    this.lockScreen.emit();
    this.statusCardVisible.set(false);
  }

}
