'use strict';
// Inspector columns: every control has a fixed width (style.css), so when the Inspector is made wider the fields
// flow into more columns. This groups each <label> with the control(s) after it into one .ifield cell; headings,
// notes and other blocks become full-width rows (.ifull). It runs whenever the Inspector content changes.
(() => {
  const box = document.getElementById('inspector');
  if (!box) return;
  const CONTROL = new Set(['INPUT', 'SELECT', 'TEXTAREA', 'CANVAS']);
  function group() {
    let cur = null;
    for (const el of [...box.children]) {
      if (el.classList.contains('ifield') || el.classList.contains('ifull')) { cur = null; continue; }
      const tag = el.tagName;
      const wrap = () => { const d = document.createElement('div'); d.className = 'ifield'; el.before(d); d.append(el); return d; };
      if (tag === 'LABEL' && !el.querySelector('input,select,textarea')) { cur = wrap(); continue; }   // caption: starts a field
      if (tag === 'LABEL') { wrap(); cur = null; continue; }                                            // checkbox label: a field by itself
      if (CONTROL.has(tag)) { if (cur) cur.append(el); else { wrap(); cur = null; } continue; }
      if (tag === 'P' && cur && cur.querySelector('textarea')) { cur.append(el); cur = null; continue; } // note under a text box (word count)
      if (tag === 'BUTTON') { wrap(); cur = null; continue; }
      el.classList.add('ifull'); cur = null;                                                            // headings, notes, rows, sections
    }
  }
  const mo = new MutationObserver(() => { mo.disconnect(); try { group(); } finally { mo.observe(box, { childList: true }); } });
  mo.observe(box, { childList: true });
  group();
})();
