/**
 * preflight.mjs · 上线前检查（构建之后运行）
 * 1. dist 页面/资源完整性
 * 2. 帖子 CJK 字符集 ⊆ fonts-src/charset.txt（字体子集覆盖）
 * 3. sitemap / rss / robots / favicon / og 存在
 * 用法：npm run build && npm run preflight
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const postsDir = join(root, 'src', 'content', 'posts');
const charsetPath = join(root, 'scripts', 'fonts-src', 'charset.txt');
const failures = [];

const expect = (cond, msg) => {
  if (!cond) failures.push(msg);
  else console.log('PASS', msg);
};

// 1. 基础产物
expect(existsSync(join(dist, 'index.html')), 'dist/index.html');
expect(existsSync(join(dist, 'blog', 'index.html')), 'dist/blog/index.html');
expect(existsSync(join(dist, 'rss.xml')), 'dist/rss.xml');
expect(existsSync(join(dist, 'robots.txt')), 'dist/robots.txt');
expect(existsSync(join(dist, 'favicon.svg')), 'dist/favicon.svg');
expect(existsSync(join(dist, 'og-fallback.png')), 'dist/og-fallback.png');
expect(existsSync(join(dist, 'sitemap-index.xml')), 'dist/sitemap-index.xml');
expect(existsSync(join(dist, '_astro', 'fonts')), '_astro/fonts (webfonts)');

// 2. 页面 HTML 里必须引用字体
const home = existsSync(join(dist, 'index.html'))
  ? readFileSync(join(dist, 'index.html'), 'utf8')
  : '';
expect(home.includes('rel="preload"'), 'home 有字体 preload');

// 3. 字符集覆盖：所有非草稿 md 的 CJK 字符必须被子集字体覆盖
if (existsSync(charsetPath)) {
  const charset = new Set(readFileSync(charsetPath, 'utf8'));
  const CJK_RE = /[\u2E80-\u2EFF\u3000-\u303F\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/g;
  const missing = new Set();
  for (const file of readdirSync(postsDir)) {
    if (!file.endsWith('.md') || file.startsWith('template-')) continue;
    const raw = readFileSync(join(postsDir, file), 'utf8');
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (fm && /draft:\s*true/.test(fm[1])) continue;
    for (const m of raw.matchAll(CJK_RE)) {
      if (!charset.has(m[0])) missing.add(m[0]);
    }
  }
  if (missing.size === 0) {
    console.log('PASS', '帖子字符集 ⊆ 字体子集');
  } else {
    failures.push(
      `缺失字符 ${[...missing].join('')} — 请重跑: node scripts/build-charset.mjs && powershell -NoProfile -ExecutionPolicy Bypass -File scripts/subset-cjk.ps1`,
    );
  }
} else {
  failures.push('缺少 scripts/fonts-src/charset.txt，先运行 node scripts/build-charset.mjs');
}

// 4. 非草稿帖子都生成了页面
const rendered = [];
for (const file of readdirSync(postsDir)) {
  if (!file.endsWith('.md') || file.startsWith('template-')) continue;
  const raw = readFileSync(join(postsDir, file), 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fm && /draft:\s*true/.test(fm[1])) continue;
  const slug = file.replace(/\.md$/, '');
  const page = join(dist, 'blog', slug, 'index.html');
  expect(existsSync(page), `文章页 ${slug}/`);
  if (existsSync(page)) rendered.push(slug);
}

// 5. 文章页 HTML 引用 CSS（样式未丢失）
for (const slug of rendered) {
  const html = readFileSync(join(dist, 'blog', slug, 'index.html'), 'utf8');
  expect(html.includes('<link rel="stylesheet"'), `文章 ${slug} 引用样式`);
}

if (failures.length > 0) {
  console.error('\nFAILED:');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}
console.log('\nALL PREFLIGHT CHECKS PASSED');
