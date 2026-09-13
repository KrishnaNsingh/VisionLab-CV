/**
 * image_mode.js — Image Analysis Page (Modules 1–4)
 * Tabs: Preprocessing | Feature Analysis | Segmentation | Object Detection
 */

// ── Configuration ────────────────────────────────────────────────────────────

const IMAGE_OPS = [
  { id: 'original',      label: 'Original',     icon: '🖼️' },
  { id: 'grayscale',     label: 'Grayscale',    icon: '⬛' },
  { id: 'resize',        label: 'Resize',       icon: '↔️' },
  { id: 'gaussian_blur', label: 'Gaussian Blur',icon: '🌫️' },
  { id: 'median_filter', label: 'Median Filter',icon: '🔇' },
  { id: 'sharpen',       label: 'Sharpen',      icon: '✨' },
  { id: 'histogram',     label: 'Histogram',    icon: '📊' },
  { id: 'histogram_eq',  label: 'Hist. EQ',     icon: '⚖️' },
  { id: 'contrast',      label: 'Contrast',     icon: '🌓' },
  { id: 'threshold',     label: 'Threshold',    icon: '⬜' },
  { id: 'morphology',    label: 'Morphology',   icon: '🔬' },
];

const IMAGE_FEATURES = [
  { id: 'canny',       label: 'Canny Edge',     icon: '〰️', badge: 'Classical' },
  { id: 'sobel',       label: 'Sobel',          icon: '↗️', badge: 'Classical' },
  { id: 'laplacian',   label: 'Laplacian',      icon: '🔘', badge: 'Classical' },
  { id: 'log',         label: 'LoG',            icon: '🔭', badge: 'Classical' },
  { id: 'hough_lines', label: 'Hough Lines',    icon: '📏', badge: 'Classical' },
  { id: 'harris',      label: 'Harris Corner',  icon: '📍', badge: 'Classical' },
  { id: 'sift',        label: 'SIFT',           icon: '🔑', badge: 'DoG' },
  { id: 'hog',         label: 'HOG',            icon: '🕺', badge: 'Descriptor' },
];

const SEG_METHODS = [
  { id: 'threshold',    label: 'Threshold',     icon: '🔲', badge: 'Global' },
  { id: 'kmeans',       label: 'K-Means',       icon: '🎨', badge: 'Clustering' },
  { id: 'edge_based',   label: 'Edge-Based',    icon: '🔍', badge: 'Contour' },
  { id: 'region_growing', label: 'Region Growing', icon: '🌱', badge: 'Seeded' },
  { id: 'mean_shift',   label: 'Mean Shift',    icon: '🌀', badge: 'Density' },
];

// ── Parameter definitions ────────────────────────────────────────────────────

function getOpParams(opId) {
  const defs = {
    resize:        [{ key: 'scale', label: 'Scale (%)', type: 'range', min: 10, max: 200, step: 5, val: 50 }],
    gaussian_blur: [{ key: 'kernel_size', label: 'Kernel Size', type: 'range', min: 3, max: 31, step: 2, val: 15 }],
    median_filter: [{ key: 'kernel_size', label: 'Kernel Size', type: 'range', min: 3, max: 21, step: 2, val: 5 }],
    sharpen:       [{ key: 'strength', label: 'Strength', type: 'range', min: 0.1, max: 3.0, step: 0.1, val: 1.0 }],
    contrast:      [
      { key: 'alpha', label: 'Contrast (α)', type: 'range', min: 0.5, max: 3.0, step: 0.1, val: 1.5 },
      { key: 'beta',  label: 'Brightness (β)', type: 'range', min: -100, max: 100, step: 5, val: 0 },
    ],
    threshold:     [
      { key: 'method', label: 'Method', type: 'select', opts: [
        { val: 'otsu', lbl: "Otsu's Global" },
        { val: 'adaptive_mean', lbl: 'Adaptive Mean' },
        { val: 'adaptive_gaussian', lbl: 'Adaptive Gaussian' },
        { val: 'manual', lbl: 'Manual Value' },
      ], val: 'otsu' },
      { key: 'value', label: 'Manual Threshold', type: 'range', min: 0, max: 255, step: 1, val: 127 },
    ],
    morphology:    [
      { key: 'morph_op', label: 'Operation', type: 'select', opts: [
        { val: 'erosion', lbl: 'Erosion' }, { val: 'dilation', lbl: 'Dilation' },
        { val: 'opening', lbl: 'Opening' }, { val: 'closing', lbl: 'Closing' },
        { val: 'gradient', lbl: 'Gradient' },
      ], val: 'dilation' },
      { key: 'kernel_size', label: 'Kernel Size', type: 'range', min: 3, max: 21, step: 2, val: 5 },
      { key: 'kernel_shape', label: 'Kernel Shape', type: 'select', opts: [
        { val: 'rect', lbl: 'Rectangle' }, { val: 'ellipse', lbl: 'Ellipse' }, { val: 'cross', lbl: 'Cross' },
      ], val: 'rect' },
    ],
  };
  return defs[opId] || [];
}

