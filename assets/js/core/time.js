/**
 * time.js — 纯时间计算，不碰 DOM，可单测
 */

export const MS = {
  second: 1000,
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
};

/** 字符串 / Date → Date，非法输入抛错以便尽早暴露 */
export function toDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${value}`);
  return d;
}

/** 补零到指定宽度 */
export function pad(n, width = 2) {
  return String(Math.max(0, Math.trunc(n))).padStart(width, '0');
}

/**
 * 把一段毫秒差拆成 天/时/分/秒
 * @returns {{days:number,hours:number,minutes:number,seconds:number,total:number,passed:boolean}}
 */
export function splitDuration(diffMs) {
  const total = Math.max(0, diffMs);
  return {
    days: Math.floor(total / MS.day),
    hours: Math.floor((total % MS.day) / MS.hour),
    minutes: Math.floor((total % MS.hour) / MS.minute),
    seconds: Math.floor((total % MS.minute) / MS.second),
    total,
    passed: diffMs <= 0,
  };
}

/** 计算进度 0–100，自动夹在 [0,100]，保留一位小数 */
export function progressPercent(nowMs, startMs, endMs) {
  const span = endMs - startMs;
  if (span <= 0) return 100;
  const raw = ((nowMs - startMs) / span) * 100;
  return Math.round(Math.min(100, Math.max(0, raw)) * 10) / 10;
}

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

export function weekdayCN(date) {
  return WEEKDAYS[toDate(date).getDay()];
}

/** 2028.06.07 */
export function formatDot(date) {
  const d = toDate(date);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

/** 2028年6月7日 */
export function formatCN(date) {
  const d = toDate(date);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 本地日历日 key，用于"每日"缓存判定：2028-06-07 */
export function dayKey(date = new Date()) {
  const d = toDate(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
