# VisionLab — Intelligent Image & Video Analysis Platform
**CSE3010 Computer Vision | Full-Stack Academic Project**

---

## Overview

VisionLab is a complete, browser-based Computer Vision platform that demonstrates classical and modern CV techniques aligned with the CSE3010 syllabus. It ships as a **Python FastAPI backend** (30+ OpenCV algorithms) paired with a **dark glassmorphism single-page web app**.

---

## Modules Implemented

| Module | Description | Key Algorithms |
|--------|-------------|----------------|
| **1 — Image Preprocessing** | 11 operations on uploaded images | Gaussian blur, median filter, histogram EQ, morphology, threshold (Otsu/adaptive) |
| **2 — Feature Analysis** | Edge and interest point detection | Canny, Sobel, Laplacian, LoG, Hough Lines, Harris, SIFT, HOG |
| **3 — Image Segmentation** | 5 segmentation approaches | K-Means, Mean Shift, Region Growing, Edge-based, Threshold |
| **4 — Object Detection** | Deep learning detection | YOLOv8n + NMS (80 COCO classes) |
| **5 — Video Info** | Metadata & keyframe extraction | cv2.VideoCapture, evenly-spaced sampling |
| **6 — Video Tracking** | Multi-object tracking | YOLOv8n + ByteTrack (persistent track IDs) |
| **7 — Motion Analysis** | Motion estimation & visualization | Farneback Dense OF, Lucas-Kanade KLT, MOG2/KNN background subtraction |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.9+, FastAPI, Uvicorn |
| CV Core | OpenCV 4.9, NumPy, scikit-image, SciPy |
| Object Detection | Ultralytics YOLOv8n (auto-downloaded ~6MB) |
| Tracking | ByteTrack (built into Ultralytics) |
| Frontend | Vanilla HTML5 / CSS3 / JavaScript (no framework) |
| Charts | Chart.js 4.4 |

---

## Project Structure

```
CV-Vityarthi/
├── backend/
│   ├── main.py                     ← FastAPI app
│   ├── requirements.txt
│   ├── services/
│   │   ├── cv_utils.py             ← Shared OpenCV helpers
│   │   └── yolo_service.py         ← YOLOv8 lazy singleton
│   └── routers/
│       ├── image_processing.py     ← Module 1
│       ├── feature_analysis.py     ← Module 2
│       ├── segmentation.py         ← Module 3
│       ├── object_detection.py     ← Module 4
│       ├── video_analysis.py       ← Module 5
│       ├── video_detection.py      ← Module 6
│       └── motion_analysis.py      ← Module 7
├── frontend/
│   ├── index.html
│   ├── css/styles.css              ← Dark glassmorphism design
│   └── js/
│       ├── api.js                  ← Fetch API client
│       ├── app.js                  ← SPA router
│       ├── components/
│       │   ├── dashboard.js        ← Chart.js renderers
│       │   └── progressOverlay.js
│       └── pages/
│           ├── home.js
│           ├── image_mode.js       ← Image tabs
│           └── video_mode.js       ← Video tabs
└── start.bat                       ← One-click launch
```

---

## Setup & Running

### 1. Start the Backend

```bat
# Double-click start.bat  OR  run in terminal:
start.bat
```

This will:
- Create a Python virtual environment in `backend/.venv`
- Install all dependencies from `requirements.txt`
- Start the FastAPI server at `http://localhost:8000`

> YOLOv8n (~6MB) downloads automatically on first detection run.

### 2. Serve the Frontend

Open a **second terminal**:

```bash
cd frontend
python -m http.server 5500
```

Then open **http://localhost:5500** in your browser.

### Manual install (alternative)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/image/process` | Image preprocessing |
| POST | `/api/image/features` | Feature analysis |
| POST | `/api/image/segment` | Segmentation |
| POST | `/api/image/detect` | Object detection |
| POST | `/api/video/info` | Video metadata |
| POST | `/api/video/detect` | Video tracking |
| POST | `/api/video/motion` | Motion analysis |

Interactive docs: **http://localhost:8000/api/docs**

---

## CSE3010 Syllabus Alignment

- **Unit 1** (Low-level processing): Modules 1, 2 — filtering, convolution, Fourier-domain concepts (LoG = Gaussian × Laplacian), histogram processing
- **Unit 3** (Feature Extraction): Modules 2, 3 — Canny, LoG, DoG (SIFT), Hough, Harris, HOG, K-Means, Mean Shift, Region Growing, edge-based segmentation
- **Unit 4** (Pattern & Motion Analysis): Modules 4, 6, 7 — K-Means clustering, YOLOv8 (modern ANN), background subtraction (MoG), optical flow (KLT/Farneback), object tracking
