import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import APlayer from 'aplayer';
import { MUSIC_PLAYLIST } from '../../services/music-config';

@Component({
  selector: 'app-music-player',
  templateUrl: './music-player.html',
  styleUrl: './music-player.css',
})
export class MusicPlayerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() paused = false;
  @ViewChild('playerHost', { static: true }) private playerHost!: ElementRef<HTMLElement>;

  private player?: APlayer;

  ngAfterViewInit() {
    this.player = new APlayer({
      container: this.playerHost.nativeElement,
      audio: MUSIC_PLAYLIST,
      autoplay: false,
      theme: '#e95420',
      loop: 'all',
      order: 'list',
      preload: 'metadata',
      volume: 0.65,
      mutex: true,
      listFolded: true,
      listMaxHeight: '220px',
      storageName: 'bcpm-aplayer-setting',
    });

    this.configureControls();
    this.syncPlayback();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['paused'] && this.player) {
      this.syncPlayback();
    }
  }

  ngOnDestroy() {
    this.player?.destroy();
  }

  private syncPlayback() {
    if (!this.player) return;

    if (this.paused) {
      this.player.pause();
      return;
    }

    const playResult = this.player.play();
    if (playResult instanceof Promise) {
      playResult.catch(() => {
        // Browsers can reject autoplay. Native APlayer controls remain available.
      });
    }
  }

  private configureControls() {
    const controls = [
      { selector: '.aplayer-icon-back', label: '上一首' },
      { selector: '.aplayer-icon-forward', label: '下一首' },
      { selector: '.aplayer-icon-volume-down', label: '音量调节' },
      { selector: '.aplayer-icon-loop', label: '播放模式' },
      { selector: '.aplayer-icon-menu', label: '展开或收起歌单' },
    ];

    controls.forEach(({ selector, label }) => {
      const control = this.playerHost.nativeElement.querySelector<HTMLElement>(selector);
      if (!control) return;

      control.setAttribute('title', label);
      control.setAttribute('aria-label', label);
      if (control.tagName !== 'BUTTON') {
        control.setAttribute('role', 'button');
        control.setAttribute('tabindex', '0');
        control.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            control.click();
          }
        });
      }
    });
  }
}
