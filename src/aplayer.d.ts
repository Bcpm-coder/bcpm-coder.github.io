declare module 'aplayer' {
  export interface APlayerAudio {
    name: string;
    artist: string;
    url: string;
    cover?: string;
    lrc?: string;
    theme?: string;
    type?: 'auto' | 'hls' | 'normal';
  }

  export interface APlayerOptions {
    container: HTMLElement;
    audio: APlayerAudio[];
    autoplay?: boolean;
    theme?: string;
    loop?: 'all' | 'one' | 'none';
    order?: 'list' | 'random';
    preload?: 'none' | 'metadata' | 'auto';
    volume?: number;
    mutex?: boolean;
    listFolded?: boolean;
    listMaxHeight?: string;
    storageName?: string;
  }

  export default class APlayer {
    constructor(options: APlayerOptions);
    audio: HTMLAudioElement;
    play(): Promise<void> | void;
    pause(): void;
    destroy(): void;
  }
}
