import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { PORTFOLIO_PROFILE, PORTFOLIO_PROJECTS } from '../../../services/app-config';

type AboutSection = 'about' | 'projects' | 'skills' | 'contact';

interface AboutNavigationItem {
  id: AboutSection;
  label: string;
  eyebrow: string;
}

interface SkillGroup {
  title: string;
  index: string;
  skills: readonly string[];
}

@Component({
  selector: 'app-about',
  imports: [CommonModule],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class AboutComponent implements OnInit {
  activeScreen: AboutSection = 'about';

  readonly profile = PORTFOLIO_PROFILE;
  readonly projects = PORTFOLIO_PROJECTS;
  readonly sections: readonly AboutNavigationItem[] = [
    { id: 'about', label: '关于我', eyebrow: 'Profile' },
    { id: 'projects', label: '项目', eyebrow: 'Selected work' },
    { id: 'skills', label: '技能', eyebrow: 'Capabilities' },
    { id: 'contact', label: '联系方式', eyebrow: 'Connect' },
  ];

  readonly skillGroups: readonly SkillGroup[] = [
    {
      index: '01',
      title: 'Programming Languages',
      skills: ['Java', 'JavaScript', 'TypeScript', 'Python', 'SQL', 'HTML', 'CSS'],
    },
    {
      index: '02',
      title: 'Frontend Frameworks & Libraries',
      skills: ['Angular', 'React', 'RxJS', 'Tailwind CSS', 'ECharts'],
    },
    {
      index: '03',
      title: 'Backend & APIs',
      skills: ['Spring Boot', 'Node.js', 'GraphQL', 'REST APIs', 'GraphQL-DGS', 'Flask'],
    },
    {
      index: '04',
      title: 'Data & Messaging',
      skills: ['Kafka', 'PostgreSQL', 'MySQL', 'MongoDB'],
    },
    {
      index: '05',
      title: 'Cloud & DevOps',
      skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins'],
    },
    {
      index: '06',
      title: 'Tools & Others',
      skills: ['Git', 'GitHub', 'Jira', 'Confluence', 'Postman', 'VS Code', 'IntelliJ IDEA'],
    },
    {
      index: '07',
      title: 'AI/ML & Research',
      skills: ['Machine Learning', 'Deep Learning', 'Computer Vision', 'Clinical AI', 'NumPy', 'Pandas', 'TensorFlow', 'PyTorch'],
    },
  ];

  changeScreen(screen: AboutSection): void {
    this.activeScreen = screen;
    localStorage.setItem('about-section', screen);
  }

  ngOnInit(): void {
    const lastScreen = localStorage.getItem('about-section');
    const savedSection = this.sections.find(section => section.id === lastScreen);

    if (savedSection) {
      this.activeScreen = savedSection.id;
      return;
    }

    localStorage.setItem('about-section', this.activeScreen);
  }
}
