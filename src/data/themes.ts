/**
 * themes.ts · 亮暗主题切换逻辑
 * 只负责 data-theme（light/dark）；data-skin 由各布局静态指定。
 * head 首位内联脚本负责首帧防闪烁，本模块只处理交互后的切换与状态同步。
 */

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme-preference';

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function getPreferredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* Safari 隐私模式等场景下 localStorage 不可用，忽略 */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme, persist = true): void {
  document.documentElement.dataset.theme = theme;
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* 忽略持久化失败 */
    }
  }
}

export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  syncToggleButton(next);
  return next;
}

function syncToggleButton(theme: Theme): void {
  const btn = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (!btn) return;
  btn.setAttribute('aria-pressed', String(theme === 'dark'));
  btn.setAttribute('aria-label', theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式');
}

/** 页面就绪后按当前 data-theme 同步按钮状态（防闪烁脚本已在 head 首位执行） */
export function initThemeToggle(): void {
  syncToggleButton(currentTheme());
}
