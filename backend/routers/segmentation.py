"""
segmentation.py — Module 3: Image Segmentation
POST /api/image/segment
"""
import json
import cv2
import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from services.cv_utils import (
    decode_upload, encode_image_to_base64, resize_for_display,
    ensure_bgr, to_grayscale
)

router = APIRouter()

DESCRIPTIONS = {
    "threshold": (
        "Threshold Segmentation: Separates foreground from background using a single intensity threshold (Otsu). "
        "The simplest and fastest segmentation method; works well when foreground and background have distinct intensity distributions."
    ),
    "kmeans": (
        "K-Means Segmentation: Clusters pixels in RGB colour space into K groups by minimising within-cluster variance. "
        "Each pixel is replaced by its cluster centroid colour, revealing dominant colour regions."
    ),
    "edge_based": (
        "Edge-Based Segmentation: Applies Canny edge detection to find boundaries, then uses morphological closing "
        "to connect gaps, followed by contour extraction. Identifies object boundaries in the image."
    ),
    "region_growing": (
        "Region Growing: Seeds a region from the image centre and expands it by adding neighbouring pixels "
        "with intensity within a tolerance threshold. Produces connected, homogeneous regions."
    ),
    "mean_shift": (
        "Mean Shift Segmentation: Iteratively shifts each pixel towards the mean of nearby pixels in joint "
        "spatial-colour space. Produces regions of spatially-coherent colour. No need to specify K."
    ),
}


def _random_color_map(n: int) -> list:
    """Generate n visually distinct BGR colours."""
    np.random.seed(42)
    colors = []
    for i in range(n):
        hue = int(i * 180 / n)
        hsv = np.uint8([[[hue, 220, 200]]])
        bgr = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)[0][0].tolist()
        colors.append(bgr)
    return colors


