# VisionLab — Project Statement Document
**CSE3010 Computer Vision | Academic System Specification**

---

## 1. Problem Statement

Computer Vision is fundamentally an empirical and mathematical discipline. In university curricula—specifically within course syllabi such as **CSE3010 Computer Vision**—students are taught rigorous theoretical foundations:
- 2D spatial convolutions, Gaussian blurring kernels, and Laplacian second derivatives.
- Multi-stage gradient analysis and hysteresis thresholding in the Canny operator.
- Autocorrelation matrices, structural tensors, and eigenvalue sensitivity in the Harris corner detector.
- Difference-of-Gaussians (DoG) scale-space approximations and 128-dimensional invariant descriptors in SIFT.
- Gradient orientation histogram binning in HOG descriptors.
- Unsupervised vector quantization in K-Means clustering and density mode seeking in Mean Shift.
- Brightness constancy assumptions in optical flow equations (Farneback and Lucas-Kanade).
- Kalman state space filtering and bipartite graph matching in multi-object tracking.

### The Educational & Practical Challenges:
1. **The Disconnect Between Theory and Visual Realisation**:
   In traditional laboratory environments, students typically run disconnected Python command-line scripts or static Jupyter notebook cells. Modifying a hyperparameter (e.g., standard deviation $\sigma$, low/high hysteresis thresholds, or cluster count $k$) requires manually editing code, saving files, and re-executing scripts. This slow feedback loop prevents students from gaining deep visual intuition regarding algorithmic sensitivity and stability.

2. **The Isolation of Classical and Modern Computer Vision**:
   Academic coursework often treats classical image processing (spatial convolutions, morphological mathematics, edge extractors) and contemporary deep learning (convolutional neural networks, single-shot detectors, Kalman trackers) as distinct, unrelated silos. Students struggle to understand how classical representations provide the foundational principles for modern spatial-temporal vision systems.

3. **Inaccessibility of Temporal Video Analysis**:
   Video-level computer vision concepts—such as dense optical flow fields, temporal feature tracking, and multi-object identity persistence—are inherently dynamic. Static image outputs cannot convey the behavior of motion vectors or tracking trajectory maintenance under occlusion.

4. **Lack of a Unified, Interactive Academic Laboratory**:
   There is no standardized, zero-friction, browser-accessible software platform that brings together low-level filtering, mid-level feature extraction, high-level image segmentation, deep learning object detection, and temporal video tracking within a cohesive, responsive user interface.

**VisionLab** directly addresses these challenges by delivering an interactive, full-stack Computer Vision laboratory engineered specifically for the CSE3010 curriculum.

---

## 2. Scope of the Project

The scope of VisionLab is structured into clear functional domains, separating in-scope core implementations from planned future expansions.

### 2.1 In-Scope Deliverables

