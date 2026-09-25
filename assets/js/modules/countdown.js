/**
 * countdown.js — 倒计时显示
 * 实现要点：
 *  1. 只做"渲染"，不持有定时器；由 main 注入 now，便于测试与复用；
 *  2. 每个数值位独立脏检查，只有真正变化才写 DOM；
 *  3. 变化瞬间给格子挂 is-ticking，交由 CSS 完成一次极短的反馈动画；
 *  4. 抵达后整组切换为 is-reached（强调色），并切换无障碍播报文案。
 */

import { $, $$, setText, setAttr, toggleClass, flash } from '../core/dom.js';
import { splitDuration, pad } from '../core/time.js';

export function createCountdown({ root, target, srEl, examName = '高考' }) {
  /** @type {Record<string, {wrap:HTMLElement, value:HTMLElement}>} */
  const units = {};
  $$('.unit', root).forEach((wrap) => {
    units[wrap.dataset.unit] = { wrap, value: $('.unit__value', wrap) };
  });

  const last = { days: -1, hours: -1, minutes: -1, seconds: -1, reached: null };

  function render(key, text) {
    const item = units[key];
    if (!item) return;
    if (setText(item.value, text)) flash(item.wrap, 'is-ticking', 180);
  }

  /**
   * @param {Date} now
   * @returns {{days:number,hours:number,minutes:number,seconds:number,total:number,passed:boolean}}
   */
  function update(now) {
    const parts = splitDuration(target.getTime() - now.getTime());
    const daysChanged = parts.days !== last.days;

    if (daysChanged) {
      render('days', String(parts.days));
      last.days = parts.days;
    }
    if (parts.hours !== last.hours) {
      render('hours', pad(parts.hours));
      last.hours = parts.hours;
    }
    if (parts.minutes !== last.minutes) {
      render('minutes', pad(parts.minutes));
      last.minutes = parts.minutes;
    }
    if (parts.seconds !== last.seconds) {
      render('seconds', pad(parts.seconds));
      last.seconds = parts.seconds;
    }

    if (parts.passed !== last.reached) {
      toggleClass(root, 'is-reached', parts.passed);
      last.reached = parts.passed;
    }

    // 无障碍：只播报"天"，避免读屏器每秒刷屏
    setAttr(root, 'aria-label',
      parts.passed
        ? `${examName}已开始`
        : `距离${examName}还有 ${parts.days} 天 ${parts.hours} 小时 ${parts.minutes} 分`);

    if (srEl && daysChanged) {
      setText(srEl, parts.passed
        ? `${examName}已开始`
        : `距离${examName}还有 ${parts.days} 天`);
    }

    return parts;
  }

  return { update };
}
