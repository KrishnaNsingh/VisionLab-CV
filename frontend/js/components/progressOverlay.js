/**
 * progressOverlay.js — Loading overlay controller
 */

const ProgressOverlay = (() => {
  const overlay = () => document.getElementById('loading-overlay');
  const title   = () => document.getElementById('loading-title');
  const sub     = () => document.getElementById('loading-sub');

  function show(titleText = 'Processing…', subText = 'Running Computer Vision algorithms') {
    const el = overlay();
    if (!el) return;
    title().textContent = titleText;
    sub().textContent = subText;
    el.classList.remove('hidden');
  }

  function hide() {
    const el = overlay();
    if (el) el.classList.add('hidden');
  }

  return { show, hide };
})();
