import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioSettingsService } from '../../../services/audio-settings';

type PlaybackMode = 'sequence' | 'list' | 'single' | 'shuffle';

interface LyricLine {
  time: number;
  text: string;
}

interface MusicTrack {
  title: string;
  artist: string;
  album: string;
  src: string;
  color: string;
  label: string;
  lyrics: LyricLine[];
}

interface PlaybackModeOption {
  id: PlaybackMode;
  icon: string;
  label: string;
}

const EMPTY_TRACK: MusicTrack = {
  title: '正在载入曲库',
  artist: 'EVEROOT RADIO',
  album: 'Local Library',
  src: '',
  color: '#ef8f5a',
  label: 'LOADING',
  lyrics: [{ time: 0, text: '正在读取本地音乐清单…' }],
};

@Component({
  selector: 'app-music',
  imports: [CommonModule],
  templateUrl: './music.html',
  styleUrl: './music.css',
})
export class MusicComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly audioSettings = inject(AudioSettingsService);
  private lastAudibleVolume = 0.75;

  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;

  readonly playbackModes: PlaybackModeOption[] = [
    { id: 'sequence', icon: '→', label: '顺序播放' },
    { id: 'list', icon: '↻', label: '列表循环' },
    { id: 'single', icon: '1', label: '单曲循环' },
    { id: 'shuffle', icon: '⌁', label: '随机播放' },
  ];
  readonly waveformBars = [38, 64, 46, 82, 54, 72, 42, 88, 58, 76, 48, 68, 36, 80, 52, 70, 44, 84, 56, 66];

  readonly tracks = signal<MusicTrack[]>([]);
  readonly currentIndex = signal(0);
  readonly currentTrack = computed(() => this.tracks()[this.currentIndex()] ?? EMPTY_TRACK);
  readonly isPlaying = signal(false);
  readonly isBuffering = signal(false);
  readonly currentTime = signal(0);
  readonly duration = signal(0);
  readonly volume = this.audioSettings.volume;
  readonly playbackMode = signal<PlaybackMode>(this.loadPlaybackMode());
  readonly errorMessage = signal('');
  readonly libraryLoading = signal(true);
  readonly query = signal('');
  readonly showLyrics = signal(true);
  readonly queuePage = signal(0);
  readonly queuePageSize = 5;

  readonly progressPercent = computed(() => {
    const duration = this.duration();
    return duration > 0 ? Math.min(100, (this.currentTime() / duration) * 100) : 0;
  });
  readonly volumePercent = computed(() => Math.round(this.volume() * 100));
  readonly filteredTracks = computed(() => {
    const keyword = this.query().trim().toLowerCase();
    return this.tracks()
      .map((track, index) => ({ track, index }))
      .filter(({ track }) => !keyword || [track.title, track.artist, track.album].some(value => value.toLowerCase().includes(keyword)));
  });
  readonly queuePageCount = computed(() => Math.max(1, Math.ceil(this.filteredTracks().length / this.queuePageSize)));
  readonly visibleTracks = computed(() => {
    const start = this.queuePage() * this.queuePageSize;
    return this.filteredTracks().slice(start, start + this.queuePageSize);
  });
  readonly activeLyricIndex = computed(() => {
    const lyrics = this.currentTrack().lyrics;
    let index = 0;
    for (let i = 0; i < lyrics.length; i += 1) {
      if (this.currentTime() >= lyrics[i].time) index = i;
    }
    return index;
  });

  async ngOnInit() {
    try {
      const response = await fetch('/assets/audio/tracks.json');
      if (!response.ok) throw new Error('Unable to load the music library.');
      const tracks = await response.json() as MusicTrack[];
      this.tracks.set(tracks);
      this.currentIndex.set(this.loadCurrentTrack(tracks.length));
    } catch {
      this.errorMessage.set('本地曲库加载失败，请检查 tracks.json。');
    } finally {
      this.libraryLoading.set(false);
    }
  }

  ngAfterViewInit() {
    this.audioSettings.applyTo(this.audioPlayer.nativeElement);
    if (this.volume() > 0) this.lastAudibleVolume = this.volume();
  }

  ngOnDestroy() {
    const audio = this.audioPlayer?.nativeElement;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
  }

  togglePlayback() {
    const audio = this.audioPlayer.nativeElement;
    audio.paused ? this.play() : audio.pause();
  }

  selectTrack(index: number) {
    if (index === this.currentIndex()) {
      this.togglePlayback();
      return;
    }
    this.switchAndPlay(index);
  }

  previous() {
    const trackCount = this.tracks().length;
    if (!trackCount) return;
    const index = this.playbackMode() === 'shuffle'
      ? this.randomTrackIndex()
      : (this.currentIndex() - 1 + trackCount) % trackCount;
    this.switchAndPlay(index);
  }

  next() {
    const trackCount = this.tracks().length;
    if (!trackCount) return;
    const index = this.playbackMode() === 'shuffle'
      ? this.randomTrackIndex()
      : (this.currentIndex() + 1) % trackCount;
    this.switchAndPlay(index);
  }

  handleEnded() {
    if (this.playbackMode() === 'single') {
      this.audioPlayer.nativeElement.currentTime = 0;
      this.play();
      return;
    }
    if (this.playbackMode() === 'sequence' && this.currentIndex() === this.tracks().length - 1) {
      this.isPlaying.set(false);
      return;
    }
    this.next();
  }

  setPlaybackMode(mode: PlaybackMode) {
    this.playbackMode.set(mode);
    localStorage.setItem('music-playback-mode', mode);
  }

  seek(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    this.audioPlayer.nativeElement.currentTime = value;
    this.currentTime.set(value);
  }

  changeVolume(event: Event) {
    const volume = Number((event.target as HTMLInputElement).value);
    if (volume > 0) this.lastAudibleVolume = volume;
    this.audioSettings.setVolume(volume);
  }

  toggleMute() {
    if (this.volume() > 0) {
      this.lastAudibleVolume = this.volume();
      this.audioSettings.setVolume(0);
    } else {
      this.audioSettings.setVolume(this.lastAudibleVolume || 0.75);
    }
  }

  toggleLyrics() {
    this.showLyrics.update(value => !value);
  }

  onSearch(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
    this.queuePage.set(0);
  }

  changeQueuePage(direction: -1 | 1) {
    const nextPage = Math.min(this.queuePageCount() - 1, Math.max(0, this.queuePage() + direction));
    this.queuePage.set(nextPage);
  }

  updateTime() {
    this.currentTime.set(this.audioPlayer.nativeElement.currentTime || 0);
  }

  updateDuration() {
    const value = this.audioPlayer.nativeElement.duration;
    this.duration.set(Number.isFinite(value) ? value : 0);
    this.isBuffering.set(false);
  }

  markPlaying() {
    this.isPlaying.set(true);
    this.isBuffering.set(false);
  }

  handleAudioError() {
    this.isBuffering.set(false);
    this.isPlaying.set(false);
    this.errorMessage.set('无法播放，请检查本地音频文件。');
  }

  formatTime(seconds: number) {
    if (!Number.isFinite(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainder}`;
  }

  private switchAndPlay(index: number) {
    if (!this.tracks()[index]) return;
    this.currentIndex.set(index);
    localStorage.setItem('music-current-track', index.toString());
    this.currentTime.set(0);
    this.duration.set(0);
    this.errorMessage.set('');
    this.isBuffering.set(true);
    setTimeout(() => {
      if (this.currentIndex() !== index) return;
      this.audioPlayer.nativeElement.load();
      this.play();
    });
  }

  private randomTrackIndex() {
    const trackCount = this.tracks().length;
    if (trackCount < 2) return 0;
    let nextIndex = this.currentIndex();
    while (nextIndex === this.currentIndex()) {
      nextIndex = Math.floor(Math.random() * trackCount);
    }
    return nextIndex;
  }

  private loadPlaybackMode(): PlaybackMode {
    const savedMode = localStorage.getItem('music-playback-mode');
    return savedMode === 'sequence' || savedMode === 'single' || savedMode === 'shuffle' ? savedMode : 'list';
  }

  private loadCurrentTrack(trackCount: number): number {
    const savedIndex = Number(localStorage.getItem('music-current-track'));
    return Number.isInteger(savedIndex) && savedIndex >= 0 && savedIndex < trackCount ? savedIndex : 0;
  }

  private play() {
    this.errorMessage.set('');
    this.isBuffering.set(true);
    this.audioPlayer.nativeElement.play().catch(() => {
      this.isBuffering.set(false);
      this.isPlaying.set(false);
      this.errorMessage.set('无法播放，请检查本地音频文件。');
    });
  }
}
