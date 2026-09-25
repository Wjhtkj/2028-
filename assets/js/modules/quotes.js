/**
 * quotes.js — 每日一言
 * 实现要点：
 *  1. 三级降级：本地日缓存 → 远程多数据源 → 本地句库。任一环节失败都不会白屏；
 *  2. "每日"用 dayKey() 判定，同一天刷新页面不再重复请求（也避免浪费接口额度）；
 *  3. 远程内容一律用 textContent 写入，天然免疫 XSS，不做手写转义；
 *  4. 请求带超时与 AbortController，弱网下 5 秒内必定收敛到兜底方案。
 */

import { store } from '../core/storage.js';
import { setText, flash } from '../core/dom.js';
import { dayKey } from '../core/time.js';
import { pickLocalQuote } from '../data/quotes.js';

/** 带超时的 fetch，返回解析后的对象或 null */
async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

export function createQuotes({ config, textEl, authorEl, badgeEl, badgeTextEl, refreshBtn }) {
  /** 当前展示的一句话，供分享模块取用 */
  let current = { text: '', author: '' };
  let busy = false;

  function setBadge(state, message) {
    if (badgeEl) {
      badgeEl.classList.remove('is-ok', 'is-error', 'is-load');
      if (state) badgeEl.classList.add(state);
    }
    setText(badgeTextEl, message);
  }

  function render(quote, fade = true) {
    current = quote;
    if (textEl) {
      setText(textEl, quote.text);
      if (fade) flash(textEl, 'fade-in', 320);
    }
    setText(authorEl, quote.author ? `—— ${quote.author}` : '');
  }

  /** 命中跑题关键词则弃用该条 */
  function isOffTopic(text) {
    const list = config.blockKeywords || [];
    return list.some((word) => text.includes(word));
  }

  /** 依次尝试各数据源，全部失败（或全部跑题）返回 null */
  async function fetchRemote() {
    for (const ep of config.endpoints) {
      const json = await fetchWithTimeout(ep.url, config.timeoutMs);
      if (!json) continue;
      try {
        const parsed = ep.parse(json);
        const text = typeof parsed?.text === 'string' ? parsed.text.trim() : '';
        if (!text || isOffTopic(text)) continue;
        return {
          text,
          author: typeof parsed.author === 'string' && parsed.author.trim()
            ? parsed.author.trim() : '佚名',
          source: ep.name,
        };
      } catch {
        /* 解析失败则换下一个源 */
      }
    }
    return null;
  }

  function useLocal(reason) {
    const quote = pickLocalQuote(current.text);
    render(quote);
    setBadge('is-error', reason);
  }

  /**
   * @param {{force?:boolean}} options force=true 时忽略日缓存（手动"换一句"）
   */
  async function load({ force = false } = {}) {
    if (busy) return;
    busy = true;
    if (refreshBtn) refreshBtn.classList.add('is-busy');

    try {
      const cached = store.get(config.storageKey, null);
      const today = dayKey();

      if (!force && cached && cached.day === today && cached.text) {
        render({ text: cached.text, author: cached.author }, false);
        setBadge('is-ok', '每日一言 · 今日');
        return;
      }

      setBadge('is-load', '每日一言 · 获取中');
      const remote = await fetchRemote();

      if (remote) {
        store.set(config.storageKey, { day: today, ...remote });
        render(remote);
        setBadge('is-ok', force ? '每日一言 · 已换' : '每日一言 · 已更新');
      } else {
        useLocal('离线 · 本地句库');
      }
    } finally {
      busy = false;
      if (refreshBtn) refreshBtn.classList.remove('is-busy');
    }
  }

  /** 跨天自动刷新：由 main 的心跳调用 */
  function refreshIfNewDay() {
    const cached = store.get(config.storageKey, null);
    if (!cached || cached.day !== dayKey()) load();
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => load({ force: true }));
  }

  return {
    load,
    refreshIfNewDay,
    get snapshot() { return { ...current }; },
  };
}
