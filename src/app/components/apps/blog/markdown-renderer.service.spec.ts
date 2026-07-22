import { TestBed } from '@angular/core/testing';
import { MarkdownRendererService } from './markdown-renderer.service';

describe('MarkdownRendererService', () => {
  let service: MarkdownRendererService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MarkdownRendererService] });
    service = TestBed.inject(MarkdownRendererService);
  });

  it('renders headings, highlighted code and KaTeX without exposing frontmatter', async () => {
    const result = await service.render(`---
title: Hidden metadata
---
# Article
## 重复标题
## 重复标题
### $O(n)$

The complexity is $O(n)$.

\`\`\`cpp
int main() { return 0; }
\`\`\`
`);

    expect(result.html).not.toContain('Hidden metadata');
    expect(result.headings.map(heading => heading.id)).toEqual(['重复标题', '重复标题-2', 'o-n']);
    expect(result.headings.at(-1)?.text).toBe('O(n)');
    expect(result.html).toContain('code-frame');
    expect(result.html).toContain('hljs-keyword');
    expect(result.html).toContain('class="katex"');
    expect(result.html).toContain('data-code-copy="0"');
  });

  it('sanitizes unsafe HTML and secures external links', async () => {
    const result = await service.render(`
## Links

<img src="x" onerror="alert(1)">

[External](https://example.com)
`);

    expect(result.html).not.toContain('onerror');
    expect(result.html).toContain('target="_blank"');
    expect(result.html).toContain('rel="noopener noreferrer"');
  });
});
