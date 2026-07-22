import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  BLOG_CATEGORIES,
  BlogOverlay,
  BlogPost,
  CategoryFilter,
  RenderedMarkdown,
  isBlogCategory,
} from './blog.models';
import { BlogReaderStateService } from './blog-reader-state.service';
import { MarkdownRendererService } from './markdown-renderer.service';

@Component({
  selector: 'app-blog',
  imports: [CommonModule],
  providers: [BlogReaderStateService, MarkdownRendererService],
  templateUrl: './blog.html',
  styleUrl: './blog.css',
})
export class BlogComponent implements OnInit, OnDestroy {
  @ViewChild('articleScroll') private articleScroll?: ElementRef<HTMLElement>;
  @ViewChild('libraryToggle') private libraryToggle?: ElementRef<HTMLButtonElement>;
  @ViewChild('mobileOutlineToggle') private mobileOutlineToggle?: ElementRef<HTMLButtonElement>;
  @ViewChild('desktopOutlineToggle') private desktopOutlineToggle?: ElementRef<HTMLButtonElement>;

  private loadRequestId = 0;
  private scrollSaveTimer?: number;
  private copyResetTimer?: number;
  private restoreAnimationFrame?: number;
  private readonly renderCache = new Map<string, RenderedMarkdown>();

  readonly categories = BLOG_CATEGORIES;
  readonly posts = signal<BlogPost[]>([]);
  readonly activePost = signal<BlogPost | null>(null);
  readonly renderedContent = signal<SafeHtml>('');
  readonly headings = signal<RenderedMarkdown['headings']>([]);
  readonly activeHeadingId = signal('');
  readonly query = signal('');
  readonly activeCategory = signal<CategoryFilter>('全部');
  readonly overlay = signal<BlogOverlay>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly readingProgress = signal(0);
  readonly showBackToTop = signal(false);

  readonly filteredPosts = computed(() => {
    const keyword = normalizeSearch(this.query());
    const category = this.activeCategory();

    return this.posts().filter(post => {
      const matchesCategory = category === '全部' || post.category === category;
      if (!matchesCategory || !keyword) return matchesCategory;

      return normalizeSearch([
        post.title,
        post.excerpt,
        post.category,
        ...post.tags,
        post.searchText,
      ].join(' ')).includes(keyword);
    });
  });

  readonly previousPost = computed(() => this.adjacentPost(-1));
  readonly nextPost = computed(() => this.adjacentPost(1));

  constructor(
    private readonly readerState: BlogReaderStateService,
    private readonly markdownRenderer: MarkdownRendererService,
    private readonly domSanitizer: DomSanitizer,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const response = await fetch('/assets/blog/posts.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error('Unable to load the post list.');

      const rawPosts = await response.json() as Array<Partial<BlogPost>>;
      const catalogPosts = rawPosts
        .filter((post): post is BlogPost => this.isValidPost(post));
      const posts = await this.filterAvailablePosts(catalogPosts);
      this.posts.set(posts);

      if (!posts.length) {
        this.isLoading.set(false);
        return;
      }

      const restored = this.readerState.restore(posts);
      this.activeCategory.set(restored.category);
      const visiblePosts = this.filteredPosts();
      const restoredPost = visiblePosts.find(post => post.id === restored.activePostId);
      await this.selectPost(restoredPost ?? visiblePosts[0] ?? posts[0]);
    } catch {
      this.errorMessage.set('博客文章清单加载失败，请稍后重试。');
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.saveCurrentScroll();
    if (this.scrollSaveTimer !== undefined) window.clearTimeout(this.scrollSaveTimer);
    if (this.copyResetTimer !== undefined) window.clearTimeout(this.copyResetTimer);
    if (this.restoreAnimationFrame !== undefined) cancelAnimationFrame(this.restoreAnimationFrame);
  }

  onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.query.set('');
  }

  async clearFilters(): Promise<void> {
    this.query.set('');
    await this.selectCategory('全部');
  }

  async selectCategory(category: CategoryFilter): Promise<void> {
    this.activeCategory.set(category);
    this.readerState.setCategory(category);
    const visiblePosts = this.filteredPosts();

    if (!visiblePosts.some(post => post.id === this.activePost()?.id)) {
      const nextPost = visiblePosts[0];
      if (nextPost) {
        await this.selectPost(nextPost);
      } else {
        this.saveCurrentScroll();
        this.activePost.set(null);
        this.renderedContent.set('');
        this.headings.set([]);
        this.isLoading.set(false);
      }
    }
  }

  categoryCount(category: CategoryFilter): number {
    if (category === '全部') return this.posts().length;
    return this.posts().filter(post => post.category === category).length;
  }

