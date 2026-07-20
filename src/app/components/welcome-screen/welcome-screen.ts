import { Component, OnDestroy, computed, output, signal } from '@angular/core';

@Component({
  selector: 'app-welcome-screen',
  standalone: true,
  templateUrl: './welcome-screen.html',
  styleUrl: './welcome-screen.css',
})
export class WelcomeScreenComponent implements OnDestroy {
  readonly enterDesktop = output<void>();
  readonly leaving = signal(false);
  readonly now = signal(new Date());
  readonly time = computed(() =>
    new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(this.now())
  );
  readonly date = computed(() =>
    new Intl.DateTimeFormat('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(this.now())
  );

  private readonly clockTimer = window.setInterval(() => this.now.set(new Date()), 1000);
  private exitTimer?: number;
  private hasEntered = false;

  confirmEntry(): void {
    if (!this.leaving()) {
      this.leaving.set(true);
      this.exitTimer = window.setTimeout(() => this.completeEntry(), 850);
    }
  }

  onExitAnimationEnd(event: AnimationEvent): void {
    if (
      this.leaving() &&
      event.target === event.currentTarget &&
      event.animationName.includes('screen-out')
    ) {
      this.completeEntry();
    }
  }

  private completeEntry(): void {
    if (this.hasEntered) return;

    this.hasEntered = true;
    if (this.exitTimer !== undefined) {
      window.clearTimeout(this.exitTimer);
    }
    this.enterDesktop.emit();
  }

  ngOnDestroy(): void {
    window.clearInterval(this.clockTimer);
    if (this.exitTimer !== undefined) {
      window.clearTimeout(this.exitTimer);
    }
  }
}
