"""
yolo_service.py — Lazy-loading YOLOv8 singleton for VisionLab
"""
import threading
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np
import cv2

_model = None
_model_lock = threading.Lock()


def _get_model():
    """Return the cached YOLOv8n model, loading it on first call."""
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                try:
                    from ultralytics import YOLO
                    model_path = Path(__file__).parent.parent / "yolov8n.pt"
                    _model = YOLO(str(model_path) if model_path.exists() else "yolov8n.pt")
                    # Warm up
                    dummy = np.zeros((64, 64, 3), dtype=np.uint8)
                    _model(dummy, verbose=False)
                except Exception as e:
                    raise RuntimeError(f"Failed to load YOLOv8 model: {e}")
    return _model


def detect(
    img: np.ndarray,
    conf: float = 0.4,
    iou: float = 0.5
) -> Dict[str, Any]:
    """
    Run YOLOv8 detection on a BGR image.
    Returns:
        {
          annotated_image: np.ndarray (BGR),
          detections: List[{label, conf, bbox: [x1,y1,x2,y2]}],
          summary: {total: int, by_category: {label: count}}
        }
    """
    model = _get_model()
    results = model(img, conf=conf, iou=iou, verbose=False)[0]

    annotated = results.plot()
    detections = []
    by_category: Dict[str, int] = {}

    if results.boxes is not None:
        for box in results.boxes:
            label = model.names[int(box.cls[0])]
            confidence = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            detections.append({
                "label": label,
                "conf": round(confidence, 3),
                "bbox": [x1, y1, x2, y2]
            })
            by_category[label] = by_category.get(label, 0) + 1

    return {
        "annotated_image": annotated,
        "detections": detections,
        "summary": {
            "total": len(detections),
            "by_category": by_category
        }
    }


def track_frame(
    img: np.ndarray,
    conf: float = 0.4,
    iou: float = 0.45,
    persist: bool = True
) -> Dict[str, Any]:
    """
    Run YOLOv8 tracking on a single BGR frame.
    Returns annotated frame and list of tracked objects.
    """
    model = _get_model()
    results = model.track(img, conf=conf, iou=iou, persist=persist, verbose=False)[0]

    annotated = results.plot()
    tracks = []

    if results.boxes is not None:
        for box in results.boxes:
            label = model.names[int(box.cls[0])]
            confidence = float(box.conf[0])
            track_id = int(box.id[0]) if box.id is not None else -1
            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            tracks.append({
                "label": label,
                "conf": round(confidence, 3),
                "track_id": track_id,
                "bbox": [x1, y1, x2, y2]
            })

    return {
        "annotated_frame": annotated,
        "tracks": tracks
    }


def reset_tracker():
    """Reset tracker state (call between videos)."""
    global _model
    # Re-acquire fresh model to reset ByteTrack state
    try:
        from ultralytics import YOLO
        model_path = Path(__file__).parent.parent / "yolov8n.pt"
        _model = YOLO(str(model_path) if model_path.exists() else "yolov8n.pt")
    except Exception:
        pass
