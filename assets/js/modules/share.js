/**
 * share.js — 复制当前状态到剪贴板
 * 实现要点：
 *  1. 优先用异步 Clipboard API；无权限或非安全上下文时，回退到临时 textarea + execCommand；
 *  2. 复制结果通过按钮自身文案做轻量反馈，不引入 toast 组件；
 *  3. 文本由外部 getText() 提供，模块不关心业务内容。
 */

async function writeClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch { /* 继续走回退 */ }
  }

  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:-1000px;opacity:0;';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

export function createShare({ button, getText }) {
  if (!button) return {};

  const labelEl = button.querySelector('span');
  const defaultLabel = labelEl ? labelEl.textContent : '';
  let resetTimer = null;

  function feedback(message) {
    if (!labelEl) return;
    labelEl.textContent = message;
    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      labelEl.textContent = defaultLabel;
    }, 1800);
  }

  button.addEventListener('click', async () => {
    const ok = await writeClipboard(getText());
    feedback(ok ? '已复制 ✓' : '复制失败');
  });

  return {};
}
