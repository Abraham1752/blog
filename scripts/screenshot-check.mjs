/* 临时视觉验证脚本：截图关键页面（亮/暗 × 桌面/移动） */
import { chromium } from 'playwright';

const base = 'http://localhost:4322/blog';
const shots = [
  { path: '/', theme: 'light', width: 1440, name: 'home-light' },
  { path: '/', theme: 'dark', width: 1440, name: 'home-dark' },
  { path: '/', theme: 'light', width: 375, name: 'home-mobile' },
  { path: '/projects/', theme: 'light', width: 1440, name: 'projects-light' },
  { path: '/projects/majsoul-assist/', theme: 'light', width: 1440, name: 'project-detail' },
  { path: '/blog/', theme: 'light', width: 1440, name: 'archive-light' },
  { path: '/tags/', theme: 'dark', width: 1440, name: 'tags-dark' },
  { path: '/about/', theme: 'light', width: 1440, name: 'about-light' },
];

const browser = await chromium.launch();
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: s.width, height: 900 } });
  await page.goto(base + s.path, { waitUntil: 'networkidle' });
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
  }, s.theme);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `logs/${s.name}.png`, fullPage: true });
  await page.close();
  console.log('shot:', s.name);
}
await browser.close();
