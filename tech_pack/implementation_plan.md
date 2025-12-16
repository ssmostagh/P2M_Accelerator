# Implementation Plan: Prompt Optimization Application

## Goal
Build an application to optimize prompts for generating annotated technical pack images using `gemini-3-pro-image-preview`.

## Data
- **Source**: `Testcase.jsonl` and `Images/` directory.
- **Structure**: 9 pairs of (Empty Sketch, Reference Sketch, Annotations).
- **Split**: 
    - **Training**: 6 pairs (default) or adaptive split (e.g., last 2 for val) if dataset is small.
    - **Validation**: Adaptive (e.g., 2 pairs) or remaining pairs.
    *Current Status*: Dataset has 6 items total. Split is 4 Train / 2 Val.

## Components

### 1. Data Loader (`data_loader.py`)
- Parses JSONL.
- Pairs `EMP` (input) and `REF` (ground truth) images.
- Extracts text annotations.

### 2. Generator (`generator.py`)
- **Model**: `gemini-3-pro-image-preview`.
- **Input**: Empty Image + Prompt (Template populated with annotations).
- **Output**: Generated Image.

### 3. Evaluator (`evaluator.py`)
- **Model**: `gemini-3-pro-preview` (Vision).
- **Rubric**:
    1. **Base Image Preservation**: 1-10 (How well it matches the EMP image structure).
    2. **Arrow Placement**: 1-10 (How well arrows match the REF image).
    3. **Text Accuracy**: 1-10 (How well text matches the REF image annotations).
- **Output**: JSON with scores and reasoning.

### 4. Optimizer (`optimizer.py`)
- **Model**: `gemini-3-pro-preview` (Text/Reasoning).
- **Algorithm**: Trajectory-based OPRO with Chain-of-Thought (CoT).
- **Logic**:
    - Analyzes optimization trajectory (past prompts + scores).
    - Identifies failure patterns using CoT reasoning.
    - Proposes new prompts with specific strategies (e.g., Knowledge Injection).

### 5. Main Loop (`main_optimization.py`)
- **Initialization**: Baseline prompt.
- **Iterations**:
    - Generate images for Training Set.
    - Evaluate images.
    - Aggregate metrics.
    - If not converged: Optimize prompt using Trajectory History.
- **Final Step**: Validate on Validation Set.

### 6. Utilities
- **Check Status (`check_status.py`)**:
    - Reads `trace.json`.
    - Reports current epoch, scores, and best epoch.

## Execution
- [/] Run the optimization loop for **10 iterations** (with early stopping if scores > 9.0).
- [/] Log all results
- [x] Run Validation Check
- [x] Run 10 Epochs
- [x] Output the best prompt

## Status
- **Completed**: 10 Epochs run.
- **Latest Results (Epoch 9)**: Base 10.0, Arrow 3.25, Text 7.75.
- **Validation**: Validation data correctly separated (2 items).
- **Architecture**: Validated (30 epochs configuration ready).
- **Evaluation**: Updated with CoT, Specificity, and Actionable Feedback.