@router.post("/segment")
async def segment_image(
    file: UploadFile = File(...),
    method: str = Form("kmeans"),
    params: Optional[str] = Form(None),
):
    """Segment an uploaded image using the selected method."""
    contents = await file.read()
    img = decode_upload(contents)
    if img is None:
        raise HTTPException(status_code=400, detail="Cannot decode image.")

    p = json.loads(params) if params else {}
    display = resize_for_display(img.copy())
    original_b64 = encode_image_to_base64(display)

    stats: dict = {}
    segmented: np.ndarray
    mask: Optional[np.ndarray] = None

    # ── THRESHOLD ─────────────────────────────────────────────────────────────
    if method == "threshold":
        gray = to_grayscale(display)
        thresh_val, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        # Colour the binary result
        result = display.copy()
        result[thresh == 0] = [30, 30, 80]
        result[thresh == 255] = result[thresh == 255]  # keep original foreground
        segmented = result
        mask = thresh
        white = int(np.sum(thresh == 255))
        black = int(np.sum(thresh == 0))
        stats = {
            "threshold_value": round(float(thresh_val), 1),
            "foreground_pixels": white,
            "background_pixels": black,
            "foreground_ratio": round(white / thresh.size, 3),
            "regions": 2,
        }

    # ── K-MEANS ───────────────────────────────────────────────────────────────
    elif method == "kmeans":
        k = int(p.get("k", 4))
        k = max(2, min(k, 16))
        attempts = int(p.get("attempts", 10))
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.2)
        pixel_data = display.reshape((-1, 3)).astype(np.float32)
        _, labels, centers = cv2.kmeans(pixel_data, k, None, criteria, attempts, cv2.KMEANS_PP_CENTERS)
        centers = np.uint8(centers)
        segmented = centers[labels.flatten()].reshape(display.shape)
        # Count per cluster
        unique, counts = np.unique(labels, return_counts=True)
        cluster_sizes = {f"cluster_{int(u)+1}": int(c) for u, c in zip(unique, counts)}
        stats = {
            "k": k,
            "clusters": cluster_sizes,
            "total_pixels": int(labels.size),
            "largest_cluster": int(counts.max()),
        }

    # ── EDGE-BASED ───────────────────────────────────────────────────────────
    elif method == "edge_based":
        gray = to_grayscale(display)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
        contours, hierarchy = cv2.findContours(closed, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        result = display.copy()
        colors = _random_color_map(min(len(contours), 20))
        filled = np.zeros_like(display)
        for i, cnt in enumerate(contours[:20]):
            area = cv2.contourArea(cnt)
            if area > 100:
                color = colors[i % len(colors)]
                cv2.drawContours(filled, [cnt], -1, color, -1)
        segmented = cv2.addWeighted(display, 0.5, filled, 0.5, 0)
        cv2.drawContours(segmented, contours, -1, (0, 255, 255), 1)
        # Filter meaningful contours
        meaningful = [c for c in contours if cv2.contourArea(c) > 100]
        stats = {
            "total_contours": len(contours),
            "significant_regions": len(meaningful),
            "edge_pixels": int(np.sum(edges > 0)),
        }

    # ── REGION GROWING ────────────────────────────────────────────────────────
    elif method == "region_growing":
        gray = to_grayscale(display)
        tolerance = int(p.get("tolerance", 15))
        h, w = gray.shape
        seed_x = int(p.get("seed_x", w // 2))
        seed_y = int(p.get("seed_y", h // 2))
        seed_x = max(0, min(seed_x, w - 1))
        seed_y = max(0, min(seed_y, h - 1))

        seed_val = int(gray[seed_y, seed_x])
        mask_rg = np.zeros((h, w), dtype=np.uint8)
        visited = np.zeros((h, w), dtype=bool)
        stack = [(seed_y, seed_x)]
        visited[seed_y, seed_x] = True

        while stack:
            cy, cx = stack.pop()
            if abs(int(gray[cy, cx]) - seed_val) <= tolerance:
                mask_rg[cy, cx] = 255
                for dy, dx in [(-1,0),(1,0),(0,-1),(0,1)]:
                    ny, nx = cy+dy, cx+dx
                    if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                        visited[ny, nx] = True
                        stack.append((ny, nx))

        result = display.copy()
        result[mask_rg == 255] = cv2.addWeighted(
            display, 0.5,
            np.full_like(display, [0, 200, 255]), 0.5, 0
        )[mask_rg == 255]
        result[mask_rg == 0] = (result[mask_rg == 0] * 0.4).astype(np.uint8)
        cv2.circle(result, (seed_x, seed_y), 6, (0, 0, 255), -1)
        segmented = result
        region_size = int(np.sum(mask_rg == 255))
        stats = {
            "seed_point": [seed_x, seed_y],
            "seed_intensity": seed_val,
            "tolerance": tolerance,
            "region_pixels": region_size,
            "region_ratio": round(region_size / gray.size, 3),
        }

    # ── MEAN SHIFT ───────────────────────────────────────────────────────────
    elif method == "mean_shift":
        sp = int(p.get("spatial_radius", 20))
        sr = int(p.get("color_radius", 40))
        shifted = cv2.pyrMeanShiftFiltering(display, sp, sr)
        # Count unique colours (approximation via quantization)
        quant = (shifted // 16) * 16
        unique_colors = len(np.unique(quant.reshape(-1, 3), axis=0))
        segmented = shifted
        stats = {
            "spatial_radius": sp,
            "color_radius": sr,
            "approx_regions": unique_colors,
        }

    else:
        raise HTTPException(status_code=400, detail=f"Unknown segmentation method: '{method}'")

    segmented_b64 = encode_image_to_base64(resize_for_display(segmented))
    mask_b64 = encode_image_to_base64(ensure_bgr(mask)) if mask is not None else None

    return {
        "original_image": original_b64,
        "segmented_image": segmented_b64,
        "mask_image": mask_b64,
        "method": method,
        "description": DESCRIPTIONS.get(method, ""),
        "stats": stats,
    }