function getFeatureParams(featId) {
  const defs = {
    canny:       [
      { key: 'low_thresh', label: 'Low Threshold', type: 'range', min: 5, max: 200, step: 5, val: 50 },
      { key: 'high_thresh', label: 'High Threshold', type: 'range', min: 20, max: 400, step: 10, val: 150 },
      { key: 'blur_ksize', label: 'Blur Kernel', type: 'range', min: 3, max: 11, step: 2, val: 5 },
    ],
    sobel:       [{ key: 'kernel_size', label: 'Kernel Size', type: 'range', min: 1, max: 7, step: 2, val: 3 }],
    log:         [{ key: 'sigma', label: 'Sigma (σ)', type: 'range', min: 0.5, max: 5.0, step: 0.5, val: 2.0 }],
    hough_lines: [
      { key: 'threshold', label: 'Accumulator Threshold', type: 'range', min: 20, max: 200, step: 10, val: 80 },
      { key: 'min_line_length', label: 'Min Line Length', type: 'range', min: 10, max: 200, step: 10, val: 50 },
      { key: 'max_line_gap', label: 'Max Line Gap', type: 'range', min: 1, max: 50, step: 1, val: 10 },
    ],
    harris:      [
      { key: 'k', label: 'Sensitivity k', type: 'range', min: 0.01, max: 0.1, step: 0.01, val: 0.04 },
      { key: 'threshold_ratio', label: 'Corner Threshold', type: 'range', min: 0.001, max: 0.1, step: 0.001, val: 0.01 },
    ],
    sift:        [
      { key: 'n_features', label: 'Max Keypoints', type: 'range', min: 50, max: 2000, step: 50, val: 500 },
      { key: 'contrast_threshold', label: 'Contrast Threshold', type: 'range', min: 0.01, max: 0.1, step: 0.01, val: 0.04 },
    ],
    hog:         [
      { key: 'orientations', label: 'Orientations', type: 'range', min: 6, max: 18, step: 1, val: 9 },
      { key: 'pixels_per_cell', label: 'Pixels per Cell', type: 'range', min: 4, max: 16, step: 4, val: 8 },
      { key: 'cells_per_block', label: 'Cells per Block', type: 'range', min: 1, max: 4, step: 1, val: 2 },
    ],
  };
  return defs[featId] || [];
}

function getSegParams(methodId) {
  const defs = {
    kmeans:       [{ key: 'k', label: 'Clusters (K)', type: 'range', min: 2, max: 12, step: 1, val: 4 }],
    region_growing: [
      { key: 'tolerance', label: 'Intensity Tolerance', type: 'range', min: 5, max: 60, step: 5, val: 15 },
    ],
    mean_shift:   [
      { key: 'spatial_radius', label: 'Spatial Radius', type: 'range', min: 5, max: 50, step: 5, val: 20 },
      { key: 'color_radius', label: 'Color Radius', type: 'range', min: 10, max: 100, step: 10, val: 40 },
    ],
  };
  return defs[methodId] || [];
}

