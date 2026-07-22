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

if (!files.length) {
  throw new Error('No Markdown posts found in blog/.');
}

const entries = [];

for (const fileName of files) {
  const source = await readFile(path.join(postsDirectory, fileName), 'utf8');
  const { data, content } = matter(source);
  const location = `blog/${fileName}`;
  const requiredStrings = ['id', 'title', 'date', 'category'];

  for (const field of requiredStrings) {
    if (typeof data[field] !== 'string' || !data[field].trim()) {
      throw new Error(`${location}: frontmatter field "${field}" must be a non-empty string.`);
    }
  }

  if (!allowedCategories.has(data.category)) {
    throw new Error(`${location}: unsupported category "${data.category}".`);
  }

  if (!Array.isArray(data.tags) || data.tags.some(tag => typeof tag !== 'string' || !tag.trim())) {
    throw new Error(`${location}: frontmatter field "tags" must be an array of strings.`);
  }

  if (!Number.isInteger(data.order) || data.order < 0) {
    throw new Error(`${location}: frontmatter field "order" must be a non-negative integer.`);
  }

  const searchText = markdownToPlainText(content);
  const excerpt = typeof data.excerpt === 'string' && data.excerpt.trim()
    ? data.excerpt.trim()
    : deriveExcerpt(content);

  entries.push({
    id: data.id.trim(),
    title: data.title.trim(),
    excerpt,
    date: data.date.trim(),
    category: data.category,
    tags: data.tags.map(tag => tag.trim()),
    order: data.order,
    file: `/assets/blog/posts/${encodeURIComponent(fileName)}`,
    searchText,
  });
}

const duplicateIds = entries
  .map(entry => entry.id.toLocaleLowerCase())
  .filter((id, index, ids) => ids.indexOf(id) !== index);
const duplicateOrders = entries
  .map(entry => entry.order)
  .filter((order, index, orders) => orders.indexOf(order) !== index);

if (duplicateIds.length) {
  throw new Error(`Duplicate blog post ids: ${[...new Set(duplicateIds)].join(', ')}`);
}

if (duplicateOrders.length) {
  throw new Error(`Duplicate blog post order values: ${[...new Set(duplicateOrders)].join(', ')}`);
}

entries.sort((left, right) => left.order - right.order || left.title.localeCompare(right.title, 'zh-CN'));

const generatedSource = `${JSON.stringify(entries, null, 2)}\n`;
await mkdir(path.dirname(outputFile), { recursive: true });

let previousSource = '';
try {
  previousSource = await readFile(outputFile, 'utf8');
} catch {
  // The file is created on the first run.
}

if (previousSource !== generatedSource) {
  await writeFile(outputFile, generatedSource, 'utf8');
  console.log(`Generated ${entries.length} blog entries.`);
} else {
  console.log(`Blog catalog is current (${entries.length} entries).`);
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
