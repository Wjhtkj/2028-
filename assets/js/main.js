/**
 * main.js — 应用入口（编排层）
 * 职责：装配各模块、驱动统一心跳、维护跨模块共享的一点点状态。
 * 刻意保持"薄"：这里不该出现任何具体的计算或样式逻辑。
 */

import { CONFIG } from './config.js';
import { $ } from './core/dom.js';
import { toDate, formatDot, formatCN, weekdayCN, splitDuration } from './core/time.js';
import { createTicker } from './core/ticker.js';
import { createTheme }   from './modules/theme.js';
import { createCountdown } from './modules/countdown.js';
import { createProgress }  from './modules/progress.js';
import { createQuotes }    from './modules/quotes.js';
import { createShare }     from './modules/share.js';

function boot() {
  const start  = toDate(CONFIG.timeline.start);
  const target = toDate(CONFIG.timeline.target);

  /* ---------- 静态文案 ---------- */
  const examName = CONFIG.site.examName;
  $('#examName')    && ($('#examName').textContent = examName);
  $('#examDate')    && ($('#examDate').textContent = formatDot(target));
  $('#examWeekday') && ($('#examWeekday').textContent = weekdayCN(target));
  $('#lastUpdated') && ($('#lastUpdated').textContent = formatCN(new Date()));

  const clockEl = $('#examClock');
  if (clockEl) {
    const t = target;
    clockEl.textContent = ` 开考 ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  }

  /* ---------- 模块装配 ---------- */
  /* 主题：只翻 data-theme 开关，配色全部由 CSS 变量承担 */
  createTheme(CONFIG.theme);

  const countdown = createCountdown({
    root: $('#countdown'),
    target,
    srEl: $('#srStatus'),
    examName,
  });

  const progress = createProgress({
    root: $('.progress'),
    start,
    target,
  });

  const quotes = createQuotes({
    config: CONFIG.quote,
    textEl: $('#quoteText'),
    authorEl: $('#quoteAuthor'),
    badgeEl: $('#quoteBadge'),
    badgeTextEl: $('#quoteBadgeText'),
    refreshBtn: $('#quoteRefresh'),
  });

  /* ---------- 共享状态（供分享文案使用） ---------- */
  const state = {
    parts: splitDuration(target.getTime() - Date.now()),
    stats: { percent: 0, elapsedDays: 0, remainDays: 0, totalDays: 0 },
  };

  createShare({
    button: $('#shareBtn'),
    getText: () => buildShareText(state, quotes.snapshot, examName, target),
  });

  function buildShareText(st, quote, name, targetDate) {
    const head = st.parts.passed
      ? `${name}已经开始，祝金榜题名。`
      : `距离${name}还有 ${st.parts.days} 天 ${st.parts.hours} 小时（高中进度 ${st.stats.percent}%）`;
    const line = quote.text ? `\n「${quote.text}」${quote.author ? ` —— ${quote.author}` : ''}` : '';
    return `${head}${line}\n${formatDot(targetDate)} · 2028.wjhtkjwz.eu.org`;
  }

  /* ---------- 抵达横幅 ---------- */
  const banner = $('#reachedBanner');
  let bannerShown = false;

  function syncBanner(passed) {
    if (!banner || passed === bannerShown) return;
    bannerShown = passed;
    banner.classList.toggle('is-visible', passed);
  }

  /* ---------- 心跳 ---------- */
  const ticker = createTicker({
    interval: 1000,
    onTick(now) {
      state.parts = countdown.update(now);
      state.stats = progress.update(now);
      syncBanner(state.parts.passed);
      quotes.refreshIfNewDay();
    },
  });

  // 首帧（不等待第一个 tick，避免白屏一秒）
  const first = new Date();
  state.parts = countdown.update(first);
  state.stats = progress.update(first);
  syncBanner(state.parts.passed);

  quotes.load();
  ticker.start();

  // 便于调试
  window.__countdown = { state, quotes, ticker };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
