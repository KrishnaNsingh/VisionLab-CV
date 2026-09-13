"""
main.py — VisionLab FastAPI Application Entry Point
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routers import (
    image_processing,
    feature_analysis,
    segmentation,
    object_detection,
    video_analysis,
    video_detection,
    motion_analysis,
)

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)

app = FastAPI(
    title="VisionLab API",
    description=(
        "VisionLab — Intelligent Image & Video Analysis Platform. "
        "REST API powering classical Computer Vision algorithms, "
        "YOLOv8 object detection, multi-object tracking, and motion analysis."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── CORS (allow all origins for local development) ──────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files ─────────────────────────────────────────────────────────────
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(image_processing.router, prefix="/api/image", tags=["Image Preprocessing"])
app.include_router(feature_analysis.router, prefix="/api/image", tags=["Feature Analysis"])
app.include_router(segmentation.router,    prefix="/api/image", tags=["Segmentation"])
app.include_router(object_detection.router, prefix="/api/image", tags=["Object Detection"])
app.include_router(video_analysis.router,  prefix="/api/video", tags=["Video Analysis"])
app.include_router(video_detection.router, prefix="/api/video", tags=["Video Detection"])
app.include_router(motion_analysis.router, prefix="/api/video", tags=["Motion Analysis"])


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "VisionLab API", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
