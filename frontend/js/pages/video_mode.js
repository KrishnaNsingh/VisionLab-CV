/**
 * video_mode.js — Video Analysis Page (Modules 5–7)
 * Tabs: Video Info | Detection & Tracking | Motion Analysis
 */

// ── Page render ──────────────────────────────────────────────────────────────

function renderVideoMode(initialTab = 'info') {
  const tabs = [
    { id: 'info',     label: '📋 Video Info',           mod: '5' },
    { id: 'tracking', label: '📡 Detection & Tracking', mod: '6' },
    { id: 'motion',   label: '〰️ Motion Analysis',      mod: '7' },
  ];

  return `
    <div class="page-header">
      <h1>Video Analysis</h1>
      <p>Upload a video for frame-by-frame Computer Vision analysis — object tracking, optical flow, and motion estimation.</p>
    </div>

    <div class="tabs-wrap">
      ${tabs.map(t => `
        <button class="tab-btn ${t.id === initialTab ? 'active' : ''}"
          id="vtab-btn-${t.id}"
          onclick="switchVideoTab('${t.id}')">
          ${t.label} <span class="badge badge-purple" style="font-size:.6rem">M${t.mod}</span>
        </button>`).join('')}
    </div>

    <div id="vtab-info"     class="tab-panel ${initialTab==='info'    ?'active':''}">
      ${renderVideoInfoTab()}
    </div>
    <div id="vtab-tracking" class="tab-panel ${initialTab==='tracking'?'active':''}">
      ${renderVideoTrackingTab()}
    </div>
    <div id="vtab-motion"   class="tab-panel ${initialTab==='motion'  ?'active':''}">
      ${renderVideoMotionTab()}
    </div>
  `;
}

function switchVideoTab(tabId) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`vtab-${tabId}`).classList.add('active');
  document.getElementById(`vtab-btn-${tabId}`).classList.add('active');
}

// ── Shared video upload helpers ──────────────────────────────────────────────

function renderVideoUploadZone(id) {
  return `
    <div class="upload-zone" id="${id}-zone">
      <input type="file" id="${id}-input" accept="video/*"
        onchange="handleVideoUploadChange('${id}')">
      <div class="upload-icon">🎬</div>
      <div class="upload-title">Upload Video</div>
      <div class="upload-sub">Drag &amp; drop or click to browse · MP4, AVI, MOV, MKV</div>
      <div class="upload-preview" id="${id}-preview" style="display:none">
        <video id="${id}-vid" controls
          style="max-height:160px;border-radius:8px;border:1px solid var(--glass-border);max-width:100%"></video>
        <div class="upload-preview-name" id="${id}-name"></div>
      </div>
    </div>`;
}

function handleVideoUploadChange(id) {
  const input = document.getElementById(`${id}-input`);
  if (!input.files[0]) return;
  const url = URL.createObjectURL(input.files[0]);
  const vid  = document.getElementById(`${id}-vid`);
  const name = document.getElementById(`${id}-name`);
  const prev = document.getElementById(`${id}-preview`);
  if (vid) vid.src = url;
  if (name) name.textContent = input.files[0].name + ` (${(input.files[0].size / 1024 / 1024).toFixed(1)} MB)`;
  if (prev) prev.style.display = 'block';
}

// ── TAB 5: VIDEO INFO ────────────────────────────────────────────────────────

function renderVideoInfoTab() {
  return `
    <div style="display:grid;grid-template-columns:300px 1fr;gap:1.5rem;align-items:start">
      <div style="display:flex;flex-direction:column;gap:1rem">
        ${renderVideoUploadZone('vinfo')}
        <div class="glass-card no-hover" style="padding:1rem">
          <div class="control-group range-wrap">
            <div class="range-header">
              <label class="control-label">Keyframes to Extract</label>
              <span class="range-value" id="vinfo-kf-val">8</span>
            </div>
            <input type="range" id="vinfo-kf" min="4" max="16" step="2" value="8"
              oninput="document.getElementById('vinfo-kf-val').textContent=this.value">
          </div>
          <button class="btn btn-primary w-full mt-4" onclick="runVideoInfo()">📋 Extract Info</button>
        </div>
      </div>

      <div>
        <!-- Metadata cards -->
        <div id="vinfo-meta-area" class="hidden">
          <h3 class="section-heading">Video Metadata</h3>
          <div id="vinfo-stats-grid" class="stats-grid"></div>
          <h3 class="section-heading mt-6">Keyframe Strip</h3>
          <div class="keyframe-strip" id="vinfo-keyframe-strip"></div>
          <div class="desc-box mt-4">
            Keyframes are extracted at evenly-spaced intervals. They provide a visual summary
            of the video content and help assess scene complexity before running heavier analysis.
          </div>
        </div>
        <div id="vinfo-placeholder" class="result-img-placeholder" style="min-height:300px">
          <span>🎬</span>Upload a video and click Extract Info
        </div>
      </div>
    </div>`;
}

