# VisionLab — Intelligent Image & Video Analysis Platform
**CSE3010 Computer Vision | Full-Stack Academic Project**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat&logo=python)](https://python.org)
[![OpenCV](https://img.shields.io/badge/CV-OpenCV%204.10-5C3EE8?style=flat&logo=opencv)](https://opencv.org)
[![YOLOv8](https://img.shields.io/badge/Inference-YOLOv8n-FF6F00?style=flat)](https://github.com/ultralytics/ultralytics)
[![Frontend](https://img.shields.io/badge/UI-Vanilla%20HTML5%20%2F%20CSS3%20%2F%20ES6-E34F26?style=flat)](https://developer.mozilla.org)
[![License](https://img.shields.io/badge/Course-CSE3010-blue?style=flat)](#cse3010-syllabus-alignment)

---

## 1. Project Overview

**VisionLab** is a full-featured, interactive Computer Vision platform designed and engineered for academic coursework in **CSE3010 Computer Vision**. It bridges the gap between theoretical mathematical formulation and empirical computer vision experimentation.

The platform provides a browser-based, dark glassmorphism interface coupled with a high-throughput **FastAPI backend** running 30+ Computer Vision algorithms implemented in **OpenCV 4.10, NumPy, scikit-image, and Ultralytics YOLOv8**. Users can upload custom images and videos, interactively manipulate algorithmic parameters (such as kernel dimensions, standard deviation $\sigma$, accumulator thresholds, eigenvalue sensitivity $k$, IoU thresholds, and frame decimation steps), and view live visual comparisons and analytical telemetry in real time.

VisionLab is structured into two core modalities:
- **Mode A: Image Analysis** — Preprocessing & Enhancement, Edge & Feature Extraction, Image Segmentation, and Deep Learning Object Detection.
- **Mode B: Video Analysis** — Video Metadata & Keyframe Extraction, Multi-Object Tracking with Persistent IDs (ByteTrack), and Motion Analysis (Dense & Sparse Optical Flow, Background Subtraction).

---

## 2. Visual Walkthrough & Screenshots

The following actual platform screenshots illustrate VisionLab's visual interface and algorithmic performance on test datasets:

### 2.1 Image Analysis — Preprocessing & Morphological Operations (Module 1)
![Image Preprocessing](Report/Screenshot%20(584).png)
*Figure 1: Morphological Gradient operation applied to a high-resolution color image. Displays side-by-side original and processed view, operation selector matrix, kernel shape controls (Rectangle, Ellipse, Cross), and output dimension metrics.*

---

### 2.2 Image Analysis — Edge & Feature Detection: Canny Edge (Module 2)
![Feature Analysis - Canny Edge](Report/Screenshot%20(582).png)
*Figure 2: Canny multi-stage edge detection executed on an identity card image. High-contrast contour lines accurately segment text, portrait boundaries, and logos using hysteresis thresholding and Gaussian smoothing.*

---

### 2.3 Image Analysis — Deep Learning Object Detection: YOLOv8n (Module 4)
![Object Detection YOLOv8](Report/Screenshot%20(583).png)
*Figure 3: YOLOv8n anchor-free detection inference on a classroom scene. Highlights 10 bounding boxes with class confidence scores (`person`, `dining table`), category breakdown donut chart, and tunable Confidence / IoU NMS sliders.*

---

### 2.4 Video Analysis — Video Metadata & Keyframe Extraction (Module 5)
![Video Information](Report/Screenshot%20(579).png)
*Figure 4: Automated video ingestion and telemetry extraction on high-density surveillance footage (`processed_input.mp4`). Displays resolution (1280×720), 25 FPS, duration, 341 total frames, file size, and evenly-spaced keyframe strip previews.*

---

### 2.5 Video Analysis — Multi-Object Tracking with ByteTrack (Module 6)
![Video Multi-Object Tracking](Report/Screenshot%20(581).png)
*Figure 5: YOLOv8n + ByteTrack multi-object tracking across video frames. Shows 21 unique objects tracked across 68 processed frames, annotated keyframe samples with persistent Track IDs (`#1`, `#108`, `#109`, `#110`), category frequency charts, and tracking telemetry table.*

---

## 3. Core Features & Module Breakdown

VisionLab implements **7 comprehensive modules** covering classical and modern computer vision:

### Mode A — Image Analysis

| Module | Name | Features & Algorithms Implemented |
|---|---|---|
| **Module 1** | **Image Preprocessing & Enhancement** | • **11 Classical Operations**: Original, Grayscale, Resize (10–200%), Gaussian Blur (tunable kernel 3–31), Median Filter, Laplacian Sharpening.<br>• **Histogram Processing**: Intensity distribution generation, Global Histogram Equalization.<br>• **Brightness & Contrast**: Linear scale $(\alpha)$ and bias $(\beta)$ transformation.<br>• **Thresholding**: Otsu's Global, Adaptive Mean, Adaptive Gaussian, and Manual thresholding.<br>• **Mathematical Morphology**: Erosion, Dilation, Opening, Closing, Gradient with Rectangular, Elliptic, or Cross structuring elements. |
| **Module 2** | **Feature & Edge Analysis** | • **Gradient Operators**: Sobel 1st order derivative kernels, Laplacian 2nd order operator.<br>• **Canny Edge Detector**: Multi-stage pipeline with Gaussian smoothing, gradient magnitude/direction, Non-Maximum Suppression (NMS), and dual-threshold hysteresis.<br>• **Laplacian of Gaussian (LoG)**: Multi-scale zero-crossing edge detector.<br>• **Hough Transform**: Probabilistic Hough line accumulator voting for linear geometric feature extraction.<br>• **Harris Corner Detector**: Eigenvalue analysis of auto-correlation matrix $M$ with tunable sensitivity $k$.<br>• **SIFT (Scale-Invariant Feature Transform)**: Difference-of-Gaussians (DoG) scale-space extrema and 128-dimensional invariant keypoint descriptors.<br>• **HOG (Histogram of Oriented Gradients)**: Pedestrian and structural descriptor with orientation bins and cell normalizations. |
| **Module 3** | **Image Segmentation** | • **K-Means Clustering**: Unsupervised vector quantization in RGB/CIELAB color space with iterative centroid re-estimation ($k=2$ to $k=10$).<br>• **Mean Shift Segmentation**: Non-parametric density mode seeking algorithm for clustering image spatial-color domains.<br>• **Region Growing**: 4-connected seeded pixel growth based on intensity variance and threshold similarity.<br>• **Edge-Based Segmentation**: Contour boundary extraction and topological hierarchical polygon approximation.<br>• **Threshold Segmentation**: Multi-level binary mask segmentation. |
| **Module 4** | **Deep Learning Object Detection** | • **YOLOv8n Single-Shot Detector**: Anchor-free deep convolutional neural network pretrained on MS COCO (80 object classes).<br>• **Interactive Parameter Sweeps**: Live adjustment of Confidence Threshold ($0.10$ to $0.90$) and IoU Non-Maximum Suppression ($0.10$ to $0.90$).<br>• **Visual Analytics**: Interactive category breakdown donut chart, detection badges, total object counts, and bounding box coordinate metadata. |

### Mode B — Video Analysis

| Module | Name | Features & Algorithms Implemented |
|---|---|---|
| **Module 5** | **Video Information & Keyframes** | • **Stream Decoding**: Ingests MP4, AVI, MOV, MKV using `cv2.VideoCapture`.<br>• **Metadata Telemetry**: Frame resolution, frame rate (FPS), total frame count, playback duration, and file size in MB.<br>• **Keyframe Extraction**: Uniformly sampled temporal keyframe strip with frame index labels (`f0`, `f48`, `f97`...) for quick scene summarization. |
| **Module 6** | **Multi-Object Detection & Tracking** | • **ByteTrack + YOLOv8**: Modern multi-object tracker that associates both high-confidence and low-confidence detection boxes using Kalman Filter spatial prediction and Hungarian bipartite matching.<br>• **Persistent Track IDs**: Re-identifies and maintains object track IDs across video frames.<br>• **Temporal Decimation**: Configurable frame decimation step ($1$ to $30$) balancing tracking precision against processing speed.<br>• **Tracking Dashboard**: Tracked object table with individual track IDs, class labels, and max confidence bars alongside category frequency histograms. |
| **Module 7** | **Motion Analysis & Optical Flow** | • **Farneback Dense Optical Flow**: Two-frame polynomial expansion calculating motion vector field $(u, v)$ with HSV color wheel visualization (hue = angle, saturation = magnitude).<br>• **Lucas-Kanade Sparse Optical Flow**: Pyramidal KLT feature tracker calculating motion vectors on Shi-Tomasi good features.<br>• **Background Subtraction (MOG2)**: Adaptive Gaussian Mixture Model segmenting foreground moving pixels in dynamic scenes.<br>• **Background Subtraction (KNN)**: K-Nearest Neighbors background model resilient to gradual illumination shifts.<br>• **Motion Analytics**: Polar area chart showing 8-cardinal motion direction distribution and temporal motion magnitude series. |

---

## 4. Technologies & Tools Used

### Backend Architecture
- **Language**: Python 3.13 / 3.9+
- **API Framework**: **FastAPI** (asynchronous ASGI server, automated OpenAPI / Swagger documentation)
- **ASGI Server**: **Uvicorn**
- **Computer Vision Core**: **OpenCV 4.10** (`opencv-python-headless`), **NumPy >= 2.0**, **SciPy**, **scikit-image**
- **Deep Learning**: **Ultralytics YOLOv8n** (PyTorch / ONNX inference engine)
- **Data Validation & Serialisation**: **Pydantic v2**, `python-multipart`

### Frontend Architecture
- **Structure & Logic**: **Vanilla HTML5 & ES6 JavaScript** (Single-Page Application architecture with zero heavy frameworks)
- **Styling**: **Modern Vanilla CSS3** (Curated dark glassmorphism design system, CSS custom properties, backdrop blur filters)
- **Visual Analytics**: **Chart.js 4.4** (Distribution histograms, category frequency charts, polar motion vectors)
- **Graphics & Overlays**: **HTML5 Canvas 2D API** and **Three.js r128 WebGL fragment shader**

---

## 5. Project Directory Structure

```
CV-Vityarthi/
├── backend/
│   ├── main.py                     # FastAPI application entrypoint & CORS middleware
│   ├── requirements.txt            # Python dependencies (OpenCV, YOLO, FastAPI, etc.)
│   ├── services/
│   │   ├── cv_utils.py             # Reusable OpenCV image/video encoding & transformations
│   │   └── yolo_service.py         # Lazy singleton wrapper for YOLOv8 & ByteTrack
│   └── routers/
│       ├── image_processing.py     # Module 1: Preprocessing & Enhancement
│       ├── feature_analysis.py     # Module 2: Canny, Sobel, Harris, SIFT, HOG, Hough
│       ├── segmentation.py         # Module 3: K-Means, Mean Shift, Region Growing
│       ├── object_detection.py     # Module 4: YOLOv8n image detection
│       ├── video_analysis.py       # Module 5: Video metadata & keyframe extraction
│       ├── video_detection.py      # Module 6: YOLOv8 + ByteTrack multi-object tracking
│       └── motion_analysis.py      # Module 7: Farneback Flow, Lucas-Kanade, MOG2/KNN
├── frontend/
│   ├── index.html                  # Single-page application root
│   ├── css/
│   │   └── styles.css              # Dark glassmorphism design system & UI tokens
│   └── js/
│       ├── api.js                  # Asynchronous REST client wrapper
│       ├── app.js                  # Hash-based SPA router and lifecycle manager
│       ├── components/
│       │   ├── dashboard.js        # Chart.js renderers (histograms, polar, donut charts)
│       │   ├── progressOverlay.js  # Loading spinner & progress overlay controller
│       │   └── toast.js            # Toast notification system
│       └── pages/
│           ├── home.js             # Overview landing page & syllabus grid
│           ├── architecture.js     # Interactive System Architecture pipeline view
│           ├── image_mode.js       # Modules 1–4 interactive interface & split view
│           └── video_mode.js       # Modules 5–7 interactive interface & tracking tables
├── Report/                         # Course evaluation screenshots & visual demonstrations
│   ├── Screenshot (579).png        # Video Metadata & Keyframes
│   ├── Screenshot (581).png        # Video Multi-Object Tracking
│   ├── Screenshot (582).png        # Canny Edge Feature Analysis
│   ├── Screenshot (583).png        # Deep Learning Object Detection
│   └── Screenshot (584).png        # Morphological Preprocessing
├── start.bat                       # Automated one-click launch script (Windows)
├── statement.md                    # Academic problem statement, scope & target users
└── README.md                       # Comprehensive project documentation
```

---

## 6. Steps to Install & Run

### Prerequisites
- **Python**: Version 3.9 or higher (tested and verified on Python 3.13)
- **Web Browser**: Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari
- **Internet Access**: Required only on initial launch to auto-download the YOLOv8n model weights (~6 MB)

---

### Option A: One-Click Launch (Recommended for Windows)

Simply double-click `start.bat` in the project root directory, or execute in PowerShell / Command Prompt:

```cmd
start.bat
```

This automated script will:
1. Detect Python and verify environment requirements.
2. Automatically create a local virtual environment in `backend/.venv` (if not already present).
3. Activate the virtual environment and install all dependencies from `requirements.txt`.
4. Launch the FastAPI backend on `http://localhost:8000`.

Then open a **second terminal window** to serve the frontend:

```cmd
cd frontend
python -m http.server 5500
```

Open your browser and navigate to **`http://localhost:5500`**.

---

### Option B: Manual Installation (Cross-Platform)

#### 1. Setup and Launch Backend
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On Linux / macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend verification:
- API Root: `http://localhost:8000`
- Interactive OpenAPI Swagger Docs: `http://localhost:8000/api/docs`
- Health Check: `http://localhost:8000/api/health`

#### 2. Setup and Launch Frontend
In a separate terminal window:
```bash
# Navigate to frontend directory
cd frontend

# Start lightweight HTTP server
python -m http.server 5500
```

Open your browser and visit: **`http://localhost:5500`**.

---

## 7. Instructions for Testing

### 7.1 Automated API Health & Endpoint Verification

You can verify API responsiveness using `curl` or PowerShell:

#### Health Check
```bash
curl -X GET http://localhost:8000/api/health
```
**Expected Response:**
```json
{"status":"ok","service":"VisionLab API","version":"1.0.0"}
```

#### Image Preprocessing Test (Grayscale)
```bash
curl -X POST "http://localhost:8000/api/image/process" \
  -F "file=@test_image.jpg" \
  -F "operation=grayscale"
```
**Expected Response:** JSON containing `original_image` (DataURI), `processed_image` (DataURI), `stats` (`{"width": ..., "height": ..., "channels": 1}`), and operation description.

#### Object Detection Test (YOLOv8n)
```bash
curl -X POST "http://localhost:8000/api/image/detect" \
  -F "file=@test_image.jpg" \
  -F "conf=0.35" \
  -F "iou=0.50"
```
**Expected Response:** JSON containing `annotated_image` with colored bounding boxes, detection summary count, and category distributions.

---

### 7.2 Interactive Browser UI Testing Checklist

| Test Case | Module | Action | Expected Output |
|---|---|---|---|
| **TC-01** | Mode Navigation | Click **Image Analysis**, **Video Analysis**, and **Architecture** in the sidebar. | Instant view transition without page reload; URL hash updates (`#image`, `#video`, `#architecture`). |
| **TC-02** | Preprocessing (Otsu) | In Image Mode $\rightarrow$ Preprocessing: Upload an image, choose **Threshold**, select **Otsu's Global**, click **Apply Operation**. | Processed view displays binary binarized image; stats card updates with calculated Otsu threshold value. |
| **TC-03** | Feature Detection (SIFT) | In Image Mode $\rightarrow$ Feature Analysis: Choose **SIFT**, adjust max keypoints slider to 500, click **Analyze Features**. | Rendered image displays SIFT keypoints with scale circles and gradient orientation vectors; keypoint count displayed in stats. |
| **TC-04** | Segmentation (K-Means) | In Image Mode $\rightarrow$ Segmentation: Choose **K-Means**, set clusters $k=4$, click **Run Segmentation**. | Segmented output clusters pixels into 4 dominant color centroids; cluster stats grid generated. |
| **TC-05** | Object Detection (YOLO) | In Image Mode $\rightarrow$ Object Detection: Upload an image containing people/objects, click **Detect Objects**. | Bounding boxes drawn with labels and confidence scores; interactive category breakdown donut chart renders. |
| **TC-06** | Video Metadata | In Video Mode $\rightarrow$ Video Info: Upload an MP4 video, set keyframes to 8, click **Extract Info**. | Video resolution, frame rate, duration, and frame count displayed; 8 evenly-spaced keyframe thumbnails generated. |
| **TC-07** | Video Tracking | In Video Mode $\rightarrow$ Detection & Tracking: Set confidence 0.35, frame step 5, click **Track Objects**. | Annotated frames display tracking boxes with persistent `#ID` numbers; tracked object table lists class and max confidence. |
| **TC-08** | Optical Flow | In Video Mode $\rightarrow$ Motion Analysis: Select **Optical Flow (Farneback)**, click **Analyze Motion**. | HSV-encoded dense flow visualization renders; polar motion direction distribution chart displays dominant motion vectors. |

---

## 8. CSE3010 Syllabus Alignment

| Course Unit | Syllabus Topics | VisionLab Modules & Implementation |
|---|---|---|
| **Unit 1: Low-Level Vision & Filtering** | Spatial domain filtering, 2D convolution kernels, noise reduction, histogram processing, thresholding | • **Module 1**: Gaussian blur, median smoothing, Laplacian sharpening convolution kernels, Otsu & adaptive thresholding, histogram equalization. |
| **Unit 2: Feature Detection & Matching** | First/second-order derivative edge detectors, multi-scale detection, corner detection, interest points, invariant feature descriptors | • **Module 2**: Sobel gradients, Canny edge detection (smoothing, gradient, NMS, hysteresis), LoG zero-crossings, Harris Corner eigenvalues, SIFT DoG keypoints & 128-D descriptors, HOG pedestrian features, Hough transform lines. |
| **Unit 3: Image Segmentation** | Clustering algorithms, region-based methods, boundary contours, color space vector quantization | • **Module 3**: K-Means clustering, Mean-Shift density mode seeking, seeded 4-connected Region Growing, edge contour boundary extraction. |
| **Unit 4: Recognition, Motion & Tracking** | Deep learning object recognition, temporal motion estimation, optical flow equations, multi-object tracking | • **Module 4**: Single-shot CNN object detection (YOLOv8n).<br>• **Module 5**: Video stream decoding & keyframe extraction.<br>• **Module 6**: Kalman Filter + Hungarian matching multi-object tracking (ByteTrack).<br>• **Module 7**: Farneback polynomial expansion dense optical flow, Lucas-Kanade pyramidal KLT sparse tracker, MOG2 Gaussian Mixture background subtraction. |

---

## 9. Academic Viva & Presentation Notes

When presenting this project for evaluation:
1. **Explain the Hybrid Pipeline**: Highlight how VisionLab contrasts classical mathematical feature extractors (Canny, Harris, SIFT) with modern deep learning representations (YOLOv8).
2. **Demonstrate Hyperparameter Sensitivity**: Show live slider sweeps (e.g. Canny low/high thresholds, SIFT keypoint counts, K-Means cluster count $k$) to illustrate the algorithm's mathematical behavior.
3. **Showcase Multi-Object Tracking**: Walk through how ByteTrack uses Kalman state filters to predict target trajectories even during temporary occlusion.
4. **Discuss the Architecture**: Use the built-in **System Architecture** view to illustrate the decoupled presentation layer, asynchronous ASGI streaming gateway, and memory-safe image handling.

---

## 10. License & Authorship

- **Course**: CSE3010 Computer Vision
- **Project Title**: VisionLab — Intelligent Image & Video Analysis Platform
- **Version**: 1.0.0
- Developed as an academic laboratory project strictly adhering to the CSE3010 curriculum.
