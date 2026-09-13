"""
cv_utils.py — Shared OpenCV helper utilities for VisionLab
"""
import cv2
import numpy as np
import base64
from typing import Optional


def encode_image_to_base64(img: np.ndarray) -> str:
    """Encode an OpenCV image (BGR or grayscale) to a base64 JPEG data URI."""
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 92]
    _, buffer = cv2.imencode('.jpg', img, encode_param)
    b64 = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{b64}"


def decode_upload(file_bytes: bytes) -> Optional[np.ndarray]:
    """Decode uploaded image bytes to an OpenCV BGR numpy array."""
    nparr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img


def resize_for_display(img: np.ndarray, max_dim: int = 900) -> np.ndarray:
    """Resize image so its largest dimension is at most max_dim (preserves aspect ratio)."""
    if img is None:
        return img
    h, w = img.shape[:2]
    if max(h, w) <= max_dim:
        return img
    scale = max_dim / max(h, w)
    new_w = max(1, int(w * scale))
    new_h = max(1, int(h * scale))
    return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)


def ensure_bgr(img: np.ndarray) -> np.ndarray:
    """Ensure image is 3-channel BGR (convert from grayscale if needed)."""
    if img is None:
        return img
    if len(img.shape) == 2:
        return cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    return img


def to_grayscale(img: np.ndarray) -> np.ndarray:
    """Convert BGR image to grayscale."""
    if len(img.shape) == 2:
        return img
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)


def apply_colormap_jet(gray_img: np.ndarray) -> np.ndarray:
    """Apply JET colormap to a grayscale image for pseudo-color visualization."""
    if len(gray_img.shape) == 3:
        gray_img = to_grayscale(gray_img)
    norm = cv2.normalize(gray_img, None, 0, 255, cv2.NORM_MINMAX, dtype=cv2.CV_8U)
    return cv2.applyColorMap(norm, cv2.COLORMAP_JET)


def overlay_mask(img: np.ndarray, mask: np.ndarray, color: tuple = (0, 255, 0), alpha: float = 0.4) -> np.ndarray:
    """Overlay a binary mask on an image with a given color and transparency."""
    result = img.copy()
    colored = np.zeros_like(img)
    colored[:] = color
    mask_bool = mask > 0
    result[mask_bool] = cv2.addWeighted(img, 1 - alpha, colored, alpha, 0)[mask_bool]
    return result


def draw_text_with_bg(img: np.ndarray, text: str, pos: tuple,
                      font_scale: float = 0.6, thickness: int = 1,
                      text_color=(255, 255, 255), bg_color=(0, 100, 200)) -> np.ndarray:
    """Draw text with a filled background rectangle for readability."""
    font = cv2.FONT_HERSHEY_SIMPLEX
    (tw, th), baseline = cv2.getTextSize(text, font, font_scale, thickness)
    x, y = pos
    cv2.rectangle(img, (x - 2, y - th - baseline - 2), (x + tw + 2, y + baseline), bg_color, -1)
    cv2.putText(img, text, (x, y), font, font_scale, text_color, thickness, cv2.LINE_AA)
    return img
