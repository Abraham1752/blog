// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeMermaid from 'rehype-mermaid';
import { unified } from '@astrojs/markdown-remark';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import yaml from 'js-yaml';

// sitemap lastmod 注入：构建时直读 posts frontmatter（updatedDate ?? pubDate），
// 避免 @astrojs/sitemap 默认使用构建时间导致"每次构建全部更新"误判
function buildLastmodMap() {
  const dir = join(process.cwd(), 'src', 'content', 'posts');
  const map = new Map();
  if (!existsSync(dir)) return map;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.md') || file.startsWith('template-')) continue;
    const raw = readFileSync(join(dir, file), 'utf-8');
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!m) continue;
    const data = yaml.load(m[1]);
    if (data?.draft) continue;
    const date = data?.updatedDate ?? data?.pubDate;
    if (date) {
      const slug = file.replace(/\.md$/, '');
      map.set(slug, new Date(date).toISOString());
    }
  }
  return map;
}

const lastmodMap = buildLastmodMap();

// 拉丁展示/正文字体：自托管 fontsource woff2（Fonts API 自动 hash + preload）
// CJK 标题字体（Noto Serif/Sans SC 700 子集）不走 Fonts API——
// 子集仅 88–117KB，但 Fonts API 会在所有页面预载，故改由 fonts.css 手动 @font-face 懒加载。
const fonts = [
  {
    name: 'Archivo Black',
    cssVariable: '--fw-archivo-black',
    provider: fontProviders.local(),
    options: {
      variants: [
        { src: ['./node_modules/@fontsource/archivo-black/files/archivo-black-latin-400-normal.woff2'], weight: 400 },
      ],
    },
  },
  {
    name: 'Space Grotesk',
    cssVariable: '--fw-space-grotesk',
    provider: fontProviders.local(),
    options: {
      variants: [
        { src: ['./node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-400-normal.woff2'], weight: 400 },
        { src: ['./node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-500-normal.woff2'], weight: 500 },
        { src: ['./node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff2'], weight: 700 },
      ],
    },
  },
  {
    name: 'Playfair Display',
    cssVariable: '--fw-playfair-display',
    provider: fontProviders.local(),
    options: {
      variants: [
        { src: ['./node_modules/@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff2'], weight: 700 },
        { src: ['./node_modules/@fontsource/playfair-display/files/playfair-display-latin-900-normal.woff2'], weight: 900 },
      ],
    },
  },
  {
    name: 'Source Serif 4',
    cssVariable: '--fw-source-serif-4',
    provider: fontProviders.local(),
    options: {
      variants: [
        { src: ['./node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-600-normal.woff2'], weight: 600 },
        { src: ['./node_modules/@fontsource/source-serif-4/files/source-serif-4-latin-700-normal.woff2'], weight: 700 },
      ],
    },
  },
  {
    name: 'JetBrains Mono',
    cssVariable: '--fw-jetbrains-mono',
    provider: fontProviders.local(),
    options: {
      variants: [
        { src: ['./node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2'], weight: 400 },
        { src: ['./node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2'], weight: 500 },
      ],
    },
  },
];

// https://astro.build/config
export default defineConfig({
  site: 'https://abraham1752.github.io',
  base: '/blog/',
  trailingSlash: 'always',
  fonts,
  image: { layout: 'constrained' },
  markdown: {
    processor: unified({
      rehypePlugins: [[rehypeMermaid, { strategy: 'img-svg', dark: true }]],
    }),
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
  integrations: [
    sitemap({
      serialize(item) {
        const slug = item.url.replace(/\/+$/, '').split('/').pop();
        const lastmod = lastmodMap.get(slug);
        if (lastmod) {
          item.lastmod = lastmod;
        } else {
          delete item.lastmod;
        }
        return item;
      },
    }),
  ],
});
