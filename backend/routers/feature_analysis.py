"""
feature_analysis.py — Module 2: Edge & Feature Analysis
POST /api/image/features
"""
import json
import cv2
import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional

from services.cv_utils import (
    decode_upload, encode_image_to_base64, resize_for_display,
    ensure_bgr, to_grayscale, apply_colormap_jet
)

router = APIRouter()

DESCRIPTIONS = {
    "canny": (
        "Canny Edge Detection: A multi-stage algorithm (Gaussian blur → gradient magnitude & direction → "
        "non-maximum suppression → hysteresis thresholding). Widely considered the optimal edge detector."
    ),
    "sobel": (
        "Sobel Operator: Computes image gradient using 3×3 convolution kernels in X and Y directions. "
        "The combined magnitude √(Gx²+Gy²) highlights edges. Sensitive to noise compared to Canny."
    ),
    "laplacian": (
        "Laplacian Filter: Second-order derivative operator. Detects regions of rapid intensity change "
        "and is isotropic (direction-independent). Often applied after Gaussian smoothing (LoG)."
    ),
    "log": (
        "Laplacian of Gaussian (LoG): First apply Gaussian blur to reduce noise, then apply Laplacian. "
        "Zero-crossings of the LoG response mark edges. Forms the basis of the DoG approximation used in SIFT."
    ),
    "hough_lines": (
        "Probabilistic Hough Transform: Detects straight lines by mapping edge points to Hough parameter space "
        "(ρ, θ). Peaks in accumulator space correspond to lines. Used in lane detection, document analysis."
    ),
    "harris": (
        "Harris Corner Detector: Computes the autocorrelation matrix M of image gradients. Corners occur where "
        "both eigenvalues of M are large (R = det(M) − k·trace(M)²). Rotation-invariant but not scale-invariant."
    ),
    "sift": (
        "Scale-Invariant Feature Transform (SIFT): Detects keypoints at extrema of the DoG scale space, "
        "assigns orientations from gradient histograms, and computes 128-dim descriptors. "
        "Invariant to scale, rotation, and partially to illumination changes."
    ),
    "hog": (
        "Histogram of Oriented Gradients (HOG): Divides image into cells, computes gradient orientation "
        "histograms per cell, normalizes across blocks. Widely used for pedestrian/object detection (DPM, SVM)."
    ),
}


