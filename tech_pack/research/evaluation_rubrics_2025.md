# Research: Evaluation Rubrics for Rater LLMs (2025)

## Overview

As LLMs take on the role of evaluators ("Rater LLMs" or "LLM-as-a-Judge"), the design of the evaluation rubric becomes the critical factor in ensuring reliability and usefulness. This document synthesizes current best practices for designing rubrics that achieve high **Specificity**, **Sensitivity**, and provide **Constructive Feedback**.

## 1. Core Principles

### Specificity (Precision)

_Definition_: The ability to correctly identify _why_ a response fails or succeeds without ambiguity.

- **Explicit Criteria**: Avoid vague terms like "good" or "accurate". Instead, use "matches ground truth annotations exactly" or "follows JSON formatting rules without error".
- **Binary/Granular Breakdown**: Break complex evaluations into smaller, binary checks (e.g., "Did it include the header?" Yes/No) before aggregating into a score.
- **Failure Definitions**: Explicitly define what constitutes a failure (e.g., "Score 1 if arrows cross each other").

### Sensitivity (Recall)

_Definition_: The ability to detect subtle nuances and minor errors that might otherwise be overlooked.

- **Nuance Detection**: Use scoring scales (1-10) with detailed descriptors for _each_ level, not just the extremes.
- **Key Information Responsiveness**: The judge must be sensitive to critical details (e.g., specific fashion terminology) where a small change alters meaning.

### Constructive Feedback

_Definition_: Feedback that is actionable and specific, guiding the target model to improve.

- **Actionability**: Feedback must suggest _how_ to fix the error (e.g., "Move the 'Sleeve' arrow 10px up to touch the seam" vs "Arrow placement is wrong").
- **Objectivity**: Critique the output, not the model. Focus on observable facts (pixels, text match).
- **Avoid Overload**: Prioritize the top 1-3 critical errors to avoid confusing the optimizer.

## 2. Best Practices for Implementation

### Chain-of-Thought (CoT) for Judges

Just as CoT improves generation, it improves evaluation. The Rater LLM should be instructed to "think" before it scores.

- **Pattern**: `Input -> Analysis (CoT) -> Score -> Feedback`.
- **Benefit**: Reduces "vibes-based" scoring and enforces adherence to the rubric.

### Role-Playing (Persona)

Assign a specific expert persona to the Rater LLM.

- **Example**: "You are a Senior Technical Illustrator QA Specialist. You are strict, detail-oriented, and intolerant of ambiguity."

### Few-Shot Examples

Provide 1-2 examples of "Perfect", "Mediocre", and "Poor" outputs in the prompt, along with the _correct scores and reasoning_ for each. This "grounds" the model's scoring scale.

## 3. Recommended Rubric Structure for Macy's Tek Pak

Based on this research, the `evaluator.py` rubric should be upgraded to:

### Dimensions

1.  **Base Image Preservation (1-10)**
    - _Specificity_: Did the pixel grid change? Is the resolution identical?
    - _Failure_: Any distortion of the garment silhouette = Score 1.
2.  **Arrow Placement Precision (1-10)**
    - _Sensitivity_: Does the arrow tip touch the _exact_ feature described (e.g., seam vs. area)?
    - _Feedback_: "Arrow for 'Hem' points to center body."
3.  **Text Transcription Accuracy (1-10)**
    - _Specificity_: Exact string match. Typos = penalty.
4.  **Layout Logic (New)**
    - _Constructive_: Are labels grouped logically? Do lines cross?

### Output Schema

```json
{
  "scores": { "base": 9, "arrow": 6, "text": 10 },
  "analysis_step_by_step": "1. Checked base image... 2. Checked arrows...",
  "primary_failure": "Arrow for 'Cuff' crosses the sleeve body.",
  "actionable_feedback": "Route the 'Cuff' arrow from the outside in, avoiding the sleeve body."
}
```

## References

- _LLM-as-a-Judge Best Practices_ (Patronus AI, Galileo)
- _G-Eval Framework_ (DeepEval)
- _Constructive Feedback in AI Systems_ (Stanford, Arxiv)
