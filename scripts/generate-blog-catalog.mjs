import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const postsDirectory = path.join(projectRoot, 'blog');
const outputFile = path.join(projectRoot, 'src/assets/blog/posts.json');
const allowedCategories = new Set(['Coding', '学习', '生活', '碎碎念']);

const files = (await readdir(postsDirectory, { withFileTypes: true }))
  .filter(entry => entry.isFile() && path.extname(entry.name).toLowerCase() === '.md')
  .map(entry => entry.name)
  .sort((left, right) => left.localeCompare(right, 'zh-CN', { numeric: true }));

if (!files.length) throw new Error('No Markdown posts found in blog/.');

const entries = [];
const automaticMetadata = [];

for (const fileName of files) {
  const source = await readFile(path.join(postsDirectory, fileName), 'utf8');
  const { data, content } = matter(source);
  const location = `blog/${fileName}`;
  const baseName = path.basename(fileName, path.extname(fileName));
  const id = optionalString(data.id) ?? createId(baseName);
  const title = optionalString(data.title) ?? deriveTitle(content, baseName);
  const category = optionalString(data.category) ?? '碎碎念';

  if (!allowedCategories.has(category)) {
    throw new Error(`${location}: unsupported category "${category}".`);
  }
  if (data.tags !== undefined && (!Array.isArray(data.tags) || data.tags.some(tag => typeof tag !== 'string' || !tag.trim()))) {
    throw new Error(`${location}: frontmatter field "tags" must be an array of strings.`);
  }

  const resolvedDate = resolveDate(optionalString(data.date));
  const tags = Array.isArray(data.tags) ? data.tags.map(tag => tag.trim()) : [];
  const searchText = markdownToPlainText(content);
  const excerpt = optionalString(data.excerpt) ?? deriveExcerpt(content);

  if (['id', 'title', 'date', 'category', 'tags'].some(field => data[field] === undefined)) {
    automaticMetadata.push(location);
  }

  entries.push({
    id,
    title,
    excerpt,
    date: resolvedDate.date,
    category,
    tags,
    file: `/assets/blog/posts/${encodeURIComponent(fileName)}`,
    searchText,
    sortTimestamp: resolvedDate.timestamp,
    hasValidDate: resolvedDate.valid,
  });
}

const duplicateIds = entries
  .map(entry => entry.id.toLocaleLowerCase())
  .filter((id, index, ids) => ids.indexOf(id) !== index);

if (duplicateIds.length) {
  throw new Error(`Duplicate blog post ids: ${[...new Set(duplicateIds)].join(', ')}`);
}

entries.sort((left, right) => Number(right.hasValidDate) - Number(left.hasValidDate)
  || right.sortTimestamp - left.sortTimestamp
  || left.title.localeCompare(right.title, 'zh-CN'));
const publicEntries = entries.map(({ sortTimestamp: _sortTimestamp, hasValidDate: _hasValidDate, ...entry }) => entry);
const generatedSource = `${JSON.stringify(publicEntries, null, 2)}\n`;
await mkdir(path.dirname(outputFile), { recursive: true });

let previousSource = '';
try {
  previousSource = await readFile(outputFile, 'utf8');
} catch {
  // The file is created on the first run.
}

if (previousSource !== generatedSource) {
  await writeFile(outputFile, generatedSource, 'utf8');
  console.log(`Generated ${publicEntries.length} blog entries in newest-first date order.`);
} else {
  console.log(`Blog catalog is current (${publicEntries.length} entries, newest first).`);
}

if (automaticMetadata.length) {
  console.log(`Using automatic metadata for: ${automaticMetadata.join(', ')}`);
}

function optionalString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function createId(baseName) {
  const id = baseName
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{Letter}\p{Number}-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return id || 'untitled-post';
}

function deriveTitle(markdown, fallback) {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1];
  return markdownToPlainText(heading ?? fallback) || fallback;
}

function resolveDate(frontmatterDate) {
  if (frontmatterDate && /^\d{4}-\d{2}-\d{2}$/.test(frontmatterDate)) {
    const timestamp = Date.parse(`${frontmatterDate}T00:00:00Z`);
    if (!Number.isNaN(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === frontmatterDate) {
      return { date: frontmatterDate, timestamp, valid: true };
    }
  }
  return { date: frontmatterDate ?? '未注明日期', timestamp: 0, valid: false };
}

function deriveExcerpt(markdown) {
  const paragraph = markdown
    .split(/\n\s*\n/)
    .map(block => block.trim())
    .find(block => block && !/^(#{1,6}\s|```|~~~|>|[-*+]\s|\d+\.\s)/.test(block));

  const plain = markdownToPlainText(paragraph ?? markdown);
  return plain.length > 120 ? `${plain.slice(0, 117).trimEnd()}…` : plain;
}

function markdownToPlainText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, block => block.replace(/^```[^\n]*|```$/g, ' '))
    .replace(/~~~[\s\S]*?~~~/g, block => block.replace(/^~~~[^\n]*|~~~$/g, ' '))
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[`*_~>#|]/g, ' ')
    .replace(/^\s*(?:[-+]\s+|\d+\.\s+)/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}