@router.post("/features")
async def analyze_features(
    file: UploadFile = File(...),
    feature: str = Form("canny"),
    params: Optional[str] = Form(None),
):
    """Detect edges, corners, or keypoints in an uploaded image."""
    contents = await file.read()
    img = decode_upload(contents)
    if img is None:
        raise HTTPException(status_code=400, detail="Cannot decode image.")

    p = json.loads(params) if params else {}
    display = resize_for_display(img.copy())
    gray = to_grayscale(display)
    original_b64 = encode_image_to_base64(display)

    stats: dict = {}
    result_img: np.ndarray = display.copy()

    # ── CANNY ────────────────────────────────────────────────────────────────
    if feature == "canny":
        blur_k = int(p.get("blur_ksize", 5))
        if blur_k % 2 == 0:
            blur_k += 1
        blurred = cv2.GaussianBlur(gray, (blur_k, blur_k), 0)
        low = int(p.get("low_thresh", 50))
        high = int(p.get("high_thresh", 150))
        edges = cv2.Canny(blurred, low, high)
        # Colour overlay on original
        result_img = display.copy()
        result_img[edges > 0] = [0, 255, 100]
        edge_overlay_b64 = encode_image_to_base64(result_img)
        edges_b64 = encode_image_to_base64(ensure_bgr(edges))
        stats = {
            "edge_pixels": int(np.sum(edges > 0)),
            "low_threshold": low,
            "high_threshold": high,
            "blur_kernel": blur_k,
        }
        return {
            "original_image": original_b64,
            "result_image": edges_b64,
            "overlay_image": edge_overlay_b64,
            "feature": feature,
            "description": DESCRIPTIONS[feature],
            "stats": stats,
        }

    # ── SOBEL ────────────────────────────────────────────────────────────────
    elif feature == "sobel":
        ksize = int(p.get("kernel_size", 3))
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        gx = cv2.Sobel(blurred, cv2.CV_64F, 1, 0, ksize=ksize)
        gy = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=ksize)
        mag = np.sqrt(gx**2 + gy**2)
        mag = cv2.normalize(mag, None, 0, 255, cv2.NORM_MINMAX, cv2.CV_8U)
        direction = np.arctan2(np.abs(gy), np.abs(gx)) * 180 / np.pi
        colored = apply_colormap_jet(mag)
        result_img[mag > 30] = colored[mag > 30]
        stats = {
            "mean_gradient_magnitude": round(float(mag.mean()), 2),
            "max_gradient_magnitude": int(mag.max()),
            "kernel_size": ksize,
            "mean_direction_degrees": round(float(direction.mean()), 2),
        }
        return {
            "original_image": original_b64,
            "result_image": encode_image_to_base64(colored),
            "overlay_image": encode_image_to_base64(result_img),
            "feature": feature,
            "description": DESCRIPTIONS[feature],
            "stats": stats,
        }

    # ── LAPLACIAN ────────────────────────────────────────────────────────────
    elif feature == "laplacian":
        blurred = cv2.GaussianBlur(gray, (3, 3), 0)
        lap = cv2.Laplacian(blurred, cv2.CV_64F)
        lap_abs = np.uint8(np.absolute(lap))
        lap_norm = cv2.normalize(lap_abs, None, 0, 255, cv2.NORM_MINMAX)
        colored = apply_colormap_jet(lap_norm)
        stats = {
            "edge_pixels": int(np.sum(lap_norm > 30)),
            "mean_response": round(float(lap_norm.mean()), 2),
            "max_response": int(lap_norm.max()),
        }
        return {
            "original_image": original_b64,
            "result_image": encode_image_to_base64(colored),
            "overlay_image": encode_image_to_base64(colored),
            "feature": feature,
            "description": DESCRIPTIONS[feature],
            "stats": stats,
        }

    # ── LOG ───────────────────────────────────────────────────────────────────
    elif feature == "log":
        sigma = float(p.get("sigma", 2.0))
        ksize = int(6 * sigma + 1) | 1  # ensure odd
        blurred = cv2.GaussianBlur(gray, (ksize, ksize), sigma)
        lap = cv2.Laplacian(blurred.astype(np.float64), cv2.CV_64F)
        # Zero-crossing detection
        zero_cross = np.zeros_like(lap, dtype=np.uint8)
        for i in range(1, lap.shape[0] - 1):
            for j in range(1, lap.shape[1] - 1):
                patch = lap[i-1:i+2, j-1:j+2]
                if lap[i, j] * patch.min() < 0:
                    zero_cross[i, j] = 255
        lap_vis = cv2.normalize(np.abs(lap), None, 0, 255, cv2.NORM_MINMAX, cv2.CV_8U)
        colored = apply_colormap_jet(lap_vis)
        result_img[zero_cross > 0] = [255, 80, 0]
        stats = {
            "sigma": sigma,
            "zero_crossings": int(np.sum(zero_cross > 0)),
            "kernel_size": ksize,
        }
        return {
            "original_image": original_b64,
            "result_image": encode_image_to_base64(colored),
            "overlay_image": encode_image_to_base64(result_img),
            "feature": feature,
            "description": DESCRIPTIONS[feature],
            "stats": stats,
        }

    # ── HOUGH LINES ──────────────────────────────────────────────────────────
    elif feature == "hough_lines":
        edges = cv2.Canny(cv2.GaussianBlur(gray, (5, 5), 0), 50, 150)
        threshold = int(p.get("threshold", 80))
        min_line_len = int(p.get("min_line_length", 50))
        max_gap = int(p.get("max_line_gap", 10))
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold,
                                minLineLength=min_line_len, maxLineGap=max_gap)
        result_img = display.copy()
        count = 0
        if lines is not None:
            count = len(lines)
            for line in lines:
                x1, y1, x2, y2 = line[0]
                cv2.line(result_img, (x1, y1), (x2, y2), (0, 220, 255), 2)
        stats = {
            "lines_detected": count,
            "threshold": threshold,
            "min_line_length": min_line_len,
            "max_line_gap": max_gap,
        }
        return {
            "original_image": original_b64,
            "result_image": encode_image_to_base64(result_img),
            "overlay_image": encode_image_to_base64(result_img),
            "feature": feature,
            "description": DESCRIPTIONS[feature],
            "stats": stats,
        }

    # ── HARRIS ───────────────────────────────────────────────────────────────
    elif feature == "harris":
        k = float(p.get("k", 0.04))
        block_size = int(p.get("block_size", 2))
        ksize = int(p.get("ksize", 3))
        thresh_ratio = float(p.get("threshold_ratio", 0.01))
        gray_f = np.float32(gray)
        dst = cv2.cornerHarris(gray_f, block_size, ksize, k)
        dst_norm = cv2.normalize(dst, None, 0, 255, cv2.NORM_MINMAX, cv2.CV_8U)
        thresh = dst > thresh_ratio * dst.max()
        result_img = display.copy()
        corners = np.argwhere(thresh)
        for pt in corners:
            cv2.circle(result_img, (pt[1], pt[0]), 3, (0, 0, 255), -1)
        response_vis = apply_colormap_jet(dst_norm)
        stats = {
            "corners_detected": int(len(corners)),
            "k_value": k,
            "block_size": block_size,
            "threshold_ratio": thresh_ratio,
        }
        return {
            "original_image": original_b64,
            "result_image": encode_image_to_base64(response_vis),
            "overlay_image": encode_image_to_base64(result_img),
            "feature": feature,
            "description": DESCRIPTIONS[feature],
            "stats": stats,
        }

    # ── SIFT ─────────────────────────────────────────────────────────────────
    elif feature == "sift":
        n_features = int(p.get("n_features", 500))
        contrast_thresh = float(p.get("contrast_threshold", 0.04))
        edge_thresh = float(p.get("edge_threshold", 10))
        try:
            sift = cv2.SIFT_create(
                nfeatures=n_features,
                contrastThreshold=contrast_thresh,
                edgeThreshold=edge_thresh
            )
        except AttributeError:
            raise HTTPException(status_code=500, detail="SIFT unavailable. Ensure opencv-contrib-python is installed.")
        keypoints, descriptors = sift.detectAndCompute(gray, None)
        kp_vis = cv2.drawKeypoints(display, keypoints, None,
                                   flags=cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)
        # Rich visualization with orientation
        result_rich = cv2.drawKeypoints(display, keypoints, None,
                                        color=(0, 255, 0),
                                        flags=cv2.DRAW_MATCHES_FLAGS_DRAW_RICH_KEYPOINTS)
        desc_shape = descriptors.shape if descriptors is not None else (0, 0)
        stats = {
            "keypoints_detected": len(keypoints),
            "descriptor_dims": desc_shape[1] if len(desc_shape) > 1 else 0,
            "n_features_requested": n_features,
            "contrast_threshold": contrast_thresh,
        }
        return {
            "original_image": original_b64,
            "result_image": encode_image_to_base64(result_rich),
            "overlay_image": encode_image_to_base64(kp_vis),
            "feature": feature,
            "description": DESCRIPTIONS[feature],
            "stats": stats,
        }

    # ── HOG ──────────────────────────────────────────────────────────────────
    elif feature == "hog":
        try:
            from skimage.feature import hog
            from skimage import exposure
        except ImportError:
            raise HTTPException(status_code=500, detail="scikit-image not installed.")

        # Resize to standard HOG size
        hog_size = (128, 64)  # standard pedestrian window
        resized_gray = cv2.resize(gray, hog_size[::-1])  # cv2 uses (w,h)
        cells = int(p.get("cells_per_block", 2))
        pixels = int(p.get("pixels_per_cell", 8))
        orientations = int(p.get("orientations", 9))

        fd, hog_image = hog(
            resized_gray,
            orientations=orientations,
            pixels_per_cell=(pixels, pixels),
            cells_per_block=(cells, cells),
            visualize=True,
            channel_axis=None
        )
        # Rescale for display
        hog_vis = exposure.rescale_intensity(hog_image, in_range=(0, 10))
        hog_vis_uint8 = (hog_vis * 255).astype(np.uint8)
        hog_colored = apply_colormap_jet(hog_vis_uint8)
        hog_colored_full = cv2.resize(hog_colored, (display.shape[1], display.shape[0]))
        # Blend with original
        blend = cv2.addWeighted(display, 0.4, hog_colored_full, 0.6, 0)
        stats = {
            "feature_vector_length": int(len(fd)),
            "orientations": orientations,
            "pixels_per_cell": pixels,
            "cells_per_block": cells,
            "window_size": f"{hog_size[1]}×{hog_size[0]}",
        }
        return {
            "original_image": original_b64,
            "result_image": encode_image_to_base64(hog_colored_full),
            "overlay_image": encode_image_to_base64(blend),
            "feature": feature,
            "description": DESCRIPTIONS[feature],
            "stats": stats,
        }

    else:
        raise HTTPException(status_code=400, detail=f"Unknown feature: '{feature}'")
