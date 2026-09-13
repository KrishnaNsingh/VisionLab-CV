"""
object_detection.py — Module 4: YOLO Image Object Detection
POST /api/image/detect
"""
import cv2
import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from services.cv_utils import decode_upload, encode_image_to_base64, resize_for_display

router = APIRouter()


@router.post("/detect")
async def detect_objects(
    file: UploadFile = File(...),
    conf: float = Form(0.4),
    iou: float = Form(0.5),
):
    """
    Run YOLOv8 object detection on an uploaded image.
    Returns annotated image with bounding boxes, labels, confidence scores,
    and a per-category detection summary.
    """
    contents = await file.read()
    img = decode_upload(contents)
    if img is None:
        raise HTTPException(status_code=400, detail="Cannot decode image.")

    conf = max(0.1, min(conf, 0.95))
    iou = max(0.1, min(iou, 0.95))

    display = resize_for_display(img.copy(), max_dim=960)
    original_b64 = encode_image_to_base64(display)

    try:
        from services import yolo_service
        result = yolo_service.detect(display, conf=conf, iou=iou)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    annotated_b64 = encode_image_to_base64(result["annotated_image"])

    return {
        "original_image": original_b64,
        "annotated_image": annotated_b64,
        "detections": result["detections"],
        "summary": result["summary"],
        "params": {"conf_threshold": conf, "iou_threshold": iou},
        "description": (
            "YOLOv8n (You Only Look Once v8 nano) is a single-shot object detector. "
            "It divides the image into a grid, predicts bounding boxes and class probabilities simultaneously. "
            "The nano variant is optimised for speed on CPU. "
            "NMS (Non-Maximum Suppression) removes duplicate detections using the IoU threshold."
        ),
    }
