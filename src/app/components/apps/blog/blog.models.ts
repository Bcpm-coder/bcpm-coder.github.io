export type BlogCategory = 'Coding' | '学习' | '生活' | '碎碎念';
export type CategoryFilter = '全部' | BlogCategory;
export type BlogOverlay = 'library' | 'outline' | null;

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: BlogCategory;
  tags: string[];
  order: number;
  file: string;
  searchText: string;
}

export interface BlogHeading {
  id: string;
  text: string;
  level: number;
}

export interface RenderedMarkdown {
  html: string;
  headings: BlogHeading[];
}

export const BLOG_CATEGORIES: readonly CategoryFilter[] = [
  '全部',
  'Coding',
  '学习',
  '生活',
  '碎碎念',
];

export function isBlogCategory(value: unknown): value is BlogCategory {
  return value === 'Coding' || value === '学习' || value === '生活' || value === '碎碎念';
}

export function isCategoryFilter(value: unknown): value is CategoryFilter {
  return value === '全部' || isBlogCategory(value);
}
