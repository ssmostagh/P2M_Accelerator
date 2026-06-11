# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import json
from google import genai
from google.genai import types
from PIL import Image
from pydantic import BaseModel

class EvaluationResult(BaseModel):
    base_image_preservation_score: int
    arrow_placement_score: int
    text_accuracy_score: int
    analysis_step_by_step: str
    primary_failure: str
    actionable_feedback: str
    reasoning: str

class Evaluator:
    def __init__(self, model_name="gemini-3.1-pro-preview"):
        self.client = genai.Client(vertexai=True, project=os.environ.get("GOOGLE_CLOUD_PROJECT"), location="global")
        self.model_name = model_name

    def evaluate(self, ref_image_path: str, emp_image_path: str, generated_image: Image.Image) -> EvaluationResult:
        ref_image = Image.open(ref_image_path)
        emp_image = Image.open(emp_image_path)
        
        prompt = """
        You are a Senior Technical Illustrator QA Specialist. You are strict, detail-oriented, and intolerant of ambiguity. 
        Compare the Generated Image to the Reference Image (Ground Truth) and the Empty Image (Input).

        ### Step 1: Chain-of-Thought Analysis
        Before scoring, you must analyze the image step-by-step:
        1. Check Base Image: Did the pixel grid usually change? Any distortion?
        2. Check Arrows: Trace each arrow. Does it point to the EXACT same pixel location as the Reference?
        3. Check Text: Read every label. Is it a perfect string match?

        ### Step 2: Scoring Criteria (1-10)
        
        **1. Base Image Preservation**
        - Score 10: Pixel-perfect match to Empty Image.
        - Score 1: Any distortion, resampling, or loss of original garment details.
        
        **2. Arrow Placement Precision**
        - Score 10: Tips touch the exact construction feature (seam, hem, hardware) as Reference.
        - Score 5: Pointing to general area but missing specific seam.
        - Score 1: Grossly misplaced or crossing lines.
        
        **3. Text Accuracy**
        - Score 10: Perfect character-for-character transcription.
        - Score 5: Minor typos or case errors.
        - Score 1: Missing labels or hallucinated text.

        ### Step 3: Feedback
        - **Primary Failure**: The single most critical specific error (e.g., "Arrow for 'Hem' points to center body").
        - **Actionable Feedback**: A specific instruction to the Generator to fix the error (e.g., "Route the 'Hem' arrow to touch the bottom edge stitch").

        Provide a JSON response matching the schema.
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[
                    "Reference Image (Ground Truth):", ref_image,
                    "Empty Image (Input):", emp_image,
                    "Generated Image:", generated_image,
                    prompt
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=EvaluationResult
                )
            )
            
            if response.parsed is None:
                raise ValueError("Model returned None for parsed response")
            return response.parsed
            
        except Exception as e:
            print(f"Evaluation failed: {e}")
            # Return a dummy failure result
            return EvaluationResult(
                base_image_preservation_score=0,
                arrow_placement_score=0,
                text_accuracy_score=0,
                analysis_step_by_step="Evaluation failed",
                primary_failure="System Error",
                actionable_feedback="Check system logs.",
                reasoning=f"Evaluation failed: {e}"
            )
