// 弹窗 / toast

export function openModal(html) {
  const box = document.getElementById('modals')
  const mask = document.createElement('div')
  mask.className = 'modal-mask'
  mask.innerHTML = `<div class="modal">${html}</div>`
  mask.addEventListener('click', e => {
    if (e.target === mask) closeModal()
    if (e.target.hasAttribute && e.target.hasAttribute('data-close')) closeModal()
  })
  mask.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModal))
  box.appendChild(mask)
  return mask
}

export function closeModal() {
  const box = document.getElementById('modals')
  const masks = box.querySelectorAll('.modal-mask')
  if (masks.length > 1) {
    masks[masks.length - 1].remove()
  } else {
    box.innerHTML = ''
  }
}

// toast 默认按纯文本渲染，防 LLM/存档字段 XSS；需要 HTML 时用 toastHtml（调用方必须先 esc）
export function toast(msg, ms) {
  toastHtml(escapeText(msg), ms)
}

export function toastHtml(html, ms) {
  const box = document.getElementById('toasts')
  const t = document.createElement('div')
  t.className = 'toast'
  t.innerHTML = html
  box.appendChild(t)
  setTimeout(() => {
    t.classList.add('fade')
    setTimeout(() => t.remove(), 450)
  }, ms || 3800)
}

export function centerToast(msg, ms) {
  centerToastHtml(escapeText(msg), ms)
}

export function centerToastHtml(html, ms) {
  let el = document.getElementById('center-msg')
  if (!el) {
    el = document.createElement('div')
    el.id = 'center-msg'
    document.body.appendChild(el)
  }
  el.classList.remove('fade')
  el.innerHTML = html
  clearTimeout(el._t)
  el._t = setTimeout(() => {
    el.classList.add('fade')
    setTimeout(() => el.remove(), 700)
  }, ms || 2600)
}

function escapeText(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
