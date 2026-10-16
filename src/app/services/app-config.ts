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
}

export interface PortfolioProject {
  name: string;
  url: string;
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
    name: 'EchoMind',
    url: 'https://github.com/Bcpm-coder/EchoMind',
    technologies: ['Python', 'FastAPI', 'Anthropic SDK', 'Redis', 'ChromaDB', 'Docker', 'Prometheus'],
    description: 'A multi-agent customer service system for support and operations, covering the complete conversation flow from intent recognition and knowledge retrieval to agent routing and memory persistence.',
    impact: [
      'Combines LLM inference, vector similarity, and keyword rules to identify intent, urgency, and entities.',
      'Routes requests across General, Technical, Billing, and Escalation agents with collaboration and response synthesis.',
      'Integrates RAG, layered memory, dynamic skills, tool tracing, circuit breaking, online monitoring, and LLM-as-Judge evaluation.',
    ],
  },
  {
    name: 'hmdp · Black Horse Review Platform',
    url: 'https://github.com/Bcpm-coder/hmdp',
    technologies: ['Java', 'Spring Boot', 'MyBatis-Plus', 'MySQL', 'Redis', 'Redisson', 'Caffeine', 'RocketMQ'],
    description: 'A Dianping-inspired local lifestyle review platform with authentication, merchant discovery, social interactions, user-generated reviews, and coupon flash sales.',
    impact: [
      'Uses Redis pre-deduction, an outbox relay, and RocketMQ consumers to process flash-sale orders asynchronously with idempotency and failure compensation.',
      'Introduces a Caffeine and Redis two-level cache with transaction-aware invalidation and cross-instance Pub/Sub notifications.',
      'Implements reusable Redis sliding-window rate limiting for user, IP, and global dimensions through Spring AOP and Lua scripts.',
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
      icon: '/assets/images/logos/app-settings.svg',
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
    const dockOrder = ['blog', 'settings'];
    return dockOrder
      .map(id => this.apps.find(app => app.id === id))
      .filter((app): app is App => Boolean(app?.favourite));
  }

  getAllApps(): App[] {
    return this.apps;
  }
}
