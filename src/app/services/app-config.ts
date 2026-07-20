import { Injectable } from '@angular/core';

export interface App {
  id: string;
  title: string;
  icon: string;
  disabled: boolean;
  favourite: boolean;
  desktop_shortcut: boolean;
  defaultMaximized?: boolean;
  isExternalApp?: boolean;
  url?: string;
  component?: any;
}

export interface Education {
  school: string;
  degree: string;
  period: string;
}

export interface PortfolioProject {
  name: string;
  company?: string;
  technologies: string[];
  description: string;
  impact: string[];
}

// Personal details live here so future customization only needs one file.
export const PORTFOLIO_PROFILE = {
  name: '不吃泡面',
  headline: 'M.S. Student in Software Engineering at BUPT',
  introduction: [] as string[],
  education: [
    {
      school: '北京邮电大学（BUPT）',
      degree: 'M.S. Student in Software Engineering',
      period: '在读',
    },
  ] as Education[],
  email: '',
  github: 'github.com/bcpm-coder',
};

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    name: 'Black Horse Review Platform',
    technologies: ['Spring Boot', 'MySQL', 'Redis'],
    description: 'A local lifestyle review application inspired by Dianping, built with Spring Boot, MySQL, and Redis.',
    impact: [
      'Supports user authentication, merchant discovery, coupon flash sales, social interactions, and user-generated reviews.',
      'Uses Redis for caching, distributed locking, session management, and high-concurrency order processing to improve performance and system reliability.',
    ],
  },
  {
    name: 'Sales Data Analysis AI Agent',
    technologies: ['Spring Boot', 'LangChain4j', 'MySQL', 'Redis', 'Qwen-Max', 'SSE'],
    description: 'A sales data analysis AI Agent that enables sales managers to query business data through natural language without requiring additional reports or APIs.',
    impact: [
      'Provides five standardized tools for order queries, performance rankings, trend analysis, chart generation, and anomaly detection.',
      'Supports multi-step tool calling, SSE streaming, conversation memory, role-based data access, caching, and prompt-injection protection.',
      'Explicit capability boundaries improve tool-selection accuracy, while dynamic date injection ensures reliable handling of relative-time queries.',
      'A limited ReAct iteration count prevents repeated tool calls and excessive token consumption, reducing report generation time from several hours to a few minutes.',
    ],
  },
];

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private apps: App[] = [
    {
      id: 'about',
      title: '关于我',
      icon: '/assets/images/logos/avatar.jpg',
      disabled: false,
      favourite: true,
      desktop_shortcut: true,
    },
    {
      id: 'projects',
      title: '项目',
      icon: '/assets/themes/Yaru/system/folder.png',
      disabled: false,
      favourite: false,
      desktop_shortcut: true,
    },
    {
      id: 'skills',
      title: '技能',
      icon: '/assets/themes/Yaru/system/folder.png',
      disabled: false,
      favourite: false,
      desktop_shortcut: true,
    },
    {
      id: 'contact',
      title: '联系方式',
      icon: '/assets/themes/Yaru/apps/gedit.png',
      disabled: false,
      favourite: false,
      desktop_shortcut: true,
    },
    {
      id: 'music',
      title: '音乐',
      icon: '/assets/themes/Yaru/apps/spotify.png',
      disabled: false,
      favourite: true,
      desktop_shortcut: true,
    },
    {
      id: 'terminal',
      title: '终端',
      icon: '/assets/themes/Yaru/apps/bash.png',
      disabled: false,
      favourite: true,
      desktop_shortcut: false,
    },
    {
      id: 'settings',
      title: '设置',
      icon: '/assets/themes/Yaru/apps/gnome-control-center.png',
      disabled: false,
      favourite: true,
      desktop_shortcut: false,
    },
    {
      id: 'chrome',
      title: '浏览器',
      icon: '/assets/themes/Yaru/apps/chrome.png',
      disabled: false,
      favourite: true,
      desktop_shortcut: false,
    },
    {
      id: 'trash',
      title: '回收站',
      icon: '/assets/themes/Yaru/system/user-trash-full.png',
      disabled: false,
      favourite: true,
      desktop_shortcut: false,
    },
    {
      id: 'vscode',
      title: 'Visual Studio Code',
      icon: '/assets/themes/Yaru/apps/vscode.png',
      disabled: false,
      favourite: true,
      desktop_shortcut: false,
    },
    {
      id: 'blog',
      title: '博客',
      icon: '/assets/themes/Yaru/system/user-home.png',
      disabled: false,
      favourite: true,
      desktop_shortcut: true,
      defaultMaximized: true,
    },
  ];

  getApps(): App[] {
    return this.apps;
  }

  getAppById(id: string): App | undefined {
    return this.apps.find(app => app.id === id);
  }

  getDesktopApps(): App[] {
    return this.apps.filter(app => app.desktop_shortcut);
  }

  getFavouriteApps(): App[] {
    return this.apps.filter(app => app.favourite);
  }

  getAllApps(): App[] {
    return this.apps;
  }
}
