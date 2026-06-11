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
import re
from google import genai
from google.genai import types

class DataSynthesizer:
    """
    Synthesizes diverse versions of tech pack annotations from existing testcases
    using Gemini to test prompt resilience and expand benchmark datasets.
    """
    def __init__(self, model_name="gemini-3.1-pro-preview", project=None):
        if not project:
            project = os.environ.get("GOOGLE_CLOUD_PROJECT")
        # Strictly enforce global region for preview models
        self.client = genai.Client(vertexai=True, project=project, location="global")
        self.model_name = model_name

    def synthesize_variations(self, original_annotations: list[str]) -> dict[str, list[str]]:
        prompt = f"""
        You are an expert technical fashion designer and garment manufacturing specialist.
        Given the following ground-truth tech pack callout annotations for a garment, generate 4 distinct synthetic variations to augment our test dataset for multimodal prompt evaluation:

        Original Annotations:
        {json.dumps(original_annotations, indent=2)}

        Generate the following 4 variations:
        1. "descriptive": Convert shorthand/abbreviations into full, polished sentences describing each technical specification clearly for client presentation.
        2. "factory_shorthand": Extremely compact factory floor acronyms/abbreviations (e.g., SNT, DNT, CF, BNT, FKR) optimizing for efficiency.
        3. "quality_control": Append precise manufacturing quality control specifications, tolerances, or stitch per inch (SPI) requirements to each callout.
        4. "multilingual_manufacturing": Dual-language English + Spanish garment technical terms commonly utilized in North/Central American textile manufacturing facilities.

        Output strictly a JSON object matching this schema exactly:
        {{
            "descriptive": ["...", "..."],
            "factory_shorthand": ["...", "..."],
            "quality_control": ["...", "..."],
            "multilingual_manufacturing": ["...", "..."]
        }}
        """

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.7
                )
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"Error synthesizing variations: {e}")
            return {}

def run_synthesis():
    base_dir = os.path.join(os.path.dirname(__file__), "data_tek_pak/data/JSONL-Files")
    input_path = os.path.join(base_dir, "Testcase.jsonl")
    output_path = os.path.join(base_dir, "Synthetic_Testcases.jsonl")

    if not os.path.exists(input_path):
        print(f"Input file not found: {input_path}")
        return

    synthesizer = DataSynthesizer()
    synthetic_records = []

    print(f"Reading base testcases from: {input_path}")
    with open(input_path, 'r', encoding='utf-8') as infile:
        for line_num, line in enumerate(infile, 1):
            line = line.strip()
            if not line:
                continue
            
            entry = json.loads(line)
            contents = entry.get('contents', [])
            
            file_uri = None
            existing_text = None
            is_emp_record = False

            # Extract image URI and annotations
            for c in contents:
                if c.get('role') == 'user':
                    for part in c.get('parts', []):
                        if 'fileData' in part:
                            file_uri = part['fileData'].get('fileUri')
                elif c.get('role') == 'model':
                    for part in c.get('parts', []):
                        if 'text' in part:
                            existing_text = part['text']

            if not file_uri or not existing_text:
                continue

            # Check whether it's an EMP JSON structure or REF string format
            annotations = []
            try:
                emp_json = json.loads(existing_text)
                if isinstance(emp_json, dict) and 'missing_annotations' in emp_json:
                    annotations = emp_json['missing_annotations']
                    is_emp_record = True
            except (json.JSONDecodeError, TypeError):
                matches = re.findall(r'\"(.*?)\"', existing_text)
                annotations = matches if matches else [t.strip() for t in existing_text.split(',')]

            print(f"Processing ({'EMP' if is_emp_record else 'REF'}): {file_uri}")
            if not annotations:
                print("No annotations found, skipping...")
                continue

            variations = synthesizer.synthesize_variations(annotations)
            if not variations:
                print("Synthesis returned empty, skipping...")
                continue

            # Format new records into JSONL structure matching original
            for var_type, ann_list in variations.items():
                if is_emp_record:
                    model_text = json.dumps({"given_annotations": [], "missing_annotations": ann_list})
                else:
                    model_text = ", ".join([f'"{a}"' for a in ann_list])

                new_record = {
                    "systemInstruction": entry.get("systemInstruction", {}),
                    "contents": [
                        {
                            "role": "user",
                            "parts": [
                                {"text": f"Analyze this sketch ({var_type} version)."},
                                {"fileData": {"mimeType": "image/jpeg", "fileUri": file_uri}}
                            ]
                        },
                        {
                            "role": "model",
                            "parts": [{"text": model_text}]
                        }
                    ],
                    "synthesized_variation_type": var_type
                }
                synthetic_records.append(new_record)

    print(f"Writing {len(synthetic_records)} synthetic records to: {output_path}")
    with open(output_path, 'w', encoding='utf-8') as outfile:
        for record in synthetic_records:
            outfile.write(json.dumps(record) + "\n")
    print("Synthetic data generation completed successfully.")

if __name__ == "__main__":
    run_synthesis()