// ── Shared UI helpers ────────────────────────────────────────────────────────

function renderParams(params, prefix = 'param') {
  if (!params.length) return '';
  return `<div class="controls-grid" style="grid-template-columns:1fr;">` +
    params.map(p => {
      if (p.type === 'range') {
        return `
          <div class="control-group range-wrap">
            <div class="range-header">
              <label class="control-label">${p.label}</label>
              <span class="range-value" id="${prefix}-${p.key}-val">${p.val}</span>
            </div>
            <input type="range" id="${prefix}-${p.key}" min="${p.min}" max="${p.max}" step="${p.step}" value="${p.val}"
              oninput="document.getElementById('${prefix}-${p.key}-val').textContent=this.value">
          </div>`;
      }
      if (p.type === 'select') {
        return `
          <div class="control-group">
            <label class="control-label">${p.label}</label>
            <select class="vl-select" id="${prefix}-${p.key}">
              ${p.opts.map(o => `<option value="${o.val}" ${o.val === p.val ? 'selected' : ''}>${o.lbl}</option>`).join('')}
            </select>
          </div>`;
      }
      return '';
    }).join('') + `</div>`;
}

function collectParams(params, prefix = 'param') {
  const out = {};
  params.forEach(p => {
    const el = document.getElementById(`${prefix}-${p.key}`);
    if (!el) return;
    out[p.key] = p.type === 'range' ? parseFloat(el.value) : el.value;
  });
  return out;
}

function renderUploadZone(id, accept, label) {
  return `
    <div class="upload-zone" id="${id}-zone">
      <input type="file" id="${id}-input" accept="${accept}"
        onchange="handleUploadChange('${id}')">
      <div class="upload-icon">⬆️</div>
      <div class="upload-title">${label}</div>
      <div class="upload-sub">Drag &amp; drop or click to browse · JPEG, PNG, WebP</div>
      <div class="upload-preview" id="${id}-preview">
        <img id="${id}-thumb" src="" alt="preview" />
        <div class="upload-preview-name" id="${id}-name"></div>
      </div>
    </div>`;
}

function handleUploadChange(id) {
  const input = document.getElementById(`${id}-input`);
  const preview = document.getElementById(`${id}-preview`);
  const thumb = document.getElementById(`${id}-thumb`);
  const name = document.getElementById(`${id}-name`);
  if (!input.files[0]) return;
  const url = URL.createObjectURL(input.files[0]);
  thumb.src = url;
  name.textContent = input.files[0].name;
  preview.style.display = 'block';
}

function renderSplitView(leftLabel, rightLabel) {
  return `
    <div class="split-view" id="split-view">
      <div class="split-panel">
        <div class="split-panel-label">${leftLabel}</div>
        <div class="result-img-wrap">
          <div class="result-img-placeholder" id="left-placeholder">
            <span>🖼️</span>Upload an image to begin
          </div>
          <img id="img-original" src="" alt="Original" style="display:none">
        </div>
      </div>
      <div class="split-panel">
        <div class="split-panel-label" id="right-label">${rightLabel}</div>
        <div class="result-img-wrap">
          <div class="result-img-placeholder" id="right-placeholder">
            <span>⚙️</span>Result will appear here
          </div>
          <img id="img-result" src="" alt="Result" style="display:none">
        </div>
      </div>
    </div>`;
}

function showSplitResult(originalSrc, resultSrc) {
  ['img-original','img-result'].forEach(id => {
    const img = document.getElementById(id);
    if (img) img.style.display = 'none';
  });
  const orig = document.getElementById('img-original');
  const res  = document.getElementById('img-result');
  if (orig && originalSrc) { orig.src = originalSrc; orig.style.display = 'block'; }
  if (res  && resultSrc)   { res.src  = resultSrc;   res.style.display = 'block'; }
  document.getElementById('left-placeholder').style.display = 'none';
  document.getElementById('right-placeholder').style.display = 'none';
}

