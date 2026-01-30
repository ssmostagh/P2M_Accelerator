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

from google import genai
from google.genai import types

class Optimizer:
    def __init__(self, model_name="gemini-3-pro-preview"):
        self.client = genai.Client(vertexai=True, project="wortz-project-352116", location="global")
        self.model_name = model_name
        self.history = []
        self.best_score = -1.0
        self.best_prompt = ""

    def optimize(self, current_prompt: str, feedback_data: list) -> str:
        # feedback_data is a list of dicts: { 'id': str, 'scores': dict, 'reasoning': str }
        
        # 1. Analyze Current Performance
        current_scores = {"base": 0.0, "arrow": 0.0, "text": 0.0}
        n = len(feedback_data)
        if n > 0:
            for item in feedback_data:
                current_scores["base"] += item['scores']['base']
                current_scores["arrow"] += item['scores']['arrow']
                current_scores["text"] += item['scores']['text']
            current_scores = {k: v/n for k, v in current_scores.items()}
        
        avg_score = sum(current_scores.values()) / 3
        
        # Update best prompt if current is better
        if avg_score > self.best_score:
            self.best_score = avg_score
            self.best_prompt = current_prompt

        # 2. Build Trajectory History for Context
        # Limit history to last 5 entries to avoid token limit issues, but always include the best one if not present
        trajectory_text = ""
        recent_history = self.history[-5:]
        
        for i, entry in enumerate(recent_history):
            trajectory_text += f"-- Attempt {i+1} --\n"
            trajectory_text += f"Prompt:\n{entry['new_prompt']}\n"
            trajectory_text += f"Feedback Summary: {entry['feedback_summary']}\n"
            trajectory_text += f"Score: {entry['score']:.2f}\n\n"

        # 3. Construct Meta-Prompt with Trajectory and Logic
        meta_prompt = f"""
        You are an expert Prompt Optimization System for a multimodal AI.
        Your goal is to maximize: Base Image Preservation, Arrow Placement, and Text Accuracy.
        
        --- OPTIMIZATION TRAJECTORY ---
        {trajectory_text}
        
        --- CURRENT ATTEMPT ---
        Current Prompt:
        \"\"\"{current_prompt}\"\"\"
        
        Current Scores: {current_scores}
        
        Failed Examples (Analysis):
        {self._format_failures(feedback_data)}
        
        --- INSTRUCTIONS ---
        1. Analyze the trajectory: what tried to improve but failed? what worked well?
        2. Analyze the current failures: why did the model miss arrows or text?
        3. Propose a NEW IMPROVED PROMPT.
        
        Strategies to consider:
        - Reasoning: Explicitly ask the model to "think step-by-step" before generating.
        - Knowledge Injection: Add a few-shot example if accuracy is low.
        - Constraint Refinement: If base image is changing, strengthen the negative constraint.
        
        --- OUTPUT FORMAT ---
        You must output strictly in this format:
        
        Reasoning:
        [Your step-by-step analysis of why the previous prompt failed and how you are fixing it]
        
        Prompt:
        [The full text of the new prompt template. Must contain {{annotations}}]
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=meta_prompt
            )
            
            raw_output = response.text.strip()
            
            # Simple parsing
            new_prompt = ""
            reasoning = ""
            
            if "Prompt:" in raw_output:
                parts = raw_output.split("Prompt:")
                reasoning = parts[0].replace("Reasoning:", "").strip()
                new_prompt = parts[1].strip()
            else:
                # Fallback if format is broken
                new_prompt = raw_output.replace("Reasoning:", "").strip()
            
            # Clean up potential markdown code blocks around prompt
            if new_prompt.startswith("```"):
                new_prompt = new_prompt.strip("`").strip()
                if new_prompt.startswith("markdown") or new_prompt.startswith("txt"):
                    new_prompt = new_prompt.split("\n", 1)[1]
            
            # Ensure placeholder exists
            if "{annotations}" not in new_prompt:
                new_prompt += "\n\nAnnotations:\n{annotations}"
                
            self.history.append({
                "old_prompt": current_prompt,
                "new_prompt": new_prompt,
                "feedback_summary": str(current_scores),
                "score": avg_score,
                "reasoning": reasoning
            })
            
            return new_prompt
            
        except Exception as e:
            print(f"Optimization failed: {e}")
            return current_prompt

    def _format_failures(self, feedback_data):
        # Helper to summarize top failures
        failures = [f for f in feedback_data if sum(f['scores'].values())/3 < 9.0]
        # Sort by lowest score
        failures.sort(key=lambda x: sum(x['scores'].values()), reverse=False)
        
        summary = ""
        for item in failures[:3]: # Top 3 worst failures
            summary += f"Example {item['id']} (Scores: {item['scores']}):\n"
            summary += f"  - Reasoning: {item['reasoning']}\n"
            summary += f"  - Actionable Feedback: {item.get('actionable_feedback', 'No feedback provided')}\n"
        return summary if summary else "None. All examples scored high."
