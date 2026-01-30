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

import json
import os
from data_loader import DataLoader
from generator import Generator
from evaluator import Evaluator
from optimizer import Optimizer

def main():
    # 1. Load Data
    base_dir = "/usr/local/google/home/jwortz/macys_tek_pak/macys_tek_pak/data"
    loader = DataLoader(
        os.path.join(base_dir, "JSONL-Files/Testcase.jsonl"),
        os.path.join(base_dir, "Images")
    )
    all_data = loader.load_data()
    
    # Split Data
    # Dataset is small (6 items), so we'll reserve the last 2 for validation
    if len(all_data) > 2:
        train_set = all_data[:-2]
        val_set = all_data[-2:]
    else:
        # Fallback for very small datasets
        train_set = all_data
        val_set = []
    
    # 2. Initialize Components
    generator = Generator() # Uses gemini-3-pro-image-preview
    evaluator = Evaluator()
    optimizer = Optimizer()
    
    # 3. Initial Prompt
    current_prompt = """
You are a technical fashion designer.
Task: Annotate the provided technical sketch with the following callouts.
Callouts:
{annotations}

Instructions:
- Do not change the base image.
- Draw clear arrows pointing to the specific features mentioned.
- Place the text labels near the arrows.
- Ensure text is legible.
    """
    
    trace_log = []
    
    # 4. Optimization Loop
    epochs = 10
    TARGET_SCORE = 9.0
    
    # Ensure trace_assets directory exists
    trace_assets_dir = "trace_assets"
    os.makedirs(trace_assets_dir, exist_ok=True)
    
    for epoch in range(epochs):
        print(f"--- Epoch {epoch + 1}/{epochs} ---")
        
        epoch_feedback = []
        epoch_scores = {"base": 0, "arrow": 0, "text": 0}
        
        for pair in train_set:
            print(f"Processing {pair.id}...")
            
            # Construct full prompt for logging
            annotations_str = "\n".join([f"- {a}" for a in pair.annotations])
            full_prompt = current_prompt.replace("{annotations}", annotations_str)
            
            # Generate
            generated_image = generator.generate(pair.emp_image_path, pair.annotations, current_prompt)
            
            generated_image_path = None
            if generated_image:
                # Save generated image
                generated_image_filename = f"epoch_{epoch}_{pair.id}.png"
                generated_image_path = os.path.join(trace_assets_dir, generated_image_filename)
                generated_image.save(generated_image_path)
            
            if not generated_image:
                print("  Generation failed.")
                epoch_feedback.append({
                    "id": pair.id,
                    "scores": {"base": 0, "arrow": 0, "text": 0},
                    "reasoning": "Generation failed (no image returned).",
                    "source_image": pair.emp_image_path,
                    "generated_image": None,
                    "full_prompt": full_prompt
                })
                continue
            
            # Evaluate
            result = evaluator.evaluate(pair.ref_image_path, pair.emp_image_path, generated_image)
            print(f"  Scores: Base={result.base_image_preservation_score}, Arrow={result.arrow_placement_score}, Text={result.text_accuracy_score}")
            
            epoch_scores["base"] += result.base_image_preservation_score
            epoch_scores["arrow"] += result.arrow_placement_score
            epoch_scores["text"] += result.text_accuracy_score
            
            epoch_feedback.append({
                "id": pair.id,
                "scores": {
                    "base": result.base_image_preservation_score,
                    "arrow": result.arrow_placement_score,
                    "text": result.text_accuracy_score
                },
                "reasoning": result.reasoning,
                "analysis": result.analysis_step_by_step,
                "primary_failure": result.primary_failure,
                "actionable_feedback": result.actionable_feedback,
                "source_image": pair.emp_image_path,
                "ref_image": pair.ref_image_path,
                "generated_image": generated_image_path,
                "full_prompt": full_prompt
            })
            
        # Average Scores
        n = len(train_set)
        avg_scores = {k: v/n for k, v in epoch_scores.items()} if n > 0 else {k: 0 for k in epoch_scores}
        print(f"Epoch Average Scores: {avg_scores}")
        
        # Validation
        print("  --- Validation ---")
        val_feedback = []
        val_scores = {"base": 0, "arrow": 0, "text": 0}
        
        for pair in val_set:
            print(f"  Validating {pair.id}...")
            annotations_str = "\n".join([f"- {a}" for a in pair.annotations])
            full_prompt = current_prompt.replace("{annotations}", annotations_str)
            
            generated_image = generator.generate(pair.emp_image_path, pair.annotations, current_prompt)
            
            generated_image_path = None
            if generated_image:
                generated_image_filename = f"epoch_{epoch}_val_{pair.id}.png"
                generated_image_path = os.path.join(trace_assets_dir, generated_image_filename)
                generated_image.save(generated_image_path)
                
                result = evaluator.evaluate(pair.ref_image_path, pair.emp_image_path, generated_image)
                val_scores["base"] += result.base_image_preservation_score
                val_scores["arrow"] += result.arrow_placement_score
                val_scores["text"] += result.text_accuracy_score
                
                val_feedback.append({
                    "id": pair.id,
                    "scores": {
                        "base": result.base_image_preservation_score,
                        "arrow": result.arrow_placement_score,
                        "text": result.text_accuracy_score
                    },
                    "reasoning": result.reasoning,
                    "analysis": result.analysis_step_by_step,
                    "primary_failure": result.primary_failure,
                    "actionable_feedback": result.actionable_feedback,
                    "source_image": pair.emp_image_path,
                    "ref_image": pair.ref_image_path,
                    "generated_image": generated_image_path,
                    "full_prompt": full_prompt
                })
            else:
                val_feedback.append({
                    "id": pair.id,
                    "error": "Generation failed",
                    "source_image": pair.emp_image_path,
                    "ref_image": pair.ref_image_path
                })

        n_val = len(val_set)
        avg_val_scores = {k: v/n_val for k, v in val_scores.items()} if n_val > 0 else {k: 0 for k in val_scores}
        print(f"  Validation Average Scores: {avg_val_scores}")

        trace_log.append({
            "epoch": epoch,
            "prompt": current_prompt,
            "avg_scores": avg_scores,
            "val_avg_scores": avg_val_scores,
            "feedback": epoch_feedback,
            "val_feedback": val_feedback
        })
        
        # Save Trace Checkpoint
        with open("trace.json", "w") as f:
            json.dump(trace_log, f, indent=2)
        
        # Early Stopping Check
        if (avg_scores["base"] >= TARGET_SCORE and 
            avg_scores["arrow"] >= TARGET_SCORE and 
            avg_scores["text"] >= TARGET_SCORE):
            print(f"Early stopping triggered: All training scores are above {TARGET_SCORE}")
            break

        # Optimize (unless last epoch)
        if epoch < epochs - 1:
            print("Optimizing prompt...")
            current_prompt = optimizer.optimize(current_prompt, epoch_feedback)
            print("New Prompt Generated.")
            
    print("Optimization Complete. Trace saved to trace.json")

if __name__ == "__main__":
    main()
