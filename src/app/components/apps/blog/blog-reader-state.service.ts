import { Injectable } from '@angular/core';
import { BlogPost, CategoryFilter, isCategoryFilter } from './blog.models';

interface StoredBlogReaderState {
  version: 2;
  activePostId: string | null;
  category: CategoryFilter;
  scrollRatios: Record<string, number>;
}

const STORAGE_KEY = 'bcpm-blog-reader';
const EMPTY_STATE: StoredBlogReaderState = {
  version: 2,
  activePostId: null,
  category: '全部',
  scrollRatios: {},
};

@Injectable()
export class BlogReaderStateService {
  private state = this.readState();

  restore(posts: readonly BlogPost[]): StoredBlogReaderState {
    const ids = new Set(posts.map(post => post.id));
    const scrollRatios = Object.fromEntries(
      Object.entries(this.state.scrollRatios)
        .filter(([id, ratio]) => ids.has(id) && Number.isFinite(ratio))
        .slice(-30)
        .map(([id, ratio]) => [id, clampRatio(ratio)]),
    );

    this.state = {
      version: 2,
      activePostId: this.state.activePostId && ids.has(this.state.activePostId)
        ? this.state.activePostId
        : null,
      category: isCategoryFilter(this.state.category) ? this.state.category : '全部',
      scrollRatios,
    };
    this.persist();
    return structuredClone(this.state);
  }

  setActivePost(id: string): void {
    this.state.activePostId = id;
    this.persist();
  }

  setCategory(category: CategoryFilter): void {
    this.state.category = category;
    this.persist();
  }

  getScrollRatio(id: string): number {
    return clampRatio(this.state.scrollRatios[id] ?? 0);
  }

  setScrollRatio(id: string, ratio: number): void {
    this.state.scrollRatios[id] = clampRatio(ratio);
    this.persist();
  }

  private readState(): StoredBlogReaderState {
    if (typeof localStorage === 'undefined') return structuredClone(EMPTY_STATE);

    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<StoredBlogReaderState> | null;
      if (!stored || stored.version !== 2) return structuredClone(EMPTY_STATE);
      return {
        version: 2,
        activePostId: typeof stored.activePostId === 'string' ? stored.activePostId : null,
        category: isCategoryFilter(stored.category) ? stored.category : '全部',
        scrollRatios: stored.scrollRatios && typeof stored.scrollRatios === 'object'
          ? stored.scrollRatios
          : {},
      };
    } catch {
      return structuredClone(EMPTY_STATE);
    }
  }

  private persist(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }
}

function clampRatio(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}
