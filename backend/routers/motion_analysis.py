"""
motion_analysis.py — Module 7: Background Subtraction & Optical Flow
POST /api/video/motion
"""
import os
import tempfile
import cv2
import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from services.cv_utils import encode_image_to_base64, resize_for_display

router = APIRouter()


def _draw_sparse_flow(frame: np.ndarray, prev_pts: np.ndarray,
                      curr_pts: np.ndarray, status: np.ndarray) -> np.ndarray:
    """Draw Lucas-Kanade sparse optical flow arrows on frame."""
    result = frame.copy()
    for i, (new, old) in enumerate(zip(curr_pts, prev_pts)):
        if status[i]:
            a, b = new.ravel().astype(int)
            c, d = old.ravel().astype(int)
            mag = np.hypot(a - c, b - d)
            color_intensity = int(min(255, mag * 5))
            color = (0, color_intensity, 255 - color_intensity)
            cv2.arrowedLine(result, (c, d), (a, b), color, 2, tipLength=0.3)
            cv2.circle(result, (a, b), 3, (0, 255, 0), -1)
    return result


def _flow_to_hsv(flow: np.ndarray) -> np.ndarray:
    """Convert dense optical flow (H×W×2) to HSV visualization."""
    h, w = flow.shape[:2]
    hsv = np.zeros((h, w, 3), dtype=np.uint8)
    hsv[..., 1] = 255
    mag, ang = cv2.cartToPolar(flow[..., 0], flow[..., 1])
    hsv[..., 0] = ang * 180 / np.pi / 2
    hsv[..., 2] = cv2.normalize(mag, None, 0, 255, cv2.NORM_MINMAX)
    return cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)


