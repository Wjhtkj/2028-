/**
 * storage.js — localStorage 安全封装
 * 隐私模式 / 配额溢出 / 禁用 Cookie 时 localStorage 会抛错，
 * 这里统一降级为内存 Map，保证页面功能不受影响。
 */

const memory = new Map();
let usable = true;

try {
  const probe = '__probe__';
  window.localStorage.setItem(probe, '1');
  window.localStorage.removeItem(probe);
} catch {
  usable = false;
}

export const store = {
  get(key, fallback = null) {
    try {
      const raw = usable ? window.localStorage.getItem(key) : memory.get(key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    const raw = JSON.stringify(value);
    try {
      if (usable) window.localStorage.setItem(key, raw);
      else memory.set(key, raw);
    } catch {
      memory.set(key, raw); // 配额溢出时退回内存
    }
  },

  remove(key) {
    try {
      if (usable) window.localStorage.removeItem(key);
      else memory.delete(key);
    } catch { /* 忽略 */ }
  },
};
