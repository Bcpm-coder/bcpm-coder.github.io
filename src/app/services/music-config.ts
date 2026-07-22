export interface MusicTrack {
  name: string;
  artist: string;
  url: string;
  cover: string;
  lrc?: string;
}

const DEFAULT_MUSIC_COVER = '/assets/images/logos/avatar.jpg';

/**
 * APlayer playlist. Replace or append entries here when your own audio files are ready.
 * Local files should be placed under src/assets/music and referenced as /assets/music/....
 */
export const MUSIC_PLAYLIST: MusicTrack[] = [
  {
    name: '心做し',
    artist: '双笙（陈元汐）',
    url: '/assets/music/kokoronashi.mp3',
    cover: DEFAULT_MUSIC_COVER,
  },
  {
    name: '恋愛サーキュレーション',
    artist: '花澤香菜',
    url: '/assets/music/renai-circulation.mp3',
    cover: DEFAULT_MUSIC_COVER,
  },
  {
    name: '世界が終るまでは…',
    artist: 'WANDS',
    url: '/assets/music/sekai-ga-owaru-made-wa.mp3',
    cover: DEFAULT_MUSIC_COVER,
  },
  {
    name: '君が好きだと叫びたい',
    artist: 'BAAD',
    url: '/assets/music/kimi-ga-suki-da-to-sakebitai.mp3',
    cover: DEFAULT_MUSIC_COVER,
  },
  {
    name: '夢灯籠',
    artist: 'RADWIMPS',
    url: '/assets/music/yume-tourou.mp3',
    cover: DEFAULT_MUSIC_COVER,
  },
  {
    name: 'China-A',
    artist: '徐梦圆',
    url: '/assets/music/china-a.mp3',
    cover: DEFAULT_MUSIC_COVER,
  },
  {
    name: 'China-P',
    artist: '徐梦圆',
    url: '/assets/music/china-p.mp3',
    cover: DEFAULT_MUSIC_COVER,
  },
  {
    name: 'China-2',
    artist: 'Sand',
    url: '/assets/music/china-2.mp3',
    cover: DEFAULT_MUSIC_COVER,
  },
  {
    name: 'China-X',
    artist: '徐梦圆',
    url: '/assets/music/china-x.mp3',
    cover: DEFAULT_MUSIC_COVER,
  },
  {
    name: '烟袋斜街',
    artist: '接个吻，开一枪',
    url: '/assets/music/yandai-xiejie.mp3',
    cover: DEFAULT_MUSIC_COVER,
  },
  {
    name: '鸡你太美',
    artist: '香精煎鱼（荔枝味）',
    url: '/assets/music/ji-ni-tai-mei.mp3',
    cover: DEFAULT_MUSIC_COVER,
  },
  {
    name: '坤坤专属 BGM · 幻昼 DJ',
    artist: '谢晗沫',
    url: '/assets/music/ikun-war-song.mp3',
    cover: DEFAULT_MUSIC_COVER,
  },
];