@router.post("/motion")
async def analyze_motion(
    file: UploadFile = File(...),
    method: str = Form("optical_flow_dense"),
    frame_step: int = Form(3),
    max_output_frames: int = Form(6),
    bg_history: int = Form(200),
    bg_threshold: float = Form(16.0),
):
    """
    Perform motion analysis on a video using background subtraction or optical flow.

    method options:
      - optical_flow_dense  : Farneback dense optical flow
      - optical_flow_sparse : Lucas-Kanade sparse optical flow (KLT)
      - background_sub_mog2 : MOG2 Gaussian Mixture background subtraction
      - background_sub_knn  : KNN background subtraction
    """
    contents = await file.read()
    suffix = os.path.splitext(file.filename or "video.mp4")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        cap = cv2.VideoCapture(tmp_path)
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Cannot open video file.")

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        frame_step = max(1, frame_step)

        output_frames_b64 = []
        magnitudes = []
        motion_direction_bins = np.zeros(8, dtype=np.float64)  # 8 direction bins
        active_region_counts = []

        # ── Background Subtraction ───────────────────────────────────────────
        if method.startswith("background_sub"):
            alg = method.split("_")[-1].upper()
            if alg == "MOG2":
                subtractor = cv2.createBackgroundSubtractorMOG2(
                    history=bg_history, varThreshold=bg_threshold, detectShadows=True
                )
            else:
                subtractor = cv2.createBackgroundSubtractorKNN(
                    history=bg_history, dist2Threshold=bg_threshold * 25, detectShadows=True
                )

            frame_idx = 0
            output_count = 0
            output_interval = max(1, total_frames // (frame_step * max(max_output_frames, 1)))

            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                if frame_idx % frame_step != 0:
                    frame_idx += 1
                    continue

                small = resize_for_display(frame, max_dim=640)
                fg_mask = subtractor.apply(small)
                # Remove shadows (shadow pixels = 127)
                _, fg_binary = cv2.threshold(fg_mask, 200, 255, cv2.THRESH_BINARY)
                kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
                fg_clean = cv2.morphologyEx(fg_binary, cv2.MORPH_OPEN, kernel)
                fg_clean = cv2.dilate(fg_clean, kernel, iterations=2)

                moving_pixels = int(np.sum(fg_clean > 0))
                magnitudes.append(moving_pixels / fg_clean.size)
                active_region_counts.append(moving_pixels)

                # Colour overlay
                vis = small.copy()
                vis[fg_clean > 0] = cv2.addWeighted(
                    small, 0.3,
                    np.full_like(small, [0, 80, 255]), 0.7, 0
                )[fg_clean > 0]
                contours, _ = cv2.findContours(fg_clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                for cnt in contours:
                    if cv2.contourArea(cnt) > 300:
                        x, y, w, h = cv2.boundingRect(cnt)
                        cv2.rectangle(vis, (x, y), (x+w, y+h), (0, 255, 100), 2)

                if output_count < max_output_frames and frame_idx % (output_interval * frame_step) == 0:
                    cv2.putText(vis, f"Frame {frame_idx} | Moving: {moving_pixels}px",
                                (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
                    output_frames_b64.append(encode_image_to_base64(vis))
                    output_count += 1

                frame_idx += 1

        # ── Dense Optical Flow (Farneback) ───────────────────────────────────
        elif method == "optical_flow_dense":
            prev_gray = None
            frame_idx = 0
            output_count = 0
            output_interval = max(1, total_frames // (frame_step * max(max_output_frames, 1)))

            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                if frame_idx % frame_step != 0:
                    frame_idx += 1
                    continue

                small = resize_for_display(frame, max_dim=640)
                gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)

                if prev_gray is not None:
                    flow = cv2.calcOpticalFlowFarneback(
                        prev_gray, gray, None,
                        0.5, 3, 15, 3, 5, 1.2, 0
                    )
                    mag, ang = cv2.cartToPolar(flow[..., 0], flow[..., 1])
                    mean_mag = float(mag.mean())
                    magnitudes.append(mean_mag)

                    # Direction histogram (8 bins × 45°)
                    ang_degrees = ang * 180 / np.pi
                    bin_edges = np.linspace(0, 360, 9)
                    hist, _ = np.histogram(ang_degrees[mag > 1.0], bins=bin_edges)
                    motion_direction_bins += hist.astype(np.float64)

                    active = int(np.sum(mag > 2.0))
                    active_region_counts.append(active)

                    flow_vis = _flow_to_hsv(flow)
                    # Blend
                    blend = cv2.addWeighted(small, 0.5, flow_vis, 0.5, 0)

                    if output_count < max_output_frames and frame_idx % (output_interval * frame_step) == 0:
                        cv2.putText(blend, f"Frame {frame_idx} | Mag: {mean_mag:.2f}",
                                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
                        output_frames_b64.append(encode_image_to_base64(blend))
                        output_count += 1

                prev_gray = gray
                frame_idx += 1

        # ── Sparse Optical Flow (Lucas-Kanade / KLT) ─────────────────────────
        elif method == "optical_flow_sparse":
            lk_params = dict(
                winSize=(21, 21),
                maxLevel=3,
                criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 30, 0.01)
            )
            feat_params = dict(maxCorners=200, qualityLevel=0.3, minDistance=7, blockSize=7)

            prev_gray = None
            prev_pts = None
            frame_idx = 0
            output_count = 0
            output_interval = max(1, total_frames // (frame_step * max(max_output_frames, 1)))

            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                if frame_idx % frame_step != 0:
                    frame_idx += 1
                    continue

                small = resize_for_display(frame, max_dim=640)
                gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)

                if prev_gray is None:
                    prev_gray = gray
                    prev_pts = cv2.goodFeaturesToTrack(prev_gray, mask=None, **feat_params)
                    frame_idx += 1
                    continue

                if prev_pts is None or len(prev_pts) < 5:
                    prev_pts = cv2.goodFeaturesToTrack(prev_gray, mask=None, **feat_params)

                if prev_pts is not None and len(prev_pts) > 0:
                    curr_pts, status, _ = cv2.calcOpticalFlowPyrLK(
                        prev_gray, gray, prev_pts, None, **lk_params
                    )
                    good_new = curr_pts[status == 1]
                    good_old = prev_pts[status == 1]

                    vis = _draw_sparse_flow(small, good_old, good_new, status.ravel())

                    if len(good_new) > 0:
                        displacements = np.linalg.norm(good_new - good_old, axis=1)
                        mean_mag = float(displacements.mean())
                        magnitudes.append(mean_mag)
                        active_region_counts.append(int(np.sum(displacements > 2.0)))
                        # Directions
                        diffs = good_new - good_old
                        angles = np.arctan2(diffs[:, 1], diffs[:, 0]) * 180 / np.pi % 360
                        hist, _ = np.histogram(angles[displacements > 1.0], bins=np.linspace(0, 360, 9))
                        motion_direction_bins += hist.astype(np.float64)

                    # Re-detect features periodically
                    if frame_idx % (frame_step * 10) == 0:
                        prev_pts = cv2.goodFeaturesToTrack(gray, mask=None, **feat_params)
                    else:
                        prev_pts = good_new.reshape(-1, 1, 2)

                    if output_count < max_output_frames and frame_idx % (output_interval * frame_step) == 0:
                        mean_d = magnitudes[-1] if magnitudes else 0
                        cv2.putText(vis, f"Frame {frame_idx} | Tracks: {len(good_new)} | Mag: {mean_d:.1f}",
                                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
                        output_frames_b64.append(encode_image_to_base64(vis))
                        output_count += 1

                    prev_gray = gray
                frame_idx += 1

        else:
            cap.release()
            raise HTTPException(status_code=400, detail=f"Unknown method: '{method}'")

        cap.release()

    finally:
        os.unlink(tmp_path)

    # Compute summary stats
    avg_mag = round(float(np.mean(magnitudes)) if magnitudes else 0.0, 4)
    max_mag = round(float(np.max(magnitudes)) if magnitudes else 0.0, 4)
    direction_labels = ["E", "NE", "N", "NW", "W", "SW", "S", "SE"]
    dominant_dir_idx = int(np.argmax(motion_direction_bins)) if motion_direction_bins.sum() > 0 else 0

    return {
        "motion_frames": output_frames_b64,
        "stats": {
            "method": method,
            "avg_motion_magnitude": avg_mag,
            "max_motion_magnitude": max_mag,
            "frames_analyzed": len(magnitudes),
            "total_frames": total_frames,
            "fps": round(fps, 2),
            "avg_active_pixels": round(float(np.mean(active_region_counts)) if active_region_counts else 0, 1),
            "dominant_direction": direction_labels[dominant_dir_idx],
        },
        "direction_histogram": {
            "labels": direction_labels,
            "data": motion_direction_bins.tolist(),
        },
        "magnitude_series": magnitudes[::max(1, len(magnitudes)//50)],  # downsample for chart
        "description": {
            "optical_flow_dense": (
                "Farneback Dense Optical Flow: Estimates a motion vector for every pixel between consecutive frames "
                "using polynomial expansion. Visualised as an HSV colour map (hue=direction, brightness=magnitude)."
            ),
            "optical_flow_sparse": (
                "Lucas-Kanade (KLT) Sparse Optical Flow: Tracks a sparse set of corner features "
                "(Shi-Tomasi) across frames using a pyramid-based iterative search. "
                "Shows motion as coloured arrows at feature points."
            ),
            "background_sub_mog2": (
                "MOG2 Background Subtraction: Models each pixel's history as a Mixture of Gaussians. "
                "Adapts dynamically to lighting changes. Foreground = pixels that do not fit any Gaussian component."
            ),
            "background_sub_knn": (
                "KNN Background Subtraction: Models background using K-Nearest Neighbours in feature space. "
                "More robust to illumination changes than MOG2 for some scenarios."
            ),
        }.get(method, ""),
    }
