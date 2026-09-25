/**
 * progress.js — 高中进度条
 * 实现要点：
 *  1. 进度 = (now - start) / (target - start)，由 time.js 的纯函数算出，此处只负责呈现；
 *  2. 填充条与端点光点共用同一个百分比，用 CSS transition 平滑推进；
 *  3. 同步维护 role="progressbar" 的 aria 值，读屏器可读；
 *  4. 所有写入都走脏检查，DOM 操作只在数值真正变化时发生。
 */

import { $, setText, setAttr, setStyle } from '../core/dom.js';
import { progressPercent, MS, formatDot } from '../core/time.js';

export function createProgress({ root, start, target }) {
  const fill    = $('#progressFill', root);
  const marker  = $('#progressMarker', root);
  const percent = $('#progressPercent', root);
  const bar     = $('#progressBar', root);
  const elapsed = $('#statElapsed', root);
  const remain  = $('#statRemain', root);
  const total   = $('#statTotal', root);
  const startLb = $('#startLabel', root);
  const targetLb = $('#targetLabel', root);

  const last = { percent: -1, elapsed: -1, remain: -1 };

  // 静态标签只在初始化时写一次
  if (startLb)  setText(startLb, formatDot(start));
  if (targetLb) setText(targetLb, formatDot(target));

  const totalDays = Math.round((target.getTime() - start.getTime()) / MS.day);
  if (total) setText(total, totalDays);

  function update(now) {
    const nowMs = now.getTime();
    const pct = progressPercent(nowMs, start.getTime(), target.getTime());

    if (Math.abs(pct - last.percent) >= 0.05) {
      setStyle(fill, 'width', `${pct}%`);
      setStyle(marker, 'left', `${pct}%`);
      setText(percent, `${pct}%`);
      setAttr(bar, 'aria-valuenow', pct);
      last.percent = pct;
    }

    const elapsedDays = Math.floor((nowMs - start.getTime()) / MS.day);
    if (elapsedDays !== last.elapsed) {
      setText(elapsed, Math.max(0, elapsedDays));
      last.elapsed = elapsedDays;
    }

    const remainDays = Math.ceil((target.getTime() - nowMs) / MS.day);
    if (remainDays !== last.remain) {
      setText(remain, Math.max(0, remainDays));
      last.remain = remainDays;
    }

    return { percent: pct, elapsedDays, remainDays, totalDays };
  }

  return { update };
}
