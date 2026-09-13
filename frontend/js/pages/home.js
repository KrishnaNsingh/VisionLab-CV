/**
 * home.js — VisionLab Home Page
 */

function renderHome() {
  return `
    <div class="hero">
      <div class="hero-badge">👁 CSE3010 Computer Vision Project</div>
      <h1>VisionLab</h1>
      <p>
        An intelligent, full-featured Computer Vision platform. Apply classical CV algorithms,
        deep learning object detection, multi-object tracking, and motion analysis — all from your browser.
      </p>
      <div class="hero-actions">
        <button class="btn btn-primary btn-lg" onclick="navigate('image')">
          🖼️ Image Analysis
        </button>
        <button class="btn btn-secondary btn-lg" onclick="navigate('video')">
          🎬 Video Analysis
        </button>
      </div>
    </div>

    <!-- Mode Selection Cards -->
    <div class="mode-cards">
      <div class="mode-card mode-card-image glass-card" onclick="navigate('image')" style="cursor:pointer">
        <span class="mode-card-icon" style="color:var(--accent)">🖼️</span>
        <h2 style="color:var(--accent)">Image Analysis</h2>
        <p>Upload any image and apply a complete pipeline of Computer Vision algorithms — from basic preprocessing to advanced feature extraction and segmentation.</p>
        <ul class="mode-card-features">
          <li>Image Preprocessing &amp; Enhancement (11 operations)</li>
          <li>Edge &amp; Feature Analysis — Canny, SIFT, HOG, Harris</li>
          <li>Segmentation — K-Means, Mean Shift, Region Growing</li>
          <li>YOLOv8 Object Detection with category summary</li>
        </ul>
        <button class="btn btn-primary w-full" onclick="navigate('image')">
          Start Image Analysis →
        </button>
      </div>

      <div class="mode-card mode-card-video glass-card" onclick="navigate('video')" style="cursor:pointer">
        <span class="mode-card-icon" style="color:var(--accent2)">🎬</span>
        <h2 style="color:var(--accent2)">Video Analysis</h2>
        <p>Upload a video for frame-by-frame analysis. Track objects across time with ByteTrack, visualize optical flow, and quantify motion in the scene.</p>
        <ul class="mode-card-features">
          <li>Video metadata, FPS, resolution &amp; keyframe extraction</li>
          <li>YOLOv8 + ByteTrack multi-object tracking</li>
          <li>Farneback Dense Optical Flow (HSV visualization)</li>
          <li>Lucas-Kanade Sparse KLT + Background Subtraction (MOG2)</li>
        </ul>
        <button class="btn btn-secondary w-full" onclick="navigate('video')">
          Start Video Analysis →
        </button>
      </div>
    </div>

    <!-- CV Topics Covered -->
    <h2 class="section-heading">CSE3010 Topics Covered</h2>
    <div class="features-grid">
      <div class="feature-item">
        <span class="feature-item-icon">🌫️</span>
        <div>
          <h3>Filtering &amp; Convolution</h3>
          <p>Gaussian blur, median filter, sharpening via Laplacian kernel convolution</p>
        </div>
      </div>
      <div class="feature-item">
        <span class="feature-item-icon">📊</span>
        <div>
          <h3>Histogram Processing</h3>
          <p>Intensity distribution analysis, Otsu thresholding, histogram equalization</p>
        </div>
      </div>
      <div class="feature-item">
        <span class="feature-item-icon">🔍</span>
        <div>
          <h3>Edge Detection</h3>
          <p>Canny, Sobel, Laplacian, LoG — all classical first/second order operators</p>
        </div>
      </div>
      <div class="feature-item">
        <span class="feature-item-icon">📐</span>
        <div>
          <h3>Hough Transform</h3>
          <p>Probabilistic Hough line detection via parameter-space voting</p>
        </div>
      </div>
      <div class="feature-item">
        <span class="feature-item-icon">📍</span>
        <div>
          <h3>Harris Corner Detection</h3>
          <p>Eigenvalue-based interest point detector; rotation invariant</p>
        </div>
      </div>
      <div class="feature-item">
        <span class="feature-item-icon">🔑</span>
        <div>
          <h3>SIFT</h3>
          <p>Scale-space DoG extrema, 128-dim descriptors; scale &amp; rotation invariant</p>
        </div>
      </div>
      <div class="feature-item">
        <span class="feature-item-icon">🕺</span>
        <div>
          <h3>HOG Features</h3>
          <p>Histogram of Oriented Gradients — the backbone of classical pedestrian detection</p>
        </div>
      </div>
      <div class="feature-item">
        <span class="feature-item-icon">🎭</span>
        <div>
          <h3>Image Segmentation</h3>
          <p>K-Means, Mean Shift, Region Growing, Edge-based, Threshold segmentation</p>
        </div>
      </div>
      <div class="feature-item">
        <span class="feature-item-icon">🎯</span>
        <div>
          <h3>YOLOv8 Detection</h3>
          <p>Single-shot deep learning detector with NMS; 80-class COCO detection</p>
        </div>
      </div>
      <div class="feature-item">
        <span class="feature-item-icon">📡</span>
        <div>
          <h3>Object Tracking</h3>
          <p>ByteTrack multi-object tracker — persistent IDs across video frames</p>
        </div>
      </div>
      <div class="feature-item">
        <span class="feature-item-icon">〰️</span>
        <div>
          <h3>Optical Flow</h3>
          <p>Farneback dense flow &amp; Lucas-Kanade sparse KLT tracker</p>
        </div>
      </div>
      <div class="feature-item">
        <span class="feature-item-icon">🌑</span>
        <div>
          <h3>Background Subtraction</h3>
          <p>MOG2 Gaussian Mixture &amp; KNN adaptive background models</p>
        </div>
      </div>
    </div>

    <!-- API Status -->
    <div class="glass-card no-hover mt-8" style="display:flex;align-items:center;gap:1rem;padding:1rem 1.5rem;">
      <div id="api-status-dot" style="width:10px;height:10px;border-radius:50%;background:var(--text-muted);flex-shrink:0;transition:background .3s;"></div>
      <div>
        <div style="font-size:.85rem;font-weight:600;color:var(--text-secondary)">Backend API</div>
        <div id="api-status-text" style="font-size:.75rem;color:var(--text-muted);">Checking connection…</div>
      </div>
      <div style="margin-left:auto">
        <a href="http://localhost:8000/api/docs" target="_blank" class="btn btn-ghost" style="font-size:.8rem;">
          View API Docs ↗
        </a>
      </div>
    </div>
  `;
}

async function initHome() {
  // Check API status
  try {
    const data = await apiHealth();
    const dot = document.getElementById('api-status-dot');
    const txt = document.getElementById('api-status-text');
    if (data.status === 'ok') {
      dot.style.background = 'var(--success)';
      dot.style.boxShadow = '0 0 8px var(--success)';
      txt.textContent = `Connected — ${data.service} v${data.version}`;
    }
  } catch {
    const dot = document.getElementById('api-status-dot');
    const txt = document.getElementById('api-status-text');
    dot.style.background = 'var(--danger)';
    txt.textContent = 'Cannot reach backend. Start the server with start.bat';
  }
}