  toggleOverlay(type: Exclude<BlogOverlay, null>): void {
    this.overlay.update(current => current === type ? null : type);
  }

  closeOverlay(restoreFocus = true): void {
    const closing = this.overlay();
    this.overlay.set(null);
    if (!restoreFocus || !closing) return;

    queueMicrotask(() => {
      if (closing === 'library') {
        this.libraryToggle?.nativeElement.focus();
        return;
      }

      const outlineButtons = [this.mobileOutlineToggle, this.desktopOutlineToggle]
        .map(reference => reference?.nativeElement)
        .filter((button): button is HTMLButtonElement => Boolean(button));
      outlineButtons.find(button => button.offsetParent !== null)?.focus();
    });
  }

  async selectPost(post: BlogPost): Promise<void> {
    if (!post) return;

    this.saveCurrentScroll();
    const requestId = ++this.loadRequestId;
    if (this.restoreAnimationFrame !== undefined) cancelAnimationFrame(this.restoreAnimationFrame);
    this.closeOverlay(false);
    this.activePost.set(post);
    this.readerState.setActivePost(post.id);
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.readingProgress.set(0);
    this.showBackToTop.set(false);

    try {
      let rendered = this.renderCache.get(post.id);
      if (!rendered) {
        const markdown = await this.loadMarkdown(post.file);
        rendered = await this.markdownRenderer.render(markdown);
        this.renderCache.set(post.id, rendered);
      }

      if (requestId !== this.loadRequestId) return;
      this.renderedContent.set(this.domSanitizer.bypassSecurityTrustHtml(rendered.html));
      this.headings.set(rendered.headings);
      this.activeHeadingId.set(rendered.headings[0]?.id ?? '');
    } catch (error) {
      if (requestId !== this.loadRequestId) return;
      if (error instanceof MissingBlogPostError) {
        await this.removeMissingPost(post);
        return;
      }
      this.renderedContent.set('');
      this.headings.set([]);
      this.errorMessage.set('这篇文章暂时无法加载，请检查 Markdown 文件路径。');
    } finally {
      if (requestId === this.loadRequestId) {
        this.isLoading.set(false);
        if (!this.errorMessage()) this.restoreScroll(post.id);
      }
    }
  }

  retryActivePost(): void {
    const post = this.activePost();
    if (!post) return;
    this.renderCache.delete(post.id);
    void this.selectPost(post);
  }

  onArticleScroll(): void {
    const container = this.articleScroll?.nativeElement;
    const post = this.activePost();
    if (!container || !post) return;

    const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
    const ratio = maxScroll ? container.scrollTop / maxScroll : 0;
    this.readingProgress.set(ratio);
    this.showBackToTop.set(ratio > .18);
    this.updateActiveHeading(container);

    if (this.scrollSaveTimer !== undefined) window.clearTimeout(this.scrollSaveTimer);
    this.scrollSaveTimer = window.setTimeout(() => {
      this.readerState.setScrollRatio(post.id, ratio);
    }, 180);
  }

  scrollToHeading(id: string): void {
    const container = this.articleScroll?.nativeElement;
    const target = container ? findElementById(container, id) : undefined;
    if (!container || !target) return;

    const top = target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 18;
    container.scrollTo({ top, behavior: this.prefersReducedMotion() ? 'auto' : 'smooth' });
    this.activeHeadingId.set(id);
    this.closeOverlay(false);
  }

