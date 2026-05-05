# 🧠 Gemini Prompt Instructions Directory

This document provides a comprehensive breakdown of all the **Gemini 2.5 and 3.1** prompt templates governing the Technical Fashion Illustrator pipeline inside `server.js`.

---

## 🔍 1. Initial Analysis Endpoints

### 📝 A. Garment Description Generator
*   **Model**: `gemini-3.1-pro-preview` / `gemini-3.1-flash-image-preview`
*   **Trigger**: Sub-step called before initial image generation to identify descriptors.

```text
Analyze this garment image and provide a detailed description including:
- Type of garment (e.g., t-shirt, dress, jacket)
- Style and fit (e.g., casual, formal, slim-fit, oversized)
- Color(s) and color patterns
- Fabric texture and material appearance
- Key design features (e.g., collar type, sleeves, pockets, buttons, zippers)
- Any patterns, prints, or graphics
- Overall aesthetic and fashion category

Provide a comprehensive description that would help recreate this garment accurately in a virtual try-on.
```

### 📋 B. Sketch Tech Pack Analyzer
*   **Model**: `gemini-3.1-pro-preview`
*   **Trigger**: Technical descriptor breakdown identifying construction anchors.

```text
Analyze this fashion design sketch and provide a detailed technical description of THE GARMENT ONLY.

CRITICAL INSTRUCTION - GARMENT vs ACCESSORIES:
First, identify what is the actual GARMENT (the clothing item itself) versus STYLING ACCESSORIES (items worn with the garment for styling purposes only).

GARMENT = The clothing item being designed (dress, top, jacket, pants, skirt, etc.)
ACCESSORIES TO EXCLUDE = gloves, jewelry, bags, shoes, hats, scarves, separate belts (unless integral to garment construction), watches, sunglasses, other styling props

YOUR TASK: Provide a technical description of ONLY THE GARMENT. Do not describe or mention any styling accessories.

[Sub-headings tracked: TYPE, PROPORTIONS & MEASUREMENTS, SILHOUETTE, CONSTRUCTION DETAILS, DESIGN ELEMENTS]
```

---

## 🎨 2. Image Generation Endpoints

### 📸 A. 3D Photorealistic Rendering (Front & Back)
*   **Model**: `gemini-3.1-pro-preview` / `gemini-3.1-flash-image-preview`
*   **Trigger**: Generates high-fidelity ghost mannequin view.

```text
Generate ONE image showing BOTH front AND back photorealistic renderings side by side. Front view on LEFT, back view on RIGHT. 
CRITICAL SPACING: Leave significant white space between the two views - the gap should be AT LEAST 20% of the garment width to ensure they are clearly separated and do NOT overlap or touch. 
Both views must be the same size and perfectly aligned vertically. 

[Suffix Requirements]:
Create a photorealistic 3D rendering of the garment displayed on a neutral, ghost mannequin against a clean, light gray studio background... Use ray-traced rendering techniques for authentic material...
[Consistency Suffix]:
CRITICAL CONSISTENCY REQUIREMENTS: The front and back views MUST represent the SAME garment and maintain perfect consistency in length, silhouette, sleeves, etc.
```

### 📐 B. Technical Flat Board (PNG)
*   **Model**: `gemini-3.1-flash-image-preview`
*   **Trigger**: Blueprint outline board.

```text
Generate ONE technical flat showing BOTH front AND back views side by side. Front on LEFT, back on RIGHT, small gap. Both same size, aligned. 

[ABSOLUTE REQUIREMENTS Suffix]:
1) ONLY thin black lines/outlines on pure white background - NO GREY TONES WHATSOEVER 
2) ZERO fills, ZERO colors, ZERO shading, ZERO textures, ZERO gradients 
3) Show seam lines, stitching, topstitching, and all construction details ONLY as thin black outlines 
4) The garment should be laid completely flat as if viewed from directly above on a table 
5) NO SOLID BLACK AREAS 
6) ABSOLUTELY NO HUMAN BODY, NO MANNEQUIN, NO MODEL 
7) EXCLUDE ALL STYLING ACCESSORIES
```

---

## 🖍️ 3. Annotations & Overlays Endpoints

### 🏷️ A. Feature Identification Trigger
*   **Model**: `gemini-3.1-pro-preview`
*   **Prompt**:
```text
Identify the key technical components of this garment that require callouts in a manufacturing tech pack.
Return a simple list of 5-8 specific items (e.g., "Ribbed Collar", "Sleeve Hem", "Side Seam Zipper", "Kangaroo Pocket").
Focus on construction details, trims, and fasteners. Do not create full sentences.
```

### 📍 B. CAD Arrows Overlay overlay
*   **Model**: `gemini-3.1-flash-image-preview`
*   **Trigger**: Places Red CAD overlay notes.

```text
You are an expert **Technical Fashion Illustrator** specializing in CAD overlays. Your task is to take a provided technical flat illustration and overlay specific red text and arrows onto it.

**CRITICAL MANDATE:** OVERLAY ONLY: Your output must be the **exact original image** with ONLY red text and red arrows added on top. DO NOT REDRAW.

**STEP-BY-STEP PLACEMENT LOGIC:**
-   **Rule A (Inside Rule):** neck items go on FRONT view (Left).
-   **Rule B (Back Rule):** explicit back-exterior terms go on BACK view (Right).
-   **Rule C (Default):** All elsewhere.

**Execution:** Draw verbatim RED TEXT in nearest empty whitespace with a thin RED LINE pointing to the feature edge spot.
```

---

## 📐 4. Scalar Vector (SVG) Outline Tracing

*   **Model**: `gemini-3.1-pro-preview`
*   **Prompt**:
```text
You are an expert fashion illustrator and SVG developer.
Task: Convert this clean raster technical flat illustration into a scalable vector XML SVG file for Adobe Illustrator.

Requirements:
1. Output ONLY valid, clean <svg>...</svg> code.
2. Use black strokes (#000000) for paths and transparent or white fills.
3. ASPECT RATIO SAFETY: The <svg viewBox="..."> dimensions MUST perfectly match the height/width ratio of the input image canvas to prevent any vertical or horizontal stretching distortion.
4. TRACE ACCURACY: Focus on exact silhouette node tracing. Capture specific curved closures without reverting to generic polygonal templates.
5. CONTINUOUS PATHS: Wrap outer silhouette paths in SINGLE continuous closed vectors (d="..." Z).
6. SMOOTH BÉZIER: Avoid rigid polygonal lines (L) for organic fashion contours. Heavily utilize C (Cubic Bézier) or S curve commands for smooth drawing vectors flow.
7. JOINT CONNECTIVITY: Ensure any collars, lapels, and shoulders REST FLUSH on main torso anchors rather than floating.
```
