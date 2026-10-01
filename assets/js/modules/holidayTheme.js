/**
 * holidayTheme.js — 节日自动主题
 * 实现要点：
 *  1. 完全复用"数据属性 + CSS 变量"的机制：JS 只在 <html> 上写 data-festival，
 *     配色全部由 tokens.css 的 [data-festival="<id>"] 承担，JS 不碰任何颜色值；
 *  2. 命中节日时"强制"覆盖用户当日的浅色/深色选择（满足"强制节日主题"需求），
 *     次晨（北京时间跨日）自动撤销 data-festival，恢复用户原有主题；
 *  3. 按北京时间（+08:00）判定"今天"，与全站时间轴锁定一致；
 *  4. 支持 URL 预览：?festival=<id> 可强制套用某节日主题，便于查看/截图效果。
 */

import { FESTIVALS } from '../data/festivals.js';
import { pad } from '../core/time.js';

const BEIJING_OFFSET_HOURS = 8;
const DAY_MS = 86_400_000;

/** 北京时间下的日历日 key（YYYY-MM-DD） */
export function beijingDayKey(date = new Date()) {
  const d = new Date(date.getTime() + BEIJING_OFFSET_HOURS * 3600 * 1000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** 给定日期 key 是否落在某节日生效区间内（含 span），命中返回该节日对象 */
export function matchFestival(dayKeyStr) {
  const cur = Date.parse(`${dayKeyStr}T00:00:00+08:00`);
  if (Number.isNaN(cur)) return null;
  for (const f of FESTIVALS) {
    const span = f.days && f.days > 1 ? f.days : 1;
    for (const d of f.dates) {
      const start = Date.parse(`${d}T00:00:00+08:00`);
      if (cur >= start && cur <= start + (span - 1) * DAY_MS) return f;
    }
  }
  return null;
}

/** 从 URL 读取预览用的强制节日 id（仅用于预览/调试，不影响正常判定） */
function previewFestivalId() {
  try {
    const id = new URLSearchParams(location.search).get('festival');
    if (id && FESTIVALS.some((f) => f.id === id)) return id;
  } catch { /* 无 location（非浏览器）时忽略 */ }
  return null;
}

export function createHolidayTheme({ enabled = true } = {}) {
  const root = document.documentElement;
  const eyebrowEl = document.querySelector('.eyebrow');
  const forcedId = previewFestivalId();
  let lastKey = null;
  let active = null;

  function apply(festival) {
    if (festival) {
      root.setAttribute('data-festival', festival.id);
      if (eyebrowEl) eyebrowEl.textContent = `节日 · ${festival.name}`;
    } else {
      root.removeAttribute('data-festival');
      if (eyebrowEl) eyebrowEl.textContent = 'Countdown';
    }
  }

  function evaluate(now = new Date()) {
    // 预览模式：恒为指定节日，跳过日期计算
    if (forcedId) {
      const f = FESTIVALS.find((x) => x.id === forcedId);
      if (active !== f) { active = f; apply(f); }
      return active;
    }
    if (!enabled) {
      if (active) { active = null; apply(null); }
      return null;
    }

    const key = beijingDayKey(now);
    if (key === lastKey) return active;     // 同一天不重复计算
    lastKey = key;
    active = matchFestival(key);
    apply(active);
    return active;
  }

  evaluate();   // 首帧立即求值

  return {
    update(now) { return evaluate(now); },
    get current() { return active; },
  };
}