  scrollToTop(): void {
    this.articleScroll?.nativeElement.scrollTo({
      top: 0,
      behavior: this.prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }

  onArticleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const copyButton = target.closest<HTMLButtonElement>('button[data-code-copy]');
    if (copyButton) {
      void this.copyCode(copyButton);
      return;
    }

    const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
    const id = anchor?.getAttribute('href')?.slice(1);
    if (anchor && id) {
      event.preventDefault();
      this.scrollToHeading(decodeURIComponent(id));
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.overlay()) {
      event.preventDefault();
      this.closeOverlay();
      return;
    }

    if (event.key !== 'Tab' || !this.overlay()) return;
    const panelSelector = this.overlay() === 'library' ? '.library' : '.outline-rail';
    const panel = document.querySelector<HTMLElement>(`app-blog ${panelSelector}`);
    const focusable = panel
      ? [...panel.querySelectorAll<HTMLElement>('button:not([disabled]), input, a[href]')]
        .filter(element => element.offsetParent !== null)
      : [];
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable.at(-1)!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private adjacentPost(offset: number): BlogPost | null {
    const posts = this.filteredPosts();
    const index = posts.findIndex(post => post.id === this.activePost()?.id);
    return index < 0 ? null : posts[index + offset] ?? null;
  }

  private async copyCode(button: HTMLButtonElement): Promise<void> {
    const code = button.closest('.code-frame')?.querySelector('code')?.textContent ?? '';
    if (!code) return;

    let copied = false;
    try {
      await navigator.clipboard.writeText(code);
      copied = true;
    } catch {
      copied = this.fallbackCopy(code);
    }

    button.textContent = copied ? '已复制' : '复制失败';
    button.classList.toggle('copy-success', copied);
    if (this.copyResetTimer !== undefined) window.clearTimeout(this.copyResetTimer);
    this.copyResetTimer = window.setTimeout(() => {
      button.textContent = '复制';
      button.classList.remove('copy-success');
    }, 1600);
  }

  private fallbackCopy(value: string): boolean {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  }

  private saveCurrentScroll(): void {
    const post = this.activePost();
    if (!post) return;
    this.readerState.setScrollRatio(post.id, this.readingProgress());
  }

  private restoreScroll(postId: string): void {
    const savedRatio = this.readerState.getScrollRatio(postId);
    let attempts = 0;
    const restore = () => {
      if (this.activePost()?.id !== postId) return;
      const container = this.articleScroll?.nativeElement;
      const contentReady = container?.querySelector('.markdown-body');
      if ((!container || !contentReady || container.scrollHeight <= container.clientHeight) && attempts < 12) {
        attempts++;
        this.restoreAnimationFrame = requestAnimationFrame(restore);
        return;
      }
      if (!container) return;
      const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
      container.scrollTop = maxScroll * savedRatio;
      this.onArticleScroll();
    };

    this.restoreAnimationFrame = requestAnimationFrame(restore);
  }

  private updateActiveHeading(container: HTMLElement): void {
    const headingElements = this.headings()
      .map(heading => findElementById(container, heading.id))
      .filter((heading): heading is HTMLElement => Boolean(heading));
    if (!headingElements.length) return;

    const containerTop = container.getBoundingClientRect().top;
    const active = headingElements.reduce((current, heading) => {
      return heading.getBoundingClientRect().top - containerTop <= 96 ? heading : current;
    }, headingElements[0]);
    this.activeHeadingId.set(active.id);
  }

  private async loadMarkdown(file: string): Promise<string> {
    const url = new URL(file, document.baseURI).toString();
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await fetch(url, { cache: 'no-cache' });
        if (response.status === 404 || response.status === 410) {
          throw new MissingBlogPostError(file);
        }
        if (!response.ok) throw new Error(`Unable to load Markdown: ${response.status}`);
        return await response.text();
      } catch (error) {
        if (error instanceof MissingBlogPostError) throw error;
        lastError = error;
        if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 150));
      }
    }

    throw lastError;
  }

  private async filterAvailablePosts(posts: BlogPost[]): Promise<BlogPost[]> {
    const availability = await Promise.all(posts.map(async post => {
      try {
        const url = new URL(post.file, document.baseURI).toString();
        const response = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
        return response.status !== 404 && response.status !== 410;
      } catch {
        // A temporary network failure should still allow the normal retry state.
        return true;
      }
    }));
    return posts.filter((_post, index) => availability[index]);
  }

  private async removeMissingPost(post: BlogPost): Promise<void> {
    const currentPosts = this.posts();
    const removedIndex = Math.max(0, currentPosts.findIndex(item => item.id === post.id));
    const remaining = currentPosts.filter(item => item.id !== post.id);
    this.posts.set(remaining);
    this.renderCache.delete(post.id);
    this.readerState.restore(remaining);
    this.renderedContent.set('');
    this.headings.set([]);

    let candidates = this.filteredPosts();
    if (!candidates.length && remaining.length) {
      this.activeCategory.set('全部');
      this.readerState.setCategory('全部');
      candidates = remaining;
    }

    const fallback = candidates[Math.min(removedIndex, candidates.length - 1)] ?? candidates[0];
    if (fallback) {
      await this.selectPost(fallback);
      return;
    }

    this.activePost.set(null);
    this.isLoading.set(false);
  }

  private isValidPost(post: Partial<BlogPost>): post is BlogPost {
    return typeof post.id === 'string'
      && typeof post.title === 'string'
      && typeof post.excerpt === 'string'
      && typeof post.date === 'string'
      && isBlogCategory(post.category)
      && Array.isArray(post.tags)
      && post.tags.every(tag => typeof tag === 'string')
      && typeof post.file === 'string'
      && typeof post.searchText === 'string';
  }

  private prefersReducedMotion(): boolean {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}

class MissingBlogPostError extends Error {
  constructor(file: string) {
    super(`Markdown file no longer exists: ${file}`);
  }
}

function normalizeSearch(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

function findElementById(container: HTMLElement, id: string): HTMLElement | undefined {
  return [...container.querySelectorAll<HTMLElement>('[id]')].find(element => element.id === id);
}
