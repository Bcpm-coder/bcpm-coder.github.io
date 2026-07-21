import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PORTFOLIO_PROFILE, PORTFOLIO_PROJECTS } from '../../../services/app-config';

@Component({
  selector: 'app-about',
  imports: [CommonModule],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class AboutComponent implements OnInit {
  activeScreen = 'about';
  navbarVisible = false;
  readonly profile = PORTFOLIO_PROFILE;
  readonly projects = PORTFOLIO_PROJECTS;

  changeScreen(screen: string) {
    this.activeScreen = screen;
    this.navbarVisible = false;
    localStorage.setItem('about-section', screen);
  }

  toggleNavbar() {
    this.navbarVisible = !this.navbarVisible;
  }

  ngOnInit() {
    const lastScreen = localStorage.getItem('about-section');
    const availableScreens = ['about', 'skills', 'projects', 'contact'];
    if (lastScreen && availableScreens.includes(lastScreen)) {
      this.activeScreen = lastScreen;
    } else {
      localStorage.setItem('about-section', 'about');
    }
  }
}
