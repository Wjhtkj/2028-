/**
 * dom.js — 极薄的 DOM 工具层
 * 目标是让业务模块里不再出现重复的 querySelector / 脏检查逻辑。
 */

export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** 带脏检查的文本写入：值没变就不碰 DOM */
export function setText(el, value) {
  if (!el) return false;
  const next = String(value);
  if (el.textContent === next) return false;
  el.textContent = next;
  return true;
}

/** 带脏检查的属性写入 */
export function setAttr(el, name, value) {
  if (!el) return false;
  const next = String(value);
  if (el.getAttribute(name) === next) return false;
  el.setAttribute(name, next);
  return true;
}

/** 带脏检查的样式写入 */
export function setStyle(el, prop, value) {
  if (!el) return false;
  const next = String(value);
  if (el.style[prop] === next) return false;
  el.style[prop] = next;
  return true;
}

/** class 开关（state 为 null 时不做改动） */
export function toggleClass(el, className, state) {
  if (!el || state === null || state === undefined) return;
  el.classList.toggle(className, Boolean(state));
}

/** 事件绑定，返回解绑函数 */
export function on(el, type, handler, options) {
  if (!el) return () => {};
  el.addEventListener(type, handler, options);
  return () => el.removeEventListener(type, handler, options);
}

/** 元素上短暂挂一个 class，用于触发一次性动画 */
export function flash(el, className, duration = 180) {
  if (!el) return;
  el.classList.add(className);
  window.setTimeout(() => el.classList.remove(className), duration);
}
