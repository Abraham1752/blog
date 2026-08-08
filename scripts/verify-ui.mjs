/* 临时验证脚本：DOM 断言检查（token 应用、无报错、主题切换、移动端） */
import { chromium } from 'playwright';

const base = 'http://localhost:4322/blog';
let failed = 0;

function check(name, cond, detail = '') {
  if (cond) {
    console.log('PASS', name);
  } else {
    failed++;
    console.log('FAIL', name, detail);
  }
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(base + '/', { waitUntil: 'networkidle' });

// FOUC 脚本：data-theme 应在 HTML 上
const themeAttr = await page.getAttribute('html', 'data-theme');
check('html[data-theme] set by inline script', ['light', 'dark'].includes(themeAttr), `got ${themeAttr}`);

const skinAttr = await page.getAttribute('html', 'data-skin');
check('html[data-skin=swiss] on home', skinAttr === 'swiss', `got ${skinAttr}`);

// swiss 亮色背景
const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
check('body bg = #F5F3EE', bg === 'rgb(245, 243, 238)', `got ${bg}`);

// hero 标题存在且用了 display 字体栈
const heroFont = await page.evaluate(() => getComputedStyle(document.querySelector('.hero__title')).fontFamily);
check('hero uses --font-display', heroFont.includes('Archivo Black'), `got ${heroFont}`);

// 导航 5 项
const navCount = await page.locator('.header__nav a').count();
check('nav has 5 links', navCount === 5, `got ${navCount}`);

// 主题切换按钮存在
const hasToggle = await page.locator('[data-theme-toggle]').count();
check('theme toggle present', hasToggle === 1);

// 项目卡片（Bento）渲染
const cards = await page.locator('.card').count();
check('project cards rendered', cards >= 2, `got ${cards}`);

// 点击切换 → data-theme 变化
const before = await page.getAttribute('html', 'data-theme');
await page.click('[data-theme-toggle]');
await page.waitForTimeout(350);
const after = await page.getAttribute('html', 'data-theme');
check('toggle flips theme', before !== after, `before=${before} after=${after}`);
const bgDark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
check('dark bg applied', bgDark === 'rgb(17, 17, 17)', `got ${bgDark}`);

// 移动端：无横向滚动
const mobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
const mobileErrors = [];
mobile.on('console', (m) => m.type() === 'error' && mobileErrors.push(m.text()));
mobile.on('pageerror', (e) => mobileErrors.push(String(e)));
await mobile.goto(base + '/', { waitUntil: 'networkidle' });
const scrollW = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check('mobile no horizontal scroll', scrollW <= 1, `overflow ${scrollW}px`);
check('mobile no console errors', mobileErrors.length === 0, mobileErrors.join(' | '));

// 项目详情页
await page.goto(base + '/projects/majsoul-assist/', { waitUntil: 'networkidle' });
const detailTitle = await page.locator('.proj-head__title').textContent();
check('project detail title', detailTitle?.trim() === 'Majsoul Assist', `got ${detailTitle}`);
const chips = await page.locator('.proj-head__chips .chip').count();
check('tech chips rendered', chips >= 3, `got ${chips}`);

// 归档页
await page.goto(base + '/blog/', { waitUntil: 'networkidle' });
const archiveTitle = await page.locator('.page-title').textContent();
check('archive page', archiveTitle?.trim() === '归档', `got ${archiveTitle}`);

// RSS 可访问
const rss = await page.goto(base + '/rss.xml');
check('rss.xml 200', rss.status() === 200, `got ${rss.status()}`);

// 全部页面无 console 错误
check('desktop no console errors', errors.length === 0, errors.join(' | '));

await browser.close();
console.log(failed === 0 ? '\nALL PASS' : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
