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

import io
import json
import os
import re
from dotenv import load_dotenv
from google import genai
from google.genai import types
from PIL import Image

load_dotenv()

class DataSynthesizer:
    """
    Synthesizes alternative versions of technical flat illustrations from existing testcases
    using Gemini image generation to test model resilience and expand benchmark datasets.
    """
    def __init__(self, model_name="gemini-3.1-flash-image-preview", project=None):
        if not project:
            project = os.environ.get("GOOGLE_CLOUD_PROJECT")
        # Strictly enforce global region for preview models
        self.client = genai.Client(vertexai=True, project=project, location="global")
        self.model_name = model_name

    def synthesize_image_variation(self, image_path: str, prompt_template: str = None) -> Image.Image:
        if not prompt_template:
            prompt_template = """You are an expert technical fashion illustrator. Given this technical flat illustration of a garment, generate a new alternative technical flat of the exact same garment design that is basically the same but with slight, natural drawing variations.

Maintain the exact same garment structure, style lines, proportions, and visual annotations or details present in the original image.

[ABSOLUTE REQUIREMENTS]:
1) Keep the exact same layout (e.g. front and back views if present).
2) Maintain the clean technical line drawing style on a pure white background.
3) Ensure all key construction features, zippers, pockets, plackets, and stitchings from the input image remain present."""

        image = Image.open(image_path)
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='JPEG')
        img_bytes = img_byte_arr.getvalue()

        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
                    types.Part.from_text(text=prompt_template)
                ]
            ),
        ]

        generate_content_config = types.GenerateContentConfig(
            temperature=1,
            top_p=0.95,
            max_output_tokens=32768,
            response_modalities=["TEXT", "IMAGE"],
            safety_settings=[
                types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="OFF"),
                types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="OFF"),
                types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="OFF"),
                types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="OFF")
            ],
            image_config=types.ImageConfig(
                aspect_ratio="1:1",
                image_size="1K",
                output_mime_type="image/png",
            ),
        )

        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=generate_content_config
            )
            
            if response.candidates:
                for candidate in response.candidates:
                    if candidate.content and candidate.content.parts:
                        for part in candidate.content.parts:
                            if part.inline_data:
                                return Image.open(io.BytesIO(part.inline_data.data))
            
            print("No image found in response.")
            return None

        except Exception as e:
            print(f"Image synthesis generation failed: {e}")
            return None

def find_local_image(images_dir, file_uri):
    base = os.path.basename(file_uri)
    target_path = os.path.join(images_dir, base)
    if os.path.exists(target_path):
        return target_path
    
    # Check variations like replacing space with underscore or removing REF
    base_no_ref = base.replace(" REF.jpg", ".jpg").replace("_REF.jpg", ".jpg").replace(" EMP.jpg", "_EMP.jpg")
    target_path = os.path.join(images_dir, base_no_ref)
    if os.path.exists(target_path):
        return target_path

    # Try replacing space with underscore directly
    target_path = os.path.join(images_dir, base.replace(" ", "_"))
    if os.path.exists(target_path):
        return target_path
        
    # Check for any match starting with Style_XXX
    style_match = re.match(r'(Style_\d+)', base)
    if style_match:
        style_prefix = style_match.group(1)
        is_emp = 'EMP' in base
        for f in os.listdir(images_dir):
            if f.startswith(style_prefix):
                if is_emp and ('EMP' in f):
                    return os.path.join(images_dir, f)
                elif not is_emp and ('REF' in f or f == f"{style_prefix}.jpg"):
                    return os.path.join(images_dir, f)
                    
    return None

def run_synthesis():
    base_dir = os.path.join(os.path.dirname(__file__), "data_tek_pak/data/JSONL-Files")
    images_dir = os.path.join(os.path.dirname(__file__), "data_tek_pak/data/Images")
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
            user_text = "Your task is to observe every visual detail, annotation provided. Memorize this concept perfectly, treating the provided data as the definitive ground truth."

            # Extract image URI, user text, and annotations
            for c in contents:
                if c.get('role') == 'user':
                    for part in c.get('parts', []):
                        if 'fileData' in part:
                            file_uri = part['fileData'].get('fileUri')
                        elif 'text' in part:
                            user_text = part['text']
                elif c.get('role') == 'model':
                    for part in c.get('parts', []):
                        if 'text' in part:
                            existing_text = part['text']

            if not file_uri or not existing_text:
                continue

            local_image_path = find_local_image(images_dir, file_uri)
            if not local_image_path:
                print(f"Local image not found for URI {file_uri}, skipping...")
                continue

            print(f"Synthesizing alternative technical flat image for: {file_uri}")
            synthetic_image = synthesizer.synthesize_image_variation(local_image_path)
            if not synthetic_image:
                print("Image synthesis returned None, skipping...")
                continue

            # Create synthetic filename and save to images_dir
            orig_basename = os.path.basename(file_uri)
            base_root, ext = os.path.splitext(orig_basename)
            synthetic_basename = f"{base_root}_synthetic{ext}"
            synthetic_save_path = os.path.join(images_dir, synthetic_basename.replace(" ", "_"))

            # Convert and save as JPEG
            synthetic_image = synthetic_image.convert('RGB')
            synthetic_image.save(synthetic_save_path, format='JPEG')
            print(f"Saved synthetic image to: {synthetic_save_path}")

            # Construct new bucket URI matching original format
            synthetic_uri = f"gs://sandbox-bucket/TENRECORDS/{os.path.basename(synthetic_save_path)}"

            new_record = {
                "systemInstruction": entry.get("systemInstruction", {}),
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": user_text},
                            {"fileData": {"mimeType": "image/jpeg", "fileUri": synthetic_uri}}
                        ]
                    },
                    {
                        "role": "model",
                        "parts": [{"text": existing_text}]
                    }
                ],
                "synthesized_variation_type": "alternative_technical_flat"
            }
            synthetic_records.append(new_record)

    print(f"Writing {len(synthetic_records)} synthetic records to: {output_path}")
    with open(output_path, 'w', encoding='utf-8') as outfile:
        for record in synthetic_records:
            outfile.write(json.dumps(record) + "\n")
    print("Synthetic data generation completed successfully.")

if __name__ == "__main__":
    run_synthesis()