function renderStatsGrid(stats) {
  if (!stats || !Object.keys(stats).length) return '';
  return `
    <div class="stats-grid">
      ${Object.entries(stats).map(([k, v]) => `
        <div class="stat-card">
          <div class="stat-label">${k.replace(/_/g,' ')}</div>
          <div class="stat-value">${Array.isArray(v) ? v.join(',') : v}</div>
        </div>`).join('')}
    </div>`;
}

function showError(containerId, msg) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `
    <div class="alert alert-info" style="border-color:var(--danger);background:rgba(220,60,60,0.06)">
      <span class="alert-icon">⚠️</span>
      <div>${msg}</div>
    </div>`;
}

// ── PAGE RENDER ──────────────────────────────────────────────────────────────

function renderImageMode(initialTab = 'preprocessing') {
  const tabs = [
    { id: 'preprocessing', label: '🔧 Preprocessing', mod: '1' },
    { id: 'features',      label: '🔍 Feature Analysis', mod: '2' },
    { id: 'segmentation',  label: '🎭 Segmentation', mod: '3' },
    { id: 'detection',     label: '🎯 Object Detection', mod: '4' },
  ];

  return `
    <div class="page-header">
      <h1>Image Analysis</h1>
      <p>Apply classical Computer Vision algorithms and deep learning detection to any uploaded image.</p>
    </div>

    <div class="tabs-wrap">
      ${tabs.map(t => `
        <button class="tab-btn ${t.id === initialTab ? 'active' : ''}"
          id="tab-btn-${t.id}"
          onclick="switchImageTab('${t.id}')">
          ${t.label} <span class="badge badge-accent" style="font-size:.6rem">M${t.mod}</span>
        </button>`).join('')}
    </div>

    <div id="tab-preprocessing" class="tab-panel ${initialTab==='preprocessing'?'active':''}">
      ${renderPreprocessingTab()}
    </div>
    <div id="tab-features" class="tab-panel ${initialTab==='features'?'active':''}">
      ${renderFeaturesTab()}
    </div>
    <div id="tab-segmentation" class="tab-panel ${initialTab==='segmentation'?'active':''}">
      ${renderSegmentationTab()}
    </div>
    <div id="tab-detection" class="tab-panel ${initialTab==='detection'?'active':''}">
      ${renderDetectionTab()}
    </div>
  `;
}

