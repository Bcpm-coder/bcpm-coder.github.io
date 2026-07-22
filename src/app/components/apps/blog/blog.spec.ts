import { TestBed } from '@angular/core/testing';
import { BlogComponent } from './blog';

const POST_LIST = [
  {
    id: 'first', title: 'First post', excerpt: 'Alpha', date: '2026-01-02', category: '学习',
    tags: ['Angular'], order: 1, file: '/assets/blog/posts/first.md', searchText: 'alpha body',
  },
  {
    id: 'second', title: 'Second post', excerpt: 'Beta', date: '2026-01-01', category: 'Coding',
    tags: ['C++'], order: 2, file: '/assets/blog/posts/second.md', searchText: 'weighted union find',
  },
];

describe('BlogComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async input => {
      const url = String(input);
      if (url.includes('posts.json')) {
        return new Response(JSON.stringify(POST_LIST), { status: 200 });
      }
      return new Response('# Test article\n\n## Section\n\nBody', { status: 200 });
    });

    await TestBed.configureTestingModule({ imports: [BlogComponent] }).compileComponents();
  });

  afterEach(() => vi.restoreAllMocks());

  it('loads the generated catalog and renders the first article', async () => {
    const fixture = TestBed.createComponent(BlogComponent);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.posts().length).toBe(2));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.posts().map(post => post.id)).toEqual(['first', 'second']);
    expect(fixture.componentInstance.activePost()?.id).toBe('first');
    expect(fixture.nativeElement.querySelector('.markdown-body')?.textContent).toContain('Test article');
  });

  it('searches generated full-text content and combines it with categories', async () => {
    const fixture = TestBed.createComponent(BlogComponent);
    fixture.detectChanges();
    await vi.waitFor(() => expect(fixture.componentInstance.posts().length).toBe(2));

    fixture.componentInstance.onSearch({ target: { value: 'union find' } } as unknown as Event);
    expect(fixture.componentInstance.filteredPosts().map(post => post.id)).toEqual(['second']);

    await fixture.componentInstance.selectCategory('学习');
    expect(fixture.componentInstance.filteredPosts()).toEqual([]);
  });
});
