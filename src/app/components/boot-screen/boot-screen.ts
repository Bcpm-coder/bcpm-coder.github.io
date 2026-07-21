import { Component, OnDestroy, output, signal } from '@angular/core';

@Component({
  selector: 'app-boot-screen',
  standalone: true,
  templateUrl: './boot-screen.html',
  styleUrl: './boot-screen.css',
})
export class BootScreenComponent implements OnDestroy {
  readonly bootComplete = output<void>();
  readonly statusIndex = signal(0);
  readonly finishing = signal(false);
  readonly statusMessages = [
    '正在加载个人配置',
    '正在初始化桌面',
    '系统已就绪',
  ];

  private readonly timers: number[] = [];
  private completed = false;

  constructor() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      this.statusIndex.set(2);
      this.schedule(() => this.complete(), 120);
      return;
    }

    this.schedule(() => this.statusIndex.set(1), 330);
    this.schedule(() => this.statusIndex.set(2), 680);
    this.schedule(() => this.finishing.set(true), 850);
    this.schedule(() => this.complete(), 1080);
  }

  private schedule(callback: () => void, delay: number): void {
    this.timers.push(window.setTimeout(callback, delay));
  }

  private complete(): void {
    if (this.completed) return;
    this.completed = true;
    this.bootComplete.emit();
  }

  ngOnDestroy(): void {
    this.timers.forEach(timer => window.clearTimeout(timer));
  }
}
