/**
 * api.js — VisionLab API Communication Layer
 */

const API_BASE = 'http://localhost:8000/api';

/** Generic POST with FormData. Returns parsed JSON or throws with a message. */
async function apiPost(endpoint, formData) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

/** Health check */
async function apiHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

// ── Image endpoints ──────────────────────────────────────────────────────────

async function apiImageProcess(file, operation, params = {}) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('operation', operation);
  fd.append('params', JSON.stringify(params));
  return apiPost('/image/process', fd);
}

async function apiImageFeatures(file, feature, params = {}) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('feature', feature);
  fd.append('params', JSON.stringify(params));
  return apiPost('/image/features', fd);
}

async function apiImageSegment(file, method, params = {}) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('method', method);
  fd.append('params', JSON.stringify(params));
  return apiPost('/image/segment', fd);
}

async function apiImageDetect(file, conf = 0.4, iou = 0.5) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('conf', conf.toString());
  fd.append('iou', iou.toString());
  return apiPost('/image/detect', fd);
}

// ── Video endpoints ──────────────────────────────────────────────────────────

async function apiVideoInfo(file, numKeyframes = 8) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('num_keyframes', numKeyframes.toString());
  return apiPost('/video/info', fd);
}

async function apiVideoDetect(file, params = {}) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('conf', (params.conf || 0.35).toString());
  fd.append('iou', (params.iou || 0.45).toString());
  fd.append('frame_step', (params.frame_step || 5).toString());
  fd.append('max_output_frames', (params.max_output_frames || 6).toString());
  return apiPost('/video/detect', fd);
}

async function apiVideoMotion(file, params = {}) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('method', params.method || 'optical_flow_dense');
  fd.append('frame_step', (params.frame_step || 3).toString());
  fd.append('max_output_frames', (params.max_output_frames || 6).toString());
  return apiPost('/video/motion', fd);
}
