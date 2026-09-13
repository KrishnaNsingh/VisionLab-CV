"""
video_detection.py — Module 6: Video Object Detection & Tracking (YOLOv8 + ByteTrack)
POST /api/video/detect
"""
import os
import tempfile
import cv2
import numpy as np
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from collections import defaultdict

from services.cv_utils import encode_image_to_base64, resize_for_display

router = APIRouter()


@router.post("/detect")
async def detect_and_track(
    file: UploadFile = File(...),
    conf: float = Form(0.35),
    iou: float = Form(0.45),
    frame_step: int = Form(5),
    max_output_frames: int = Form(6),
):
    """
    Run YOLOv8 + ByteTrack object tracking on a video.
    Processes every frame_step-th frame.
    Returns annotated sample frames and a tracking summary.
    """
    contents = await file.read()
    suffix = os.path.splitext(file.filename or "video.mp4")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        from services import yolo_service
        yolo_service.reset_tracker()

        cap = cv2.VideoCapture(tmp_path)
        if not cap.isOpened():
            raise HTTPException(status_code=400, detail="Cannot open video file.")

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        frame_step = max(1, frame_step)
        all_tracks_by_id: dict = {}           # track_id -> {label, max_conf}
        by_category: dict = defaultdict(set)  # label -> set of track_ids
        sample_frames_b64 = []
        sample_every = max(1, total_frames // (frame_step * max(max_output_frames, 1)))

        frame_idx = 0
        output_count = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % frame_step == 0:
                small = resize_for_display(frame, max_dim=640)
                try:
                    result = yolo_service.track_frame(small, conf=conf, iou=iou, persist=True)
                except Exception:
                    frame_idx += 1
                    continue

                for t in result["tracks"]:
                    tid = t["track_id"]
                    label = t["label"]
                    c = t["conf"]
                    if tid not in all_tracks_by_id:
                        all_tracks_by_id[tid] = {"label": label, "max_conf": c}
                    else:
                        all_tracks_by_id[tid]["max_conf"] = max(all_tracks_by_id[tid]["max_conf"], c)
                    by_category[label].add(tid)

                # Save annotated sample frames
                if output_count < max_output_frames and frame_idx % (sample_every * frame_step) == 0:
                    annotated = result["annotated_frame"]
                    # Add frame number overlay
                    cv2.putText(annotated, f"Frame {frame_idx}", (10, 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)
                    sample_frames_b64.append(encode_image_to_base64(annotated))
                    output_count += 1

            frame_idx += 1

        cap.release()

    finally:
        os.unlink(tmp_path)

    # Build tracking summary
    unique_ids = len(all_tracks_by_id)
    category_summary = {label: len(ids) for label, ids in by_category.items()}
    track_list = [
        {
            "track_id": tid,
            "label": v["label"],
            "max_conf": round(v["max_conf"], 3),
        }
        for tid, v in sorted(all_tracks_by_id.items())
    ]

    return {
        "sample_frames": sample_frames_b64,
        "tracking_summary": {
            "unique_objects": unique_ids,
            "frames_processed": frame_idx // frame_step,
            "total_frames": total_frames,
            "fps": round(fps, 2),
            "frame_step": frame_step,
            "by_category": category_summary,
        },
        "track_list": track_list[:50],  # cap at 50
        "description": (
            "ByteTrack is an association-based multi-object tracker integrated into Ultralytics YOLOv8. "
            "It associates every detection (not just high-confidence ones) to tracks using IoU-based matching, "
            "maintaining consistent object IDs across frames even during brief occlusions."
        ),
    }
