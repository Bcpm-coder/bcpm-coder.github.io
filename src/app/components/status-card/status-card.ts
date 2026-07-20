import { Component, Input, OnInit, Output, EventEmitter, signal, computed, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioSettingsService } from '../../services/audio-settings';

@Component({
  selector: 'app-status-card',
  imports: [CommonModule],
  templateUrl: './status-card.html',
  styleUrl: './status-card.css',
})
export class StatusCardComponent implements OnInit {
  private readonly elementRef = inject(ElementRef);
  private readonly audioSettings = inject(AudioSettingsService);

  @Input() visible = false;
  @Input() lockScreen?: () => void;
  @Input() shutDown?: () => void;
  @Output() close = new EventEmitter<void>();
  
  readonly soundLevel = computed(() => Math.round(this.audioSettings.volume() * 100));
  brightnessLevel = signal(100);

  ngOnInit() {
    const savedBrightness = localStorage.getItem('brightness-level');
    
    if (savedBrightness) {
      this.brightnessLevel.set(parseInt(savedBrightness));
      this.updateBrightness(this.brightnessLevel());
    }
  }

  onSoundChange(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    this.audioSettings.setVolume(value / 100);
  }

  onBrightnessChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.brightnessLevel.set(parseInt(value));
    localStorage.setItem('brightness-level', value);
    this.updateBrightness(parseInt(value));
  }

  updateBrightness(level: number) {
    // Using CSS filter to adjust brightness
    const brightness = (3 / 400 * level + 0.25);
    const monitorScreen = document.getElementById('monitor-screen');
    if (monitorScreen) {
      monitorScreen.style.filter = `brightness(${brightness})`;
    }
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    if (this.visible && !this.elementRef.nativeElement.contains(event.target)) {
      const statusBar = document.getElementById('status-bar');
      if (statusBar && !statusBar.contains(event.target as Node)) {
        this.close.emit();
      }
    }
  }
}
