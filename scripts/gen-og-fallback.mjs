/* 一次性脚本：生成 public/og-fallback.png（1200x630 瑞士风占位 OG 图） */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const html = `<!doctype html>
<html>
<head><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: #F5D90A; display: flex; flex-direction: column; justify-content: space-between; padding: 56px 64px; font-family: Arial, sans-serif; }
  .top { display: flex; justify-content: space-between; align-items: center; }
  .logo { font-size: 30px; font-weight: 900; color: #1A1A1A; letter-spacing: 1px; display: flex; align-items: center; gap: 12px; }
  .block { display: inline-block; width: 26px; height: 26px; background: #2B3FEB; }
  .date { font-size: 22px; font-weight: 700; color: #1A1A1A; opacity: 0.75; }
  .title { font-size: 84px; font-weight: 900; color: #1A1A1A; line-height: 1.05; max-width: 900px; }
  .sub { font-size: 24px; color: #1A1A1A; opacity: 0.8; }
  .foot { display: flex; justify-content: space-between; font-size: 20px; color: #1A1A1A; }
  .bar { width: 100%; height: 20px; background: #2B3FEB; }
</style></head>
<body>
  <div class="top">
    <div class="logo">TOYLOG<span class="block"></span></div>
    <div class="date">2026-08</div>
  </div>
  <div>
    <div class="title">AI 小玩具开发日志</div>
    <div class="sub" style="margin-top:18px">开发历程 · 工具 · 经验</div>
  </div>
  <div class="bar"></div>
  <div class="foot"><span>abraham1752.github.io/blog</span><span>记录每一次踩坑与发现</span></div>
</body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: 'public/og-fallback.png', type: 'png' });
await browser.close();
console.log('og-fallback.png written');