async function runVideoInfo() {
  const input = document.getElementById('vinfo-input');
  if (!input?.files[0]) { alert('Please upload a video first.'); return; }
  const kf = parseInt(document.getElementById('vinfo-kf').value);
  ProgressOverlay.show('Extracting video info…', 'Reading metadata and sampling keyframes');
  try {
    const data = await apiVideoInfo(input.files[0], kf);

    document.getElementById('vinfo-placeholder').style.display = 'none';
    document.getElementById('vinfo-meta-area').classList.remove('hidden');

    // Stats grid
    const mins = Math.floor(data.duration_seconds / 60);
    const secs = (data.duration_seconds % 60).toFixed(1);
    document.getElementById('vinfo-stats-grid').innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Resolution</div>
        <div class="stat-value" style="font-size:1rem">${data.resolution.width}×${data.resolution.height}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Frame Rate</div>
        <div class="stat-value">${data.fps}</div>
        <div class="stat-unit">fps</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Duration</div>
        <div class="stat-value" style="font-size:1rem">${mins}m ${secs}s</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Frames</div>
        <div class="stat-value">${data.total_frames.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">File Size</div>
        <div class="stat-value">${data.file_size_mb}</div>
        <div class="stat-unit">MB</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Keyframes</div>
        <div class="stat-value">${data.keyframes.length}</div>
      </div>
    `;

    // Keyframe strip
    const strip = document.getElementById('vinfo-keyframe-strip');
    strip.innerHTML = data.keyframes.map((b64, i) => `
      <div class="keyframe-item">
        <img class="keyframe-img" src="${b64}" alt="Frame ${data.keyframe_indices[i]}"
          title="Frame ${data.keyframe_indices[i]}">
        <span class="keyframe-label">f${data.keyframe_indices[i]}</span>
      </div>`).join('');

  } catch (e) {
    document.getElementById('vinfo-placeholder').innerHTML =
      `<span>⚠️</span>${e.message}`;
  } finally {
    ProgressOverlay.hide();
  }
}

// ── TAB 6: VIDEO DETECTION & TRACKING ───────────────────────────────────────

function renderVideoTrackingTab() {
  return `
    <div style="display:grid;grid-template-columns:300px 1fr;gap:1.5rem;align-items:start">
      <div style="display:flex;flex-direction:column;gap:1rem">
        ${renderVideoUploadZone('vtrack')}
        <div class="glass-card no-hover" style="padding:1rem">
          <div class="alert alert-info" style="padding:.6rem .75rem;font-size:.78rem;margin-bottom:.75rem">
            <span class="alert-icon">📡</span>
            <div>Uses YOLOv8n + ByteTrack. Processing time depends on video length and frame step.</div>
          </div>
          <div class="controls-grid" style="grid-template-columns:1fr">
            <div class="control-group range-wrap">
              <div class="range-header">
                <label class="control-label">Detection Confidence</label>
                <span class="range-value" id="vt-conf-val">0.35</span>
              </div>
              <input type="range" id="vt-conf" min="0.1" max="0.9" step="0.05" value="0.35"
                oninput="document.getElementById('vt-conf-val').textContent=parseFloat(this.value).toFixed(2)">
            </div>
            <div class="control-group range-wrap">
              <div class="range-header">
                <label class="control-label">Frame Step (speed vs accuracy)</label>
                <span class="range-value" id="vt-step-val">5</span>
              </div>
              <input type="range" id="vt-step" min="1" max="30" step="1" value="5"
                oninput="document.getElementById('vt-step-val').textContent=this.value">
            </div>
          </div>
          <button class="btn btn-primary w-full mt-4" onclick="runVideoTracking()">📡 Track Objects</button>
        </div>
      </div>

      <div>
        <div id="vtrack-placeholder" class="result-img-placeholder" style="min-height:250px">
          <span>📡</span>Upload a video and click Track Objects
        </div>

        <div id="vtrack-results" class="hidden">
          <!-- Summary cards -->
          <div id="vtrack-summary-grid" class="stats-grid"></div>

          <!-- Annotated frames grid -->
          <h3 class="section-heading mt-6">Annotated Sample Frames</h3>
          <div class="video-frames-grid" id="vtrack-frames-grid"></div>

          <!-- Charts row -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:1.5rem">
            <div>
              <div class="chart-title">Objects by Category</div>
              <div class="chart-wrap"><canvas id="vtrack-bar-chart"></canvas></div>
            </div>
            <div>
              <div class="chart-title">Tracked Object List</div>
              <div class="tracking-table-wrap" id="vtrack-table-wrap">
                <table class="tracking-table" id="vtrack-table">
                  <thead>
                    <tr>
                      <th>Track ID</th>
                      <th>Class</th>
                      <th>Max Confidence</th>
                    </tr>
                  </thead>
                  <tbody id="vtrack-tbody"></tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="desc-box mt-4" id="vtrack-desc"></div>
        </div>
      </div>
    </div>`;
}

async function runVideoTracking() {
  const input = document.getElementById('vtrack-input');
  if (!input?.files[0]) { alert('Please upload a video first.'); return; }
  const conf = parseFloat(document.getElementById('vt-conf').value);
  const step = parseInt(document.getElementById('vt-step').value);
  ProgressOverlay.show('Running YOLOv8 + ByteTrack…',
    `Processing every ${step}th frame — this may take a minute`);
  try {
    const data = await apiVideoDetect(input.files[0], {
      conf, frame_step: step, max_output_frames: 6
    });

    document.getElementById('vtrack-placeholder').style.display = 'none';
    document.getElementById('vtrack-results').classList.remove('hidden');

    const ts = data.tracking_summary;
    document.getElementById('vtrack-summary-grid').innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Unique Objects</div>
        <div class="stat-value">${ts.unique_objects}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Frames Processed</div>
        <div class="stat-value">${ts.frames_processed.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Frames</div>
        <div class="stat-value">${ts.total_frames.toLocaleString()}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Frame Step</div>
        <div class="stat-value">${ts.frame_step}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Video FPS</div>
        <div class="stat-value">${ts.fps}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Categories</div>
        <div class="stat-value">${Object.keys(ts.by_category).length}</div>
      </div>
    `;

    // Sample frames
    const framesGrid = document.getElementById('vtrack-frames-grid');
    framesGrid.innerHTML = data.sample_frames.map((b64, i) => `
      <div class="video-frame-card">
        <img src="${b64}" alt="Frame ${i+1}">
        <div class="video-frame-label">Sample Frame ${i + 1}</div>
      </div>`).join('');

    // Category bar chart
    if (Object.keys(ts.by_category).length > 0) {
      setTimeout(() => Dashboard.renderCategoryBar('vtrack-bar-chart', ts.by_category), 50);
    }

    // Tracking table
    const tbody = document.getElementById('vtrack-tbody');
    tbody.innerHTML = data.track_list.map(t => `
      <tr>
        <td><span class="track-id-badge">#${t.track_id}</span></td>
        <td>${t.label}</td>
        <td>
          <div class="conf-bar-wrap">
            <div class="conf-bar" style="width:${Math.round(t.max_conf*100)}px"></div>
            <span class="conf-val">${(t.max_conf * 100).toFixed(1)}%</span>
          </div>
        </td>
      </tr>`).join('');

    document.getElementById('vtrack-desc').textContent = data.description;
  } catch (e) {
    document.getElementById('vtrack-placeholder').style.display = 'flex';
    document.getElementById('vtrack-placeholder').innerHTML = `<span>⚠️</span>${e.message}`;
  } finally {
    ProgressOverlay.hide();
  }
}

// ── TAB 7: MOTION ANALYSIS ──────────────────────────────────────────────────

const MOTION_METHODS = [
  {
    id: 'optical_flow_dense',
    label: 'Dense Optical Flow',
    icon: '🌊',
    badge: 'Farneback',
    desc: 'Computes a motion vector for EVERY pixel. Visualised as HSV colour map (hue = direction, brightness = speed).'
  },
  {
    id: 'optical_flow_sparse',
    label: 'Sparse Optical Flow',
    icon: '➡️',
    badge: 'Lucas-Kanade',
    desc: 'Tracks sparse Shi-Tomasi corner features across frames using pyramid-based KLT tracker. Shows arrows at tracked points.'
  },
  {
    id: 'background_sub_mog2',
    label: 'Background Subtraction',
    icon: '🌑',
    badge: 'MOG2',
    desc: 'Models background as a Mixture of Gaussians per pixel. Highlights foreground moving objects in real-time.'
  },
  {
    id: 'background_sub_knn',
    label: 'Background Subtraction',
    icon: '🤖',
    badge: 'KNN',
    desc: 'K-Nearest Neighbour background model. More robust to gradual illumination changes than MOG2.'
  },
];

function renderVideoMotionTab() {
  return `
    <div style="display:grid;grid-template-columns:300px 1fr;gap:1.5rem;align-items:start">
      <div style="display:flex;flex-direction:column;gap:1rem">
        ${renderVideoUploadZone('vmot')}
        <div class="glass-card no-hover" style="padding:1rem">
          <div class="control-label" style="margin-bottom:.75rem">Analysis Method</div>
          <div style="display:flex;flex-direction:column;gap:.5rem;margin-bottom:.75rem">
            ${MOTION_METHODS.map((m, i) => `
              <button class="op-card ${i===0?'selected':''}" id="mot-${m.id}"
                style="flex-direction:row;justify-content:flex-start;padding:.6rem .75rem;text-align:left"
                onclick="selectMotionMethod('${m.id}')">
                <span class="op-card-icon">${m.icon}</span>
                <span class="op-card-label">${m.label}</span>
                <span class="badge badge-accent" style="margin-left:auto;font-size:.6rem;flex-shrink:0">${m.badge}</span>
              </button>`).join('')}
          </div>
          <div class="control-group range-wrap">
            <div class="range-header">
              <label class="control-label">Frame Step</label>
              <span class="range-value" id="vmot-step-val">3</span>
            </div>
            <input type="range" id="vmot-step" min="1" max="15" step="1" value="3"
              oninput="document.getElementById('vmot-step-val').textContent=this.value">
          </div>
          <button class="btn btn-primary w-full mt-4" onclick="runMotionAnalysis()">〰️ Analyze Motion</button>
        </div>
      </div>

      <div>
        <div id="vmot-placeholder" class="result-img-placeholder" style="min-height:250px">
          <span>〰️</span>Upload a video and click Analyze Motion
        </div>

        <div id="vmot-results" class="hidden">
          <!-- Summary stats -->
          <div id="vmot-stats-grid" class="stats-grid"></div>

          <!-- Motion frames -->
          <h3 class="section-heading mt-6">Motion Visualization Frames</h3>
          <div class="video-frames-grid" id="vmot-frames-grid"></div>

          <!-- Charts -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:1.5rem">
            <div>
              <div class="chart-title">Motion Direction Distribution</div>
              <div class="chart-wrap"><canvas id="vmot-polar-chart"></canvas></div>
            </div>
            <div>
              <div class="chart-title">Motion Magnitude Over Time</div>
              <div class="chart-wrap"><canvas id="vmot-line-chart"></canvas></div>
            </div>
          </div>

          <div class="desc-box mt-4" id="vmot-desc"></div>
        </div>
      </div>
    </div>`;
}

let _selectedMotion = 'optical_flow_dense';

function selectMotionMethod(methodId) {
  MOTION_METHODS.forEach(m => {
    const card = document.getElementById(`mot-${m.id}`);
    if (card) card.classList.remove('selected');
  });
  const card = document.getElementById(`mot-${methodId}`);
  if (card) card.classList.add('selected');
  _selectedMotion = methodId;
}

async function runMotionAnalysis() {
  const input = document.getElementById('vmot-input');
  if (!input?.files[0]) { alert('Please upload a video first.'); return; }
  const step = parseInt(document.getElementById('vmot-step').value);
  const methodInfo = MOTION_METHODS.find(m => m.id === _selectedMotion);
  ProgressOverlay.show('Analyzing motion…',
    `Method: ${methodInfo?.label || _selectedMotion}`);
  try {
    const data = await apiVideoMotion(input.files[0], {
      method: _selectedMotion, frame_step: step, max_output_frames: 6
    });

    document.getElementById('vmot-placeholder').style.display = 'none';
    document.getElementById('vmot-results').classList.remove('hidden');

    const st = data.stats;
    document.getElementById('vmot-stats-grid').innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Avg Magnitude</div>
        <div class="stat-value">${st.avg_motion_magnitude}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Max Magnitude</div>
        <div class="stat-value">${st.max_motion_magnitude}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Dominant Direction</div>
        <div class="stat-value" style="font-size:1.1rem">${st.dominant_direction}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Frames Analyzed</div>
        <div class="stat-value">${st.frames_analyzed}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg Active Pixels</div>
        <div class="stat-value">${st.avg_active_pixels}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Method</div>
        <div class="stat-value" style="font-size:.75rem;line-height:1.3">${st.method.replace(/_/g,' ')}</div>
      </div>
    `;

    // Motion frames
    const grid = document.getElementById('vmot-frames-grid');
    grid.innerHTML = data.motion_frames.map((b64, i) => `
      <div class="video-frame-card">
        <img src="${b64}" alt="Motion Frame ${i+1}">
        <div class="video-frame-label">Frame Sample ${i + 1}</div>
      </div>`).join('');

    // Charts
    setTimeout(() => {
      if (data.direction_histogram) {
        Dashboard.renderDirectionPolar('vmot-polar-chart', data.direction_histogram);
      }
      if (data.magnitude_series && data.magnitude_series.length > 1) {
        Dashboard.renderMagnitudeLine('vmot-line-chart', data.magnitude_series);
      }
    }, 50);

    document.getElementById('vmot-desc').textContent = data.description;
  } catch (e) {
    document.getElementById('vmot-placeholder').style.display = 'flex';
    document.getElementById('vmot-placeholder').innerHTML = `<span>⚠️</span>${e.message}`;
    document.getElementById('vmot-results').classList.add('hidden');
  } finally {
    ProgressOverlay.hide();
  }
}
