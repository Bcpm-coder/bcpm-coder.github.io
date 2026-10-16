import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MermaidRendererService } from './mermaid-renderer.service';

const mermaid = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(),
}));

vi.mock('mermaid/dist/mermaid.esm.min.mjs', () => ({ default: mermaid }));

describe('MermaidRendererService', () => {
  it('uses SVG labels and keeps their text after sanitization in both themes', async () => {
    TestBed.configureTestingModule({ providers: [MermaidRendererService] });
    const service = TestBed.inject(MermaidRendererService);
    const container = document.createElement('div');
    container.innerHTML = '<figure class="mermaid-frame"><pre class="mermaid-source"><code>flowchart LR\nA[提取代码] --&gt; B[理解功能]</code></pre></figure>';
    document.body.append(container);
    mermaid.render.mockResolvedValue({
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><text>提取代码</text><text>理解功能</text><script>alert(1)</script></svg>',
    });
    try {
      for (const theme of ['dark', 'light'] as const) {
        await service.renderAll(container, theme);
        expect(mermaid.initialize).toHaveBeenLastCalledWith(expect.objectContaining({
          htmlLabels: false,
          flowchart: { htmlLabels: false },
          securityLevel: 'strict',
        }));
        expect(container.querySelector('.mermaid-ready svg')?.textContent).toBe('提取代码理解功能');
        expect(container.querySelector('script')).toBeNull();
      }
      expect(mermaid.render).toHaveBeenLastCalledWith(expect.any(String), 'flowchart LR\nA[提取代码] --> B[理解功能]');
    } finally {
      container.remove();
    }
  });
});
