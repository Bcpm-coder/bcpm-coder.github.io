import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PORTFOLIO_PROJECTS } from '../../../services/app-config';

@Component({
  selector: 'app-projects',
  imports: [CommonModule],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class ProjectsComponent {
  readonly projects = PORTFOLIO_PROJECTS;
}
