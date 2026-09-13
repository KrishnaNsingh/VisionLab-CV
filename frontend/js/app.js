/**
 * app.js — VisionLab SPA Router & Global State
 * Must be loaded last (after all page modules).
 */

// ── Global state ─────────────────────────────────────────────────────────────
const AppState = {
  currentPage: 'home',
  currentTab: null,
};

// ── Router ───────────────────────────────────────────────────────────────────

/**
 * Navigate to a page (and optionally a sub-tab).
 * @param {string} page   - 'home' | 'image' | 'video'
 * @param {string} [tab]  - tab id within the page (optional)
 */
function navigate(page, tab = null) {
  AppState.currentPage = page;
  AppState.currentTab  = tab;

  // Update sidebar active state
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navEl = document.getElementById(`nav-${page}`);
  if (navEl) navEl.classList.add('active');

  // Render the page
  const app = document.getElementById('app');
  if (!app) return;

  if (page === 'home') {
    app.innerHTML = renderHome();
    initHome();
  } else if (page === 'image') {
    app.innerHTML = renderImageMode(tab || 'preprocessing');
    // Re-initialize param areas that depend on DOM
    setTimeout(() => {
      selectOp(_selectedOp || 'original');
      selectFeature(_selectedFeat || 'canny');
      selectSegMethod(_selectedSeg || 'kmeans');
    }, 50);
  } else if (page === 'video') {
    app.innerHTML = renderVideoMode(tab || 'info');
  }

  // Close sidebar on mobile after navigation
  if (window.innerWidth <= 900) {
    document.getElementById('sidebar').classList.remove('open');
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Sidebar mobile toggle ────────────────────────────────────────────────────

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

// ── Drag-and-drop zone enhancement ──────────────────────────────────────────

function setupDragDrop() {
  document.addEventListener('dragover', (e) => {
    const zone = e.target.closest('.upload-zone');
    if (zone) { e.preventDefault(); zone.classList.add('drag-over'); }
  });
  document.addEventListener('dragleave', (e) => {
    const zone = e.target.closest('.upload-zone');
    if (zone && !zone.contains(e.relatedTarget)) zone.classList.remove('drag-over');
  });
  document.addEventListener('drop', (e) => {
    const zone = e.target.closest('.upload-zone');
    if (!zone) return;
    e.preventDefault();
    zone.classList.remove('drag-over');
    const input = zone.querySelector('input[type="file"]');
    if (!input || !e.dataTransfer.files[0]) return;
    // Inject file into input
    const dt = new DataTransfer();
    dt.items.add(e.dataTransfer.files[0]);
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
  });
}

// ── Boot ─────────────────────────────────────────────────────────────────────

(function boot() {
  // Determine initial page from hash or default to home
  const hash = window.location.hash.replace('#', '') || 'home';
  const validPages = ['home', 'image', 'video'];
  const page = validPages.includes(hash) ? hash : 'home';

  navigate(page);
  setupDragDrop();

  // Handle browser back/forward
  window.addEventListener('hashchange', () => {
    const h = window.location.hash.replace('#', '');
    if (validPages.includes(h)) navigate(h);
  });
})();
