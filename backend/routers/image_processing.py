"""
image_processing.py — Module 1: Image Preprocessing & Enhancement
POST /api/image/process
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

# ── Operation metadata ───────────────────────────────────────────────────────
DESCRIPTIONS = {
    "original":      "The original uploaded image without any modifications.",
    "resize":        "Resizes the image by a scale factor. Useful to understand image formation and sampling effects.",
    "grayscale":     "Converts RGB to grayscale via luminosity weighting (0.299R + 0.587G + 0.114B), removing color redundancy.",
    "gaussian_blur": "Applies a Gaussian smoothing filter. Models human visual blur; larger kernel = stronger low-pass effect. Reduces high-frequency noise.",
    "median_filter": "Replaces each pixel with the median of its neighbourhood. Nonlinear filter excellent at removing salt-and-pepper impulse noise while preserving edges.",
    "sharpen":       "Enhances edges using a Laplacian-based unsharp masking kernel. Amplifies high-frequency components to increase apparent sharpness.",
    "histogram":     "Plots the distribution of pixel intensities (0–255). Reveals exposure, contrast, and dynamic range characteristics of the image.",
    "histogram_eq":  "Histogram Equalization: redistributes intensities to flatten the histogram, maximizing contrast. Based on the CDF-based intensity mapping.",
    "contrast":      "Linear contrast/brightness scaling: output = α × input + β. α > 1 increases contrast; β shifts brightness.",
    "threshold":     "Converts a grayscale image to binary using Otsu's method (global optimal threshold), adaptive thresholding, or a manual value.",
    "morphology":    "Structural image operations on binary images. Erosion shrinks bright regions; dilation expands them. Opening (erode→dilate) removes small objects; closing (dilate→erode) fills holes.",
}


@router.post("/process")
async def process_image(
    file: UploadFile = File(...),
    operation: str = Form("original"),
    params: Optional[str] = Form(None),
):
    """Apply a preprocessing/enhancement operation to an uploaded image."""
    contents = await file.read()
    img = decode_upload(contents)
    if img is None:
        raise HTTPException(status_code=400, detail="Cannot decode image. Upload a valid JPEG/PNG file.")

    p = json.loads(params) if params else {}
    display = resize_for_display(img.copy())
    original_b64 = encode_image_to_base64(display)

    stats: dict = {
        "width": img.shape[1],
        "height": img.shape[0],
        "channels": img.shape[2] if len(img.shape) == 3 else 1,
    }
    chart_data = None
    processed: np.ndarray

    # ── Operations ────────────────────────────────────────────────────────────
    if operation == "original":
        processed = display

    elif operation == "resize":
        scale = float(p.get("scale", 50)) / 100.0
        new_w = max(1, int(img.shape[1] * scale))
        new_h = max(1, int(img.shape[0] * scale))
        resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_LINEAR)
        processed = resize_for_display(resized)
        stats["new_width"] = new_w
        stats["new_height"] = new_h
        stats["scale_percent"] = int(scale * 100)

    elif operation == "grayscale":
        gray = to_grayscale(display)
        processed = ensure_bgr(gray)
        stats["mean_intensity"] = round(float(gray.mean()), 2)
        stats["std_intensity"] = round(float(gray.std()), 2)

    elif operation == "gaussian_blur":
        ksize = int(p.get("kernel_size", 15))
        if ksize % 2 == 0:
            ksize += 1
        ksize = max(3, ksize)
        sigma = float(p.get("sigma", 0))
        processed = cv2.GaussianBlur(display, (ksize, ksize), sigma)
        stats["kernel_size"] = ksize
        stats["sigma"] = sigma if sigma > 0 else "auto"

    elif operation == "median_filter":
        ksize = int(p.get("kernel_size", 5))
        if ksize % 2 == 0:
            ksize += 1
        ksize = max(3, ksize)
        processed = cv2.medianBlur(display, ksize)
        stats["kernel_size"] = ksize

    elif operation == "sharpen":
        strength = float(p.get("strength", 1.0))
        # Unsharp mask: sharpened = original + strength * (original - blurred)
        blurred = cv2.GaussianBlur(display, (0, 0), 3)
        processed = cv2.addWeighted(display, 1 + strength, blurred, -strength, 0)
        stats["strength"] = strength

    elif operation == "histogram":
        gray = to_grayscale(display)
        # Grayscale histogram
        hist_gray = cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten().tolist()
        # Per-channel histograms
        color_hists = {}
        channel_names = ['blue', 'green', 'red']
        for i, name in enumerate(channel_names):
            h = cv2.calcHist([display], [i], None, [256], [0, 256]).flatten().tolist()
            color_hists[name] = h
        chart_data = {
            "labels": list(range(256)),
            "gray": hist_gray,
            "channels": color_hists,
        }
        processed = display.copy()
        stats["mean_intensity"] = round(float(gray.mean()), 2)
        stats["std_intensity"] = round(float(gray.std()), 2)
        stats["min_intensity"] = int(gray.min())
        stats["max_intensity"] = int(gray.max())

    elif operation == "histogram_eq":
        gray = to_grayscale(display)
        eq = cv2.equalizeHist(gray)
        processed = ensure_bgr(eq)
        stats["before_mean"] = round(float(gray.mean()), 2)
        stats["after_mean"] = round(float(eq.mean()), 2)
        stats["before_std"] = round(float(gray.std()), 2)
        stats["after_std"] = round(float(eq.std()), 2)
        # Chart: before/after histogram comparison
        hist_before = cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten().tolist()
        hist_after = cv2.calcHist([eq], [0], None, [256], [0, 256]).flatten().tolist()
        chart_data = {
            "labels": list(range(256)),
            "before": hist_before,
            "after": hist_after,
        }

    elif operation == "contrast":
        alpha = float(p.get("alpha", 1.5))
        beta = int(p.get("beta", 0))
        processed = cv2.convertScaleAbs(display, alpha=alpha, beta=beta)
        stats["alpha_contrast"] = alpha
        stats["beta_brightness"] = beta

    elif operation == "threshold":
        gray = to_grayscale(display)
        method = p.get("method", "otsu")
        if method == "otsu":
            thresh_val, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            stats["threshold_value"] = round(float(thresh_val), 1)
            stats["method"] = "Otsu's Global"
        elif method == "adaptive_mean":
            block = int(p.get("block_size", 11))
            block = block if block % 2 == 1 else block + 1
            thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, block, 2)
            stats["method"] = f"Adaptive Mean (block={block})"
        elif method == "adaptive_gaussian":
            block = int(p.get("block_size", 11))
            block = block if block % 2 == 1 else block + 1
            thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, block, 2)
            stats["method"] = f"Adaptive Gaussian (block={block})"
        else:  # manual
            val = int(p.get("value", 127))
            _, thresh = cv2.threshold(gray, val, 255, cv2.THRESH_BINARY)
            stats["threshold_value"] = val
            stats["method"] = "Manual"
        processed = ensure_bgr(thresh)
        # Count white/black pixels
        stats["white_pixels"] = int(np.sum(thresh == 255))
        stats["black_pixels"] = int(np.sum(thresh == 0))

    elif operation == "morphology":
        gray = to_grayscale(display)
        morph_op = p.get("morph_op", "dilation")
        ksize = int(p.get("kernel_size", 5))
        ksize = max(3, ksize)
        shape_name = p.get("kernel_shape", "rect")
        shape_map = {
            "rect":    cv2.MORPH_RECT,
            "ellipse": cv2.MORPH_ELLIPSE,
            "cross":   cv2.MORPH_CROSS,
        }
        morph_shape = shape_map.get(shape_name, cv2.MORPH_RECT)
        kernel = cv2.getStructuringElement(morph_shape, (ksize, ksize))
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        op_map = {
            "erosion":  lambda b: cv2.erode(b, kernel, iterations=1),
            "dilation": lambda b: cv2.dilate(b, kernel, iterations=1),
            "opening":  lambda b: cv2.morphologyEx(b, cv2.MORPH_OPEN, kernel),
            "closing":  lambda b: cv2.morphologyEx(b, cv2.MORPH_CLOSE, kernel),
            "gradient": lambda b: cv2.morphologyEx(b, cv2.MORPH_GRADIENT, kernel),
        }
        result = op_map.get(morph_op, op_map["dilation"])(binary)
        processed = ensure_bgr(result)
        stats["operation"] = morph_op
        stats["kernel_size"] = ksize
        stats["kernel_shape"] = shape_name

    else:
        raise HTTPException(status_code=400, detail=f"Unknown operation: '{operation}'")

    processed_display = resize_for_display(processed)
    processed_b64 = encode_image_to_base64(processed_display)

    return {
        "original_image": original_b64,
        "processed_image": processed_b64,
        "operation": operation,
        "description": DESCRIPTIONS.get(operation, ""),
        "stats": stats,
        "chart_data": chart_data,
    }
