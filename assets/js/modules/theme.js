/**
 * theme.js — 三态主题：跟随系统 / 浅色 / 深色
 * 实现要点：
 *  1. 状态落在 <html data-theme> 上，配色全部由 tokens.css 的 CSS 变量承担，
 *     JS 只负责"翻转开关"，不碰任何具体颜色值；
 *  2. 'system' 时不写 data-theme，交给 prefers-color-scheme 媒体查询；
 *  3. 选择持久化到 localStorage，刷新后保持一致。
 */

import { store } from '../core/storage.js';
import { on } from '../core/dom.js';

const ICONS = {
  system: '#i-auto',
  light:  '#i-sun',
  dark:   '#i-moon',
};

const LABELS = {
  system: '跟随系统',
  light:  '浅色模式',
  dark:   '深色模式',
};

export function createTheme({ storageKey, order }) {
  const root = document.documentElement;
  let current = store.get(storageKey, 'system');
  if (!order.includes(current)) current = 'system';

  function apply() {
    if (current === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', current);

    const iconUse = document.getElementById('themeIcon');
    if (iconUse) iconUse.setAttribute('href', ICONS[current]);

    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.setAttribute('title', `主题：${LABELS[current]}（点击切换）`);
      btn.setAttribute('aria-label', `主题：${LABELS[current]}，点击切换`);
    }
  }

  function next() {
    const i = order.indexOf(current);
    current = order[(i + 1) % order.length];
    store.set(storageKey, current);
    apply();
  }

  const btn = document.getElementById('themeToggle');
  on(btn, 'click', next);

  apply();
  return { get current() { return current; } };
}
