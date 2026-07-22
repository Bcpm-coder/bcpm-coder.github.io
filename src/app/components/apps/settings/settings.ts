import { Component } from '@angular/core';
import { WallpaperDefinition } from '../../../models/wallpaper';
import { WallpaperService } from '../../../services/wallpaper';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class SettingsComponent {
  constructor(public readonly wallpaperService: WallpaperService) {}

  selectWallpaper(wallpaper: WallpaperDefinition): void {
    this.wallpaperService.selectWallpaper(wallpaper);
  }
}
