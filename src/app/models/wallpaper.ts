export type WallpaperKind = 'image' | 'video';

export interface WallpaperDefinition {
  id: string;
  label: string;
  assetUrl: string;
  kind: WallpaperKind;
  posterUrl?: string;
}
