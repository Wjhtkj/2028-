/**
 * ticker.js — 统一的心跳源
 * 特点：
 *  1. 用 requestAnimationFrame 驱动，按 interval 节流回调；
 *  2. 页面不可见时自动挂起（省电），恢复可见时立刻补一帧，避免显示滞后；
 *  3. 对齐到 interval 边界，防止长时间运行后累积漂移。
 */

export function createTicker({ interval = 1000, onTick } = {}) {
  let rafId = null;
  let nextAt = 0;
  let running = false;

  function frame(ts) {
    if (!running) return;
    if (ts >= nextAt) {
      // 对齐到下一个整点，避免 rAF 抖动累积误差
      nextAt = nextAt ? nextAt + interval : ts + interval;
      if (nextAt <= ts) nextAt = ts + interval; // 长时间挂起后防暴走
      onTick(new Date());
    }
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    nextAt = 0;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
  }

  document.addEventListener('visibilitychange', () => {
    if (!running) return;
    if (document.hidden) {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    } else {
      nextAt = 0;                 // 立即补一帧
      rafId = requestAnimationFrame(frame);
    }
  });

  return { start, stop };
}
