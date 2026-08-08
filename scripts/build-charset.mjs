import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src');
const outFile = join(root, 'scripts/fonts-src/charset.txt');

const CJK_RE = /[\u2E80-\u2EFF\u3000-\u303F\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/g;
const ASCII_SAFE = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ .,:;!?()-—[]{}#%&*+/\\=@_~\'"<>^`|';

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      out.push(...walk(p));
    } else if (/\.(md|astro|ts|mjs|yaml|yml|css|json)$/.test(entry) && !entry.startsWith('.')) {
      out.push(p);
    }
  }
  return out;
}

const chars = new Set(ASCII_SAFE);
for (const file of walk(srcDir)) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(CJK_RE)) chars.add(m[0]);
}

const sorted = [...chars].sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
writeFileSync(outFile, sorted.join(''), 'utf8');
console.log(`charset: ${sorted.length} chars (${relative(root, outFile)})`);