#### Mode A — Image Analysis (Modules 1–4)
- **Module 1: Image Preprocessing & Enhancement**
  - Spatial domain 2D convolutions (Gaussian blur, Median filter, Laplacian sharpening).
  - Intensity transformations (Grayscale conversion, Linear contrast scaling $\alpha$ and brightness offset $\beta$).
  - Histogram processing (Intensity distribution generation, Global Histogram Equalization).
  - Thresholding algorithms (Otsu's automated intra-class variance minimization, Adaptive Mean, Adaptive Gaussian, and Manual value clipping).
  - Mathematical morphology (Dilation, Erosion, Opening, Closing, Morphological Gradient with rectangular, elliptic, and cross structuring elements).
- **Module 2: Edge & Feature Analysis**
  - First-order derivative gradient operators (Sobel filter in horizontal and vertical orientations).
  - Second-order derivative operators (Laplacian filter).
  - Multi-stage optimal edge detection (Canny algorithm with tunable hysteresis thresholds and Gaussian pre-smoothing).
  - Multi-scale edge detection (Laplacian of Gaussian zero-crossings).
  - Geometric feature detection (Probabilistic Hough Transform for line segment extraction).
  - Invariant interest point detection (Harris Corner detector with tunable eigenvalue sensitivity $k$).
  - Scale-invariant feature detection (SIFT with scale-space extrema and keypoint descriptor extraction).
  - Dense descriptor computation (Histogram of Oriented Gradients for structural representation).
- **Module 3: Image Segmentation**
  - Color-space vector quantization (K-Means clustering with configurable cluster count $k=2$ to $k=10$).
  - Non-parametric density gradient ascent (Mean Shift spatial-color segmentation).
  - Region-based segmentation (4-connected seeded Region Growing based on intensity variance).
  - Boundary-based segmentation (Contour detection and hierarchical polygon approximation).
  - Global intensity threshold mask segmentation.
- **Module 4: Deep Learning Object Detection**
  - Single-shot anchor-free deep CNN detection (Ultralytics YOLOv8n model).
  - 80 COCO object category recognition with bounding boxes and confidence scores.
  - Interactive parameter sweeps for Detection Confidence Threshold ($0.10$ to $0.90$) and IoU Non-Maximum Suppression ($0.10$ to $0.90$).
  - Real-time category distribution visualization (interactive Chart.js donut chart).

#### Mode B — Video Analysis (Modules 5–7)
- **Module 5: Video Metadata & Keyframe Extraction**
  - Video stream decoding for MP4, AVI, MOV, and MKV formats.
  - Telemetry computation: Resolution (width $\times$ height), frame rate (FPS), playback duration, total frame count, and file size.
  - Temporal keyframe extraction: Evenly-spaced keyframe extraction strip with frame indexing.
- **Module 6: Multi-Object Detection & Tracking**
  - Multi-target tracking utilizing YOLOv8n detector coupled with the ByteTrack association algorithm.
  - Persistent track ID assignment and trajectory maintenance across temporal frames.
  - Configurable temporal decimation (frame step $1$ to $30$) to balance throughput against tracking fidelity.
  - Visual output: Annotated sample keyframes, category frequency bar chart, and comprehensive tracking table listing Track ID, Class, and Maximum Confidence.
- **Module 7: Motion Analysis & Optical Flow**
  - Gunnar Farneback dense two-frame polynomial expansion optical flow with HSV color wheel visualization (hue corresponds to direction, saturation to velocity magnitude).
  - Lucas-Kanade pyramidal sparse feature tracking (KLT) on Shi-Tomasi corners.
  - Adaptive Background Subtraction using Gaussian Mixture Models (MOG2) and K-Nearest Neighbors (KNN).
  - Motion analytics: Polar area chart depicting 8-cardinal motion direction distributions and temporal motion magnitude series.

#### System, Architecture & UI Engineering
- High-throughput asynchronous ASGI backend powered by **FastAPI** on **Python 3.13**.
- Automated **OpenAPI / Swagger interactive documentation** at `/api/docs`.
- Zero-framework, lightweight frontend architecture (**Vanilla HTML5, CSS3, ES6 JavaScript**).
- Professional **dark glassmorphism design system** featuring high-contrast typography, backdrop blur filters, and accessible UI controls.
- Interactive **System Architecture documentation** and client-side data export capabilities.
- Automated one-click setup script (`start.bat`) with self-provisioning virtual environments.

---

### 2.2 Out-of-Scope (Deliberate Version 1.0 Boundaries)

To ensure depth of algorithmic implementation and stability for the CSE3010 curriculum, the following areas are deliberately excluded from Version 1.0:
1. **3D Reconstruction & Photogrammetry**:
   Structure-from-Motion (SfM), multi-view stereo, and 3D point cloud generation are omitted in accordance with the project specification.
2. **Generative Image & Video Synthesis**:
   Generative Adversarial Networks (GANs), Variational Autoencoders (VAEs), and Diffusion-based image generation are out of scope. VisionLab focus is analytical and measurement computer vision.
3. **Cloud Authentication & Multi-Tenant Databases**:
   The platform is deliberately architected for local, zero-friction academic evaluation without requiring external cloud databases, user registration, or authentication tokens.

---

## 3. Target Users

VisionLab is tailored for four distinct academic and technical user profiles:

### 3.1 Computer Vision Students (Primary User Base)
- **Profile**: Undergraduate and postgraduate students enrolled in CSE3010 Computer Vision or related courses.
- **Needs**: An intuitive visual platform to validate lecture concepts, experiment with algorithmic hyperparameters, observe failure modes (e.g., noise amplification in Laplacian filtering, over-smoothing in large Gaussian kernels, or under-clustering in K-Means), and capture visual artifacts for lab reports and assignments.

### 3.2 Academic Faculty & Lab Instructors
- **Profile**: Professors, lecturers, and teaching assistants teaching computer vision and image processing.
- **Needs**: A reliable live-demonstration tool for lecture halls and lab practicals to illustrate the mathematical transformation of images in real time without debugging CLI scripts during class.
- **Use in Viva & Evaluation**: Enables examiners to ask students to adjust parameters on the fly and explain the observed visual changes during project assessments.

### 3.3 Computer Vision Researchers & Lab Assistants
- **Profile**: Researchers in academic laboratories prototyping image processing and video analytics pipelines.
- **Needs**: A rapid benchmarking platform to evaluate preprocessing filters, compare segmentation techniques against deep learning detectors, and inspect keyframe motion dynamics on novel datasets.

### 3.4 Junior Software Engineers & Applied AI Developers
- **Profile**: Developers transitioning into applied computer vision and edge AI.
- **Needs**: An end-to-end reference implementation demonstrating how to build a production-grade asynchronous REST API around OpenCV and YOLOv8 with zero-latency browser streaming.

---

## 4. High-Level Features

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                   VisionLab                                      │
│               Intelligent Image & Video Analysis Platform (CSE3010)              │
├────────────────────────────────────────┬─────────────────────────────────────────┤
│         MODE A: IMAGE ANALYSIS         │         MODE B: VIDEO ANALYSIS          │
├────────────────────────────────────────┼─────────────────────────────────────────┤
│ • Module 1: Preprocessing & Enhance    │ • Module 5: Video Metadata & Keyframes  │
│   (11 Filters, Histograms, Morphology) │   (FPS, Resolution, Temporal Strip)     │
│ • Module 2: Edge & Feature Analysis    │ • Module 6: Object Detection & Tracking │
│   (Canny, Harris, SIFT, HOG, Hough)    │   (YOLOv8 + ByteTrack Persistent IDs)   │
│ • Module 3: Image Segmentation         │ • Module 7: Motion Analysis & Flow      │
│   (K-Means, Mean Shift, Region Growing)│   (Farneback, Lucas-Kanade, MOG2/KNN)   │
│ • Module 4: YOLOv8 Object Detection    │                                         │
│   (80 Classes, Interactive NMS & IoU)  │                                         │
├────────────────────────────────────────┴─────────────────────────────────────────┤
│                          CROSS-CUTTING PLATFORM FEATURES                         │
│ • Asynchronous FastAPI Backend (Python 3.13) with Automated OpenAPI Documentation│
│ • Side-by-Side Synchronized Comparative Split View (Original vs. Processed)      │
│ • Interactive Parameter Sweeps (Sliders, Dropdowns, Kernel Selectors)            │
│ • Analytical Visual Dashboards Powered by Chart.js 4.4                           │
│ • Dark Glassmorphism Responsive UI with Built-In Architecture Reference View     │
│ • Automated 1-Click Launch Script (start.bat) with Zero-Configuration Setup      │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Feature 1: Dual Operational Modality (Image & Video Analysis)
VisionLab offers dedicated environments for static image spatial processing and temporal frame-by-frame video processing, accessible via a unified sidebar navigation structure.

### Feature 2: Side-by-Side Comparative Split View
All image processing modules feature synchronized original versus processed image panes. This enables direct visual comparison of edge fidelity, blur degradation, segmentation boundaries, and bounding box placements.

### Feature 3: Interactive Real-Time Parameter Sweeping
Users can dynamically adjust algorithmic hyperparameters—such as Gaussian kernel sizes ($3$ to $31$), SIFT keypoint counts ($50$ to $2000$), K-Means cluster count $k$ ($2$ to $10$), YOLO detection confidence ($0.10$ to $0.90$), and video frame decimation steps ($1$ to $30$)—with immediate visual updates.

### Feature 4: Comprehensive Classical-to-Modern Feature Suite
Spans foundational spatial convolution filters, eigenvalue corner detection, scale-invariant feature transform (SIFT), histogram of oriented gradients (HOG), unsupervised clustering (K-Means, Mean Shift), and state-of-the-art deep neural networks (YOLOv8).

### Feature 5: Multi-Object Tracking with Persistent Identities
Combines YOLOv8n single-shot detection with the ByteTrack multi-object tracking algorithm, using Kalman filtering and Hungarian bipartite matching to retain persistent tracking IDs across video frames even during temporary occlusions.

### Feature 6: Dynamic Quantitative Visual Dashboards
Integrates Chart.js 4.4 to provide quantitative analytical charts alongside image renders:
- Intensity distribution histograms before and after equalization.
- Detection category frequency breakdown donut charts.
- Polar area charts depicting 8-direction motion vector distributions.
- Temporal motion magnitude line graphs across video sequences.

### Feature 7: Modern Dark Glassmorphism UI & Interactive Architecture Pipeline
Built with pure Vanilla HTML5, modern CSS3 custom properties, backdrop blur filters, and accessible typography. Features an interactive **System Architecture** view documenting all five architectural layers for viva and course evaluation.

### Feature 8: Asynchronous REST API with OpenAPI Documentation
Every Computer Vision algorithm is exposed via clean, documented REST endpoints adhering to Pydantic schemas. Includes interactive Swagger UI documentation at `/api/docs` for direct API testing.

---

## 5. Summary

VisionLab successfully fulfills all requirements of the **CSE3010 Computer Vision** course project guidelines. By combining a wide range of classical algorithms with modern deep learning models into an accessible, responsive web application, it provides an exemplary tool for academic study, classroom demonstration, and project evaluation.
