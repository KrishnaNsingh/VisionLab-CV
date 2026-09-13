"""
video_analysis.py — Module 5: Video Metadata & Frame Extraction
POST /api/video/info
"""
import os
import tempfile
import cv2
import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from services.cv_utils import encode_image_to_base64, resize_for_display

router = APIRouter()


@router.post("/info")
async def video_info(
    file: UploadFile = File(...),
    num_keyframes: int = Form(8),
):
    """
    Extract metadata and evenly-spaced keyframes from an uploaded video.
    Returns FPS, resolution, duration, total frames, and keyframe thumbnails.
    """
    contents = await file.read()

    # Write to temp file (cv2.VideoCapture needs a file path)
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
        width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = total_frames / fps if fps > 0 else 0

        # Extract evenly-spaced keyframes
        num_keyframes = max(1, min(num_keyframes, 16))
        keyframe_indices = [
            int(i * (total_frames - 1) / (num_keyframes - 1))
            for i in range(num_keyframes)
        ] if num_keyframes > 1 else [0]

        keyframes_b64 = []
        for idx in keyframe_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            if ret:
                thumb = resize_for_display(frame, max_dim=320)
                keyframes_b64.append(encode_image_to_base64(thumb))

        cap.release()
    finally:
        os.unlink(tmp_path)

    return {
        "fps": round(fps, 2),
        "resolution": {"width": width, "height": height},
        "duration_seconds": round(duration, 2),
        "total_frames": total_frames,
        "file_size_mb": round(len(contents) / (1024 * 1024), 2),
        "keyframes": keyframes_b64,
        "keyframe_indices": keyframe_indices,
    }
