import { Injectable } from '@angular/core';
import DOMPurify from 'dompurify';
import { SystemTheme } from '../../../services/theme';

@Injectable()
export class MermaidRendererService {
  private readonly sources = new WeakMap<HTMLElement, string>();
  private readonly renderVersions = new WeakMap<HTMLElement, number>();
  private diagramId = 0;

  async renderAll(container: HTMLElement, theme: SystemTheme): Promise<void> {
    const version = (this.renderVersions.get(container) ?? 0) + 1;
    this.renderVersions.set(container, version);

    const frames = [...container.querySelectorAll<HTMLElement>('.mermaid-frame')];
    if (!frames.length) return;

    const { default: mermaid } = await import('mermaid/dist/mermaid.esm.min.mjs');
    if (this.renderVersions.get(container) !== version) return;

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      suppressErrorRendering: true,
      theme: theme === 'dark' ? 'dark' : 'default',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
    });

    for (const frame of frames) {
      if (this.renderVersions.get(container) !== version || !frame.isConnected) return;

      const source = this.sources.get(frame)
        ?? frame.querySelector<HTMLElement>('.mermaid-source code')?.textContent?.trim()
        ?? '';
      if (!source) continue;
      this.sources.set(frame, source);
      this.setPendingState(frame);

      try {
        const id = `blog-mermaid-${++this.diagramId}`;
        const { svg } = await mermaid.render(id, source);
        if (this.renderVersions.get(container) !== version || !frame.isConnected) return;
        this.showDiagram(frame, svg);
      } catch {
        if (this.renderVersions.get(container) !== version || !frame.isConnected) return;
        this.showError(frame, source);
      }
    }
  }

  private setPendingState(frame: HTMLElement): void {
    frame.classList.remove('mermaid-ready', 'mermaid-error');
    frame.classList.add('mermaid-pending');
    const status = frame.querySelector<HTMLElement>('.mermaid-status');
    if (status) status.textContent = '正在绘制…';
  }

  private showDiagram(frame: HTMLElement, svg: string): void {
    const caption = this.createCaption('图表');
    const canvas = document.createElement('div');
    canvas.className = 'mermaid-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', '文章流程图');
    canvas.innerHTML = DOMPurify.sanitize(svg, {
      USE_PROFILES: { html: true, svg: true, svgFilters: true },
    });

    frame.replaceChildren(caption, canvas);
    frame.classList.remove('mermaid-pending', 'mermaid-error');
    frame.classList.add('mermaid-ready');
  }

  private showError(frame: HTMLElement, source: string): void {
    const caption = this.createCaption('语法有误，已显示源码');
    const pre = document.createElement('pre');
    pre.className = 'mermaid-source';
    const code = document.createElement('code');
    code.textContent = source;
    pre.append(code);

    frame.replaceChildren(caption, pre);
    frame.classList.remove('mermaid-pending', 'mermaid-ready');
    frame.classList.add('mermaid-error');
  }

  private createCaption(statusText: string): HTMLElement {
    const caption = document.createElement('figcaption');
    caption.textContent = 'Mermaid 图表';
    const status = document.createElement('span');
    status.className = 'mermaid-status';
    status.textContent = statusText;
    caption.append(status);
    return caption;
  }
}
