import { Injectable } from '@angular/core';
import DOMPurify from 'dompurify';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import markedKatex from 'marked-katex-extension';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import cpp from 'highlight.js/lib/languages/cpp';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import plaintext from 'highlight.js/lib/languages/plaintext';
import python from 'highlight.js/lib/languages/python';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import { BlogHeading, RenderedMarkdown } from './blog.models';

const LANGUAGE_LABELS: Record<string, string> = {
  bash: 'Shell',
  shell: 'Shell',
  sh: 'Shell',
  cpp: 'C++',
  c: 'C / C++',
  java: 'Java',
  javascript: 'JavaScript',
  js: 'JavaScript',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  python: 'Python',
  py: 'Python',
  json: 'JSON',
  html: 'HTML',
  xml: 'XML',
  markdown: 'Markdown',
  md: 'Markdown',
  text: 'Text',
  plaintext: 'Text',
};

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('java', java);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('plaintext', plaintext);
hljs.registerLanguage('python', python);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerAliases(['sh', 'shell'], { languageName: 'bash' });
hljs.registerAliases(['c', 'c++'], { languageName: 'cpp' });
hljs.registerAliases(['js'], { languageName: 'javascript' });
hljs.registerAliases(['ts'], { languageName: 'typescript' });
hljs.registerAliases(['py'], { languageName: 'python' });
hljs.registerAliases(['html'], { languageName: 'xml' });

@Injectable()
export class MarkdownRendererService {
  private readonly parser = new Marked(
    markedHighlight({
      emptyLangClass: 'hljs language-plaintext',
      langPrefix: 'hljs language-',
      highlight(code, language) {
        const normalized = language.toLowerCase();
        const selected = hljs.getLanguage(normalized) ? normalized : 'plaintext';
        return hljs.highlight(code, { language: selected, ignoreIllegals: true }).value;
      },
    }),
    markedKatex({
      throwOnError: false,
      strict: 'ignore',
      nonStandard: true,
    }),
  );

  async render(markdown: string): Promise<RenderedMarkdown> {
    const parsed = await this.parser.parse(stripFrontmatter(markdown), { gfm: true, breaks: false });
    const safeHtml = this.sanitize(parsed);
    const document = new DOMParser().parseFromString(`<main id="markdown-root">${safeHtml}</main>`, 'text/html');
    const root = document.querySelector<HTMLElement>('#markdown-root');

    if (!root) return { html: '', headings: [] };

    const headings = this.enhanceHeadings(root);
    this.enhanceCodeBlocks(root);
    this.enhanceLinks(root);

    return {
      html: this.sanitize(root.innerHTML),
      headings,
    };
  }

  private enhanceHeadings(root: HTMLElement): BlogHeading[] {
    const headings: BlogHeading[] = [];
    const usedIds = new Map<string, number>();

    root.querySelectorAll<HTMLHeadingElement>('h2, h3, h4').forEach((heading, index) => {
      const headingText = extractHeadingText(heading);
      const baseId = slugify(headingText) || `section-${index + 1}`;
      const occurrence = usedIds.get(baseId) ?? 0;
      usedIds.set(baseId, occurrence + 1);
      const id = occurrence ? `${baseId}-${occurrence + 1}` : baseId;
      heading.id = id;

      const anchor = document.createElement('a');
      anchor.className = 'heading-anchor';
      anchor.href = `#${id}`;
      anchor.setAttribute('aria-label', `定位到${headingText || '本节'}`);
      anchor.textContent = '#';
      heading.append(anchor);

      headings.push({
        id,
        text: headingText || id,
        level: Number(heading.tagName.slice(1)),
      });
    });

    return headings;
  }

  private enhanceCodeBlocks(root: HTMLElement): void {
    root.querySelectorAll<HTMLPreElement>('pre').forEach((pre, index) => {
      const code = pre.querySelector<HTMLElement>('code');
      if (!code) return;

      const languageClass = [...code.classList].find(className => className.startsWith('language-'));
      const language = languageClass?.slice('language-'.length).toLowerCase() || 'plaintext';
      const frame = document.createElement('section');
      frame.className = 'code-frame';

      const toolbar = document.createElement('div');
      toolbar.className = 'code-toolbar';
      const label = document.createElement('span');
      label.textContent = LANGUAGE_LABELS[language] ?? language.toUpperCase();
      const copy = document.createElement('button');
      copy.type = 'button';
      copy.dataset['codeCopy'] = String(index);
      copy.setAttribute('aria-label', `复制${label.textContent}代码`);
      copy.textContent = '复制';
      toolbar.append(label, copy);

      pre.replaceWith(frame);
      frame.append(toolbar, pre);
    });
  }

  private enhanceLinks(root: HTMLElement): void {
    root.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(anchor => {
      const href = anchor.getAttribute('href') ?? '';
      if (!href || href.startsWith('#')) return;

      try {
        const target = new URL(href, document.baseURI);
        if (target.origin !== location.origin) {
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';
        }
      } catch {
        // Invalid links remain visible but do not receive external-link behavior.
      }
    });
  }

  private sanitize(html: string): string {
    return DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true, mathMl: true },
      ADD_ATTR: ['target'],
    });
  }
}

function slugify(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

function stripFrontmatter(markdown: string): string {
  return markdown.replace(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n/, '');
}

function extractHeadingText(heading: HTMLHeadingElement): string {
  const clone = heading.cloneNode(true) as HTMLHeadingElement;
  clone.querySelectorAll<HTMLElement>('.katex').forEach(formula => {
    const source = formula.querySelector('annotation')?.textContent?.trim()
      || formula.querySelector('.katex-html')?.textContent?.trim()
      || formula.getAttribute('aria-label')
      || formula.textContent?.trim()
      || '';
    formula.replaceWith(source);
  });
  clone.querySelectorAll('.heading-anchor').forEach(anchor => anchor.remove());
  return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
}
