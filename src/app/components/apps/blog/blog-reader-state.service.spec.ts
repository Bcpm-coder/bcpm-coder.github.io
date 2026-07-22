import { TestBed } from '@angular/core/testing';
import { BlogPost } from './blog.models';
import { BlogReaderStateService } from './blog-reader-state.service';

const POSTS: BlogPost[] = [
  {
    id: 'one', title: 'One', excerpt: '', date: '2026-01-01', category: '学习', tags: [],
    file: '/one.md', searchText: 'one',
  },
  {
    id: 'two', title: 'Two', excerpt: '', date: '2026-01-02', category: 'Coding', tags: [],
    file: '/two.md', searchText: 'two',
  },
];

describe('BlogReaderStateService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [BlogReaderStateService] });
  });

  it('persists the active article, category and clamped scroll ratio', () => {
    const service = TestBed.inject(BlogReaderStateService);
    service.restore(POSTS);
    service.setActivePost('two');
    service.setCategory('Coding');
    service.setScrollRatio('two', 1.5);

    const stored = JSON.parse(localStorage.getItem('bcpm-blog-reader') ?? '{}');
    expect(stored.activePostId).toBe('two');
    expect(stored.category).toBe('Coding');
    expect(stored.scrollRatios.two).toBe(1);
  });

  it('drops article state that no longer exists', () => {
    localStorage.setItem('bcpm-blog-reader', JSON.stringify({
      version: 2,
      activePostId: 'missing',
      category: '学习',
      scrollRatios: { missing: .5, one: .25 },
    }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [BlogReaderStateService] });

    const restored = TestBed.inject(BlogReaderStateService).restore(POSTS);
    expect(restored.activePostId).toBeNull();
    expect(restored.scrollRatios).toEqual({ one: .25 });
  });
});
