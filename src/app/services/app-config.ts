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
  headline: 'Graduate Student at BUPT',
  introduction: [] as string[],
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
      favourite: false,
      desktop_shortcut: true,
    },
    {
      id: 'projects',
      title: '项目',
      icon: '/assets/images/logos/app-projects.svg',
      disabled: false,
      favourite: false,
      desktop_shortcut: false,
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
      id: '2048',
      title: '2048',
      icon: '/assets/apps/2048/meta/apple-touch-icon.png',
      disabled: false,
      favourite: false,
      desktop_shortcut: true,
      defaultMaximized: true,
    },
    {
      id: 'hextris',
      title: 'Hextris',
      icon: '/assets/apps/hextris/images/icons/apple-touch-180.png',
      disabled: false,
      favourite: false,
      desktop_shortcut: true,
      defaultMaximized: true,
    },
    {
      id: 'card-2048',
      title: 'Card 2048',
      icon: '/assets/images/logos/card-2048.svg',
      disabled: false,
      favourite: false,
      desktop_shortcut: true,
      defaultMaximized: true,
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
      id: 'blog',
      title: '博客',
      icon: '/assets/images/logos/app-blog.svg',
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
    const dockOrder = ['blog', 'chrome', 'settings'];
    return dockOrder
      .map(id => this.apps.find(app => app.id === id))
      .filter((app): app is App => Boolean(app?.favourite));
  }

  getAllApps(): App[] {
    return this.apps;
  }
}