function switchImageTab(tabId) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${tabId}`).classList.add('active');
  document.getElementById(`tab-btn-${tabId}`).classList.add('active');
}

// ── TAB 1: PREPROCESSING ─────────────────────────────────────────────────────

function renderPreprocessingTab() {
  return `
    <div style="display:grid;grid-template-columns:320px 1fr;gap:1.5rem;align-items:start">
      <!-- Controls -->
      <div style="display:flex;flex-direction:column;gap:1rem">
        ${renderUploadZone('prep', 'image/*', 'Upload Image')}
        <div class="glass-card no-hover" style="padding:1rem">
          <div class="control-label" style="margin-bottom:.75rem">Operation</div>
          <div class="op-grid" style="grid-template-columns:repeat(3,1fr)">
            ${IMAGE_OPS.map(op => `
              <div class="op-card ${op.id==='original'?'selected':''}" id="op-${op.id}"
                onclick="selectOp('${op.id}')">
                <span class="op-card-icon">${op.icon}</span>
                <span class="op-card-label">${op.label}</span>
              </div>`).join('')}
          </div>
          <div id="prep-params-area" style="margin-top:.75rem"></div>
          <button class="btn btn-primary w-full mt-4" id="btn-prep-run" onclick="runPreprocessing()">
            ⚙️ Apply Operation
          </button>
        </div>
      </div>

      <!-- Results -->
      <div>
        ${renderSplitView('Original Image', 'Processed Result')}
        <div id="prep-desc" class="desc-box hidden"></div>
        <div id="prep-stats"></div>
        <!-- Histogram chart -->
        <div id="prep-chart-area" class="hidden">
          <div class="chart-title mt-6">Intensity Distribution</div>
          <div class="chart-wrap"><canvas id="hist-chart"></canvas></div>
        </div>
      </div>
    </div>
  `;
}

let _selectedOp = 'original';

function selectOp(opId) {
  document.querySelectorAll('.op-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById(`op-${opId}`);
  if (card) card.classList.add('selected');
  _selectedOp = opId;
  const params = getOpParams(opId);
  const area = document.getElementById('prep-params-area');
  if (area) area.innerHTML = renderParams(params, 'prp');
}

async function runPreprocessing() {
  const input = document.getElementById('prep-input');
  if (!input?.files[0]) {
    alert('Please upload an image first.'); return;
  }
  const params = collectParams(getOpParams(_selectedOp), 'prp');
  ProgressOverlay.show('Applying operation…', `Running: ${_selectedOp}`);
  try {
    const data = await apiImageProcess(input.files[0], _selectedOp, params);
    showSplitResult(data.original_image, data.processed_image);

    const descEl = document.getElementById('prep-desc');
    if (descEl) {
      descEl.textContent = data.description;
      descEl.classList.remove('hidden');
    }

    document.getElementById('prep-stats').innerHTML = renderStatsGrid(data.stats);

    // Histogram chart
    const chartArea = document.getElementById('prep-chart-area');
    if (data.chart_data && chartArea) {
      chartArea.classList.remove('hidden');
      setTimeout(() => Dashboard.renderHistogram('hist-chart', data.chart_data), 50);
    } else if (chartArea) {
      chartArea.classList.add('hidden');
    }
  } catch (e) {
    showError('prep-stats', `Error: ${e.message}`);
  } finally {
    ProgressOverlay.hide();
  }
}

// ── TAB 2: FEATURE ANALYSIS ──────────────────────────────────────────────────

function renderFeaturesTab() {
  return `
    <div style="display:grid;grid-template-columns:320px 1fr;gap:1.5rem;align-items:start">
      <!-- Controls -->
      <div style="display:flex;flex-direction:column;gap:1rem">
        ${renderUploadZone('feat', 'image/*', 'Upload Image for Feature Analysis')}
        <div class="glass-card no-hover" style="padding:1rem">
          <div class="control-label" style="margin-bottom:.75rem">Feature Detector</div>
          <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:.75rem">
            ${IMAGE_FEATURES.map(f => `
              <button class="op-card ${f.id==='canny'?'selected':''}" id="feat-${f.id}"
                style="flex-direction:row;justify-content:flex-start;padding:.6rem .75rem"
                onclick="selectFeature('${f.id}')">
                <span class="op-card-icon">${f.icon}</span>
                <span class="op-card-label" style="text-align:left">${f.label}</span>
                <span class="badge badge-accent" style="margin-left:auto;font-size:.6rem">${f.badge}</span>
              </button>`).join('')}
          </div>
          <div id="feat-params-area"></div>
          <button class="btn btn-primary w-full mt-4" onclick="runFeatures()">🔍 Analyze Features</button>
        </div>
      </div>

      <!-- Results -->
      <div>
        <div class="split-view">
          <div class="split-panel">
            <div class="split-panel-label">Original</div>
            <div class="result-img-wrap">
              <div class="result-img-placeholder" id="feat-left-ph"><span>🖼️</span>Upload image</div>
              <img id="feat-orig" style="display:none;width:100%" alt="orig">
            </div>
          </div>
          <div class="split-panel">
            <div class="split-panel-label">Feature Visualization</div>
            <div class="result-img-wrap">
              <div class="result-img-placeholder" id="feat-right-ph"><span>🔍</span>Result appears here</div>
              <img id="feat-result" style="display:none;width:100%" alt="result">
            </div>
          </div>
        </div>

        <!-- Overlay toggle -->
        <div id="feat-overlay-wrap" class="hidden mt-4">
          <div class="flex items-center gap-3 mb-4">
            <button class="btn btn-secondary" onclick="toggleFeatureView('result')" id="feat-view-result">Result Map</button>
            <button class="btn btn-ghost" onclick="toggleFeatureView('overlay')" id="feat-view-overlay">Overlay on Original</button>
          </div>
        </div>

        <div id="feat-desc" class="desc-box hidden"></div>
        <div id="feat-stats"></div>
      </div>
    </div>`;
}

let _selectedFeat = 'canny';
let _featData = null;

function selectFeature(featId) {
  document.querySelectorAll('[id^="feat-"]').forEach(c => {
    if (c.classList.contains('op-card')) c.classList.remove('selected');
  });
  const card = document.getElementById(`feat-${featId}`);
  if (card) card.classList.add('selected');
  _selectedFeat = featId;
  const params = getFeatureParams(featId);
  const area = document.getElementById('feat-params-area');
  if (area) area.innerHTML = renderParams(params, 'fpr');
}

function toggleFeatureView(view) {
  if (!_featData) return;
  const img = document.getElementById('feat-result');
  if (img) img.src = view === 'overlay' ? _featData.overlay_image : _featData.result_image;
  document.getElementById('feat-view-result').className = `btn ${view==='result'?'btn-secondary':'btn-ghost'}`;
  document.getElementById('feat-view-overlay').className = `btn ${view==='overlay'?'btn-secondary':'btn-ghost'}`;
}

async function runFeatures() {
  const input = document.getElementById('feat-input');
  if (!input?.files[0]) { alert('Please upload an image first.'); return; }
  const params = collectParams(getFeatureParams(_selectedFeat), 'fpr');
  ProgressOverlay.show('Detecting features…', `Running: ${_selectedFeat}`);
  try {
    const data = _featData = await apiImageFeatures(input.files[0], _selectedFeat, params);

    const origEl = document.getElementById('feat-orig');
    const resEl  = document.getElementById('feat-result');
    origEl.src = data.original_image; origEl.style.display = 'block';
    resEl.src  = data.result_image;   resEl.style.display  = 'block';
    document.getElementById('feat-left-ph').style.display  = 'none';
    document.getElementById('feat-right-ph').style.display = 'none';

    // Show overlay toggle if overlay available
    const overlayWrap = document.getElementById('feat-overlay-wrap');
    if (data.overlay_image && overlayWrap) overlayWrap.classList.remove('hidden');

    const descEl = document.getElementById('feat-desc');
    if (descEl) { descEl.textContent = data.description; descEl.classList.remove('hidden'); }
    document.getElementById('feat-stats').innerHTML = renderStatsGrid(data.stats);
  } catch (e) {
    showError('feat-stats', `Error: ${e.message}`);
  } finally {
    ProgressOverlay.hide();
  }
}

// ── TAB 3: SEGMENTATION ──────────────────────────────────────────────────────

function renderSegmentationTab() {
  return `
    <div style="display:grid;grid-template-columns:300px 1fr;gap:1.5rem;align-items:start">
      <div style="display:flex;flex-direction:column;gap:1rem">
        ${renderUploadZone('seg', 'image/*', 'Upload Image for Segmentation')}
        <div class="glass-card no-hover" style="padding:1rem">
          <div class="control-label" style="margin-bottom:.75rem">Segmentation Method</div>
          <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:.75rem">
            ${SEG_METHODS.map(m => `
              <button class="op-card ${m.id==='kmeans'?'selected':''}" id="seg-${m.id}"
                style="flex-direction:row;justify-content:flex-start;padding:.6rem .75rem"
                onclick="selectSegMethod('${m.id}')">
                <span class="op-card-icon">${m.icon}</span>
                <span class="op-card-label" style="text-align:left">${m.label}</span>
                <span class="badge badge-purple" style="margin-left:auto;font-size:.6rem">${m.badge}</span>
              </button>`).join('')}
          </div>
          <div id="seg-params-area"></div>
          <button class="btn btn-primary w-full mt-4" onclick="runSegmentation()">🎭 Segment Image</button>
        </div>
      </div>

      <div>
        <div class="split-view">
          <div class="split-panel">
            <div class="split-panel-label">Original</div>
            <div class="result-img-wrap">
              <div class="result-img-placeholder" id="seg-left-ph"><span>🖼️</span>Upload image</div>
              <img id="seg-orig" style="display:none;width:100%" alt="orig">
            </div>
          </div>
          <div class="split-panel">
            <div class="split-panel-label" id="seg-right-label">Segmentation Result</div>
            <div class="result-img-wrap">
              <div class="result-img-placeholder" id="seg-right-ph"><span>🎭</span>Result appears here</div>
              <img id="seg-result" style="display:none;width:100%" alt="result">
            </div>
          </div>
        </div>
        <div id="seg-desc" class="desc-box hidden"></div>
        <div id="seg-stats"></div>
      </div>
    </div>`;
}

let _selectedSeg = 'kmeans';

function selectSegMethod(methodId) {
  document.querySelectorAll('[id^="seg-"]').forEach(c => {
    if (c.classList.contains('op-card')) c.classList.remove('selected');
  });
  const card = document.getElementById(`seg-${methodId}`);
  if (card) card.classList.add('selected');
  _selectedSeg = methodId;
  const params = getSegParams(methodId);
  const area = document.getElementById('seg-params-area');
  if (area) area.innerHTML = renderParams(params, 'sgp');
}

async function runSegmentation() {
  const input = document.getElementById('seg-input');
  if (!input?.files[0]) { alert('Please upload an image first.'); return; }
  const params = collectParams(getSegParams(_selectedSeg), 'sgp');
  ProgressOverlay.show('Segmenting image…', `Method: ${_selectedSeg}`);
  try {
    const data = await apiImageSegment(input.files[0], _selectedSeg, params);
    const origEl = document.getElementById('seg-orig');
    const resEl  = document.getElementById('seg-result');
    origEl.src = data.original_image; origEl.style.display = 'block';
    resEl.src  = data.segmented_image; resEl.style.display = 'block';
    document.getElementById('seg-left-ph').style.display  = 'none';
    document.getElementById('seg-right-ph').style.display = 'none';

    const descEl = document.getElementById('seg-desc');
    if (descEl) { descEl.textContent = data.description; descEl.classList.remove('hidden'); }
    document.getElementById('seg-stats').innerHTML = renderStatsGrid(data.stats);
  } catch (e) {
    showError('seg-stats', `Error: ${e.message}`);
  } finally {
    ProgressOverlay.hide();
  }
}

// ── TAB 4: OBJECT DETECTION ──────────────────────────────────────────────────

function renderDetectionTab() {
  return `
    <div style="display:grid;grid-template-columns:300px 1fr;gap:1.5rem;align-items:start">
      <div style="display:flex;flex-direction:column;gap:1rem">
        ${renderUploadZone('det', 'image/*', 'Upload Image for Detection')}
        <div class="glass-card no-hover" style="padding:1rem">
          <div class="control-label" style="margin-bottom:.5rem">YOLOv8n Settings</div>
          <div class="alert alert-info" style="padding:.6rem .75rem;font-size:.78rem;margin-bottom:.75rem">
            <span class="alert-icon">ℹ️</span>
            <div>Model auto-downloads ~6MB on first use. Ensure internet access.</div>
          </div>
          <div class="controls-grid" style="grid-template-columns:1fr">
            <div class="control-group range-wrap">
              <div class="range-header">
                <label class="control-label">Confidence Threshold</label>
                <span class="range-value" id="det-conf-val">0.40</span>
              </div>
              <input type="range" id="det-conf" min="0.1" max="0.9" step="0.05" value="0.40"
                oninput="document.getElementById('det-conf-val').textContent=parseFloat(this.value).toFixed(2)">
            </div>
            <div class="control-group range-wrap">
              <div class="range-header">
                <label class="control-label">IoU Threshold (NMS)</label>
                <span class="range-value" id="det-iou-val">0.50</span>
              </div>
              <input type="range" id="det-iou" min="0.1" max="0.9" step="0.05" value="0.50"
                oninput="document.getElementById('det-iou-val').textContent=parseFloat(this.value).toFixed(2)">
            </div>
          </div>
          <button class="btn btn-primary w-full mt-4" onclick="runDetection()">🎯 Detect Objects</button>
        </div>
      </div>

      <div>
        <div class="split-view">
          <div class="split-panel">
            <div class="split-panel-label">Original</div>
            <div class="result-img-wrap">
              <div class="result-img-placeholder" id="det-left-ph"><span>🖼️</span>Upload image</div>
              <img id="det-orig" style="display:none;width:100%" alt="orig">
            </div>
          </div>
          <div class="split-panel">
            <div class="split-panel-label">YOLOv8 Detections</div>
            <div class="result-img-wrap">
              <div class="result-img-placeholder" id="det-right-ph"><span>🎯</span>Detections appear here</div>
              <img id="det-result" style="display:none;width:100%" alt="result">
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div id="det-summary" class="hidden mt-6">
          <div class="flex items-center justify-between mb-4">
            <h3 style="font-size:1rem;font-weight:700;color:var(--text-primary)">
              Detection Summary
            </h3>
            <span class="badge badge-accent" id="det-total-badge">0 objects</span>
          </div>
          <div id="det-tags" class="detection-tags"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1.5rem">
            <div>
              <div class="chart-title">Objects by Category</div>
              <div class="chart-wrap"><canvas id="det-donut-chart"></canvas></div>
            </div>
            <div id="det-stats-grid"></div>
          </div>
          <div id="det-desc" class="desc-box"></div>
        </div>
      </div>
    </div>`;
}

async function runDetection() {
  const input = document.getElementById('det-input');
  if (!input?.files[0]) { alert('Please upload an image first.'); return; }
  const conf = parseFloat(document.getElementById('det-conf').value);
  const iou  = parseFloat(document.getElementById('det-iou').value);
  ProgressOverlay.show('Running YOLOv8…', 'Detecting objects in image');
  try {
    const data = await apiImageDetect(input.files[0], conf, iou);

    document.getElementById('det-orig').src = data.original_image;
    document.getElementById('det-orig').style.display = 'block';
    document.getElementById('det-result').src = data.annotated_image;
    document.getElementById('det-result').style.display = 'block';
    document.getElementById('det-left-ph').style.display = 'none';
    document.getElementById('det-right-ph').style.display = 'none';

    const sum = data.summary;
    document.getElementById('det-summary').classList.remove('hidden');
    document.getElementById('det-total-badge').textContent = `${sum.total} object${sum.total !== 1 ? 's' : ''} detected`;

    // Category tags
    const tagsEl = document.getElementById('det-tags');
    tagsEl.innerHTML = Object.entries(sum.by_category).map(([label, count]) => `
      <div class="detection-tag">
        ${label} <span class="tag-count">${count}</span>
      </div>`).join('');

    // Stats
    document.getElementById('det-stats-grid').innerHTML = renderStatsGrid({
      'Total Objects': sum.total,
      'Unique Classes': Object.keys(sum.by_category).length,
      'Conf Threshold': conf.toFixed(2),
      'IoU Threshold': iou.toFixed(2),
    });

    // Donut chart
    if (Object.keys(sum.by_category).length > 0) {
      setTimeout(() => Dashboard.renderDetectionDonut('det-donut-chart', sum.by_category), 50);
    }

    document.getElementById('det-desc').textContent = data.description;
  } catch (e) {
    showError('det-summary', `Error: ${e.message}`);
  } finally {
    ProgressOverlay.hide();
  }
}

// Initialize feature params on page load
setTimeout(() => {
  selectFeature('canny');
  selectSegMethod('kmeans');
}, 100);
