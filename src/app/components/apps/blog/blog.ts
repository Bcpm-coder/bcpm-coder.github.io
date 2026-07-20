import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

type BlogCategory = 'Coding' | '学习' | '生活' | '碎碎念';
type CategoryFilter = '全部' | BlogCategory;
type BlogTheme = 'light' | 'dark';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: BlogCategory;
  tags: string[];
  file: string;
}

function isBlogCategory(value: unknown): value is BlogCategory {
  return value === 'Coding' || value === '学习' || value === '生活' || value === '碎碎念';
}

@Component({
  selector: 'app-blog',
  imports: [CommonModule],
  templateUrl: './blog.html',
  styleUrl: './blog.css',
})
export class BlogComponent implements OnInit {
  private loadRequestId = 0;

  readonly categories: readonly CategoryFilter[] = ['全部', 'Coding', '学习', '生活', '碎碎念'];
  readonly posts = signal<BlogPost[]>([]);
  readonly activePost = signal<BlogPost | null>(null);
  readonly renderedContent = signal('');
  readonly query = signal('');
  readonly activeCategory = signal<CategoryFilter>('全部');
  readonly theme = signal<BlogTheme>('dark');
  readonly libraryOpen = signal(false);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  readonly filteredPosts = computed(() => {
    const keyword = this.query().trim().toLowerCase();
    const category = this.activeCategory();

    return this.posts().filter(post => {
      const matchesCategory = category === '全部' || post.category === category;
      const matchesKeyword = !keyword || [post.title, post.excerpt, post.category, ...post.tags].some(value =>
        value.toLowerCase().includes(keyword),
      );
      return matchesCategory && matchesKeyword;
    });
  });

  async ngOnInit() {
    const savedTheme = localStorage.getItem('blog-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.theme.set(savedTheme);
    }

    try {
      const response = await fetch('/assets/blog/posts.json');
      if (!response.ok) throw new Error('Unable to load the post list.');

      const rawPosts = await response.json() as Array<Omit<BlogPost, 'category'> & { category?: unknown }>;
      const posts: BlogPost[] = rawPosts.map(post => ({
        ...post,
        category: isBlogCategory(post.category) ? post.category : '碎碎念',
      }));
      this.posts.set(posts);
      if (posts.length) {
        await this.selectPost(posts[0]);
      } else {
        this.isLoading.set(false);
      }
    } catch {
      this.errorMessage.set('博客文章清单加载失败。');
      this.isLoading.set(false);
    }
  }

  onSearch(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
  }

  async selectCategory(category: CategoryFilter) {
    this.activeCategory.set(category);
    const visiblePosts = this.filteredPosts();

    if (!visiblePosts.some(post => post.id === this.activePost()?.id)) {
      const nextPost = visiblePosts[0];
      if (nextPost) {
        await this.selectPost(nextPost);
      } else {
        this.activePost.set(null);
        this.renderedContent.set('');
        this.isLoading.set(false);
      }
    }
  }

  categoryCount(category: CategoryFilter): number {
    if (category === '全部') return this.posts().length;
    return this.posts().filter(post => post.category === category).length;
  }

  setTheme(theme: BlogTheme) {
    this.theme.set(theme);
    localStorage.setItem('blog-theme', theme);
  }

  toggleLibrary() {
    this.libraryOpen.update(open => !open);
  }

  closeLibrary() {
    this.libraryOpen.set(false);
  }

  async selectPost(post: BlogPost) {
    const requestId = ++this.loadRequestId;
    this.libraryOpen.set(false);
    this.activePost.set(post);
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const markdown = await this.loadMarkdown(post.file);
      const html = await marked.parse(markdown, { gfm: true, breaks: false });

      if (requestId !== this.loadRequestId) return;
      this.renderedContent.set(DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
      }));
    } catch {
      if (requestId !== this.loadRequestId) return;
      this.renderedContent.set('');
      this.errorMessage.set('这篇文章暂时无法加载，请检查 Markdown 文件路径。');
    } finally {
      if (requestId === this.loadRequestId) {
        this.isLoading.set(false);
      }
    }
  }

  private async loadMarkdown(file: string): Promise<string> {
    const url = new URL(file, document.baseURI).toString();
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Unable to load Markdown: ${response.status}`);
        }
        return await response.text();
      } catch (error) {
        lastError = error;
        if (attempt === 0) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }
    }

    throw lastError;
  }
}
