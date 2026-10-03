/**
 * milestones.js — 关键节点（可推导的确定性里程碑）
 * 实现要点：
 *  1. 里程碑全部由 start/target 推导（半程点按比例、百日誓师/考前一周按开考前 N 天），
 *     不写死任何日期，换时间轴自动跟随；
 *  2. 两件事：往进度条上画静态刻度（track-tick），往面板渲染"距节点还有 N 天"的 chips；
 *  3. chips 文案按毫秒推导，且只在天数变化时写 DOM（逐 chip 脏检查）。
 */

import { MS, formatDot } from '../core/time.js';

function resolveAt(def, startMs, targetMs) {
  if (typeof def.ratio === 'number') return startMs + (targetMs - startMs) * def.ratio;
  if (typeof def.beforeTargetDays === 'number') return targetMs - def.beforeTargetDays * MS.day;
  if (typeof def.afterStartDays === 'number') return startMs + def.afterStartDays * MS.day;
  return NaN;
}

export function createMilestones({ defs, start, target, trackEl, listEl }) {
  const s = start.getTime();
  const t = target.getTime();
  const span = t - s;

  const items = (defs || [])
    .map((d) => ({ name: d.name, at: resolveAt(d, s, t) }))
    .filter((m) => Number.isFinite(m.at) && m.at > s && m.at < t)
    .sort((a, b) => a.at - b.at);

  /* 进度条刻度（静态，一次注入，对读屏器隐藏） */
  if (trackEl) {
    items.forEach((m) => {
      const tick = document.createElement('span');
      tick.className = 'track-tick';
      tick.style.left = `${((m.at - s) / span) * 100}%`;
      tick.title = `${m.name} · ${formatDot(new Date(m.at))}`;
      tick.setAttribute('aria-hidden', 'true');
      trackEl.appendChild(tick);
    });
  }

  /* chips（文案随天数变化） */
  const chips = items.map((m) => {
    const el = document.createElement('span');
    el.className = 'ms';
    const name = document.createElement('b');
    name.textContent = m.name;
    const status = document.createElement('i');
    el.append(name, status);
    if (listEl) listEl.appendChild(el);
    return { m, el, status, diff: null };
  });

  function update(now = new Date()) {
    const nowMs = now.getTime();
    chips.forEach((chip) => {
      const diff = Math.ceil((chip.m.at - nowMs) / MS.day);
      if (diff === chip.diff) return;
      chip.diff = diff;
      chip.el.classList.toggle('is-past', diff < 0);
      chip.el.classList.toggle('is-today', diff === 0);
      chip.status.textContent =
        diff > 0 ? `还有 ${diff} 天` : diff === 0 ? '就是今天' : `已过 ${-diff} 天`;
    });
  }

  update(new Date());
  return { update };
}
