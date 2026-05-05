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
from dataclasses import dataclass
from typing import List, Optional, Dict
import re

@dataclass
class DataPair:
    id: str
    emp_image_path: str
    ref_image_path: str
    annotations: List[str]

class DataLoader:
    def __init__(self, jsonl_path: str, images_dir: str):
        self.jsonl_path = jsonl_path
        self.images_dir = images_dir

    def _parse_jsonl(self):
        # Helper to parse the JSONL and map Filename -> Annotations
        file_annotations = {}
        
        if not os.path.exists(self.jsonl_path):
            return file_annotations

        with open(self.jsonl_path, 'r') as f:
            lines = f.readlines()
            
        for i, line in enumerate(lines):
            try:
                line = line.strip()
                if not line:
                    continue
                    
                entry = json.loads(line)
                contents = entry.get('contents', [])
                
                filename = None
                text_content = None
                
                for content in contents:
                    role = content.get('role')
                    parts = content.get('parts', [])
                    
                    if role == 'user':
                        for part in parts:
                            if 'fileData' in part:
                                uri = part['fileData']['fileUri']
                                filename = os.path.basename(uri)
                    
                    elif role == 'model':
                        for part in parts:
                            if 'text' in part:
                                text_content = part['text']
                
                if filename and text_content:
                    # Check if it's the JSON format (EMP) or CSV format (REF)
                    try:
                        # Try parsing as JSON first (for EMP missing_annotations)
                        json_content = json.loads(text_content)
                        if isinstance(json_content, dict) and 'missing_annotations' in json_content:
                            file_annotations[filename] = json_content['missing_annotations']
                        else:
                             pass
                    except (json.JSONDecodeError, TypeError):
                        # Fallback to CSV string (REF)
                        matches = re.findall(r'\"(.*?)\"', text_content)
                        if matches:
                            file_annotations[filename] = matches
                        else:
                            file_annotations[filename] = [t.strip() for t in text_content.split(',')]
                            
            except Exception as e:
                print(f"Error parsing line {i}: {e}")
                
        return file_annotations

    def load_data(self) -> list[DataPair]:
        data_pairs = []
        file_annotations = self._parse_jsonl()
        
        files = os.listdir(self.images_dir)
        emp_files = [f for f in files if f.endswith('EMP.jpg') or f.endswith('_EMP.jpg')]
        
        for emp_file in emp_files:
            # Handle both " EMP.jpg" and "_EMP.jpg"
            if ' ' in emp_file:
                base_name = emp_file.replace(' EMP.jpg', '')
                ref_file = f"{base_name} REF.jpg"
            else:
                base_name = emp_file.replace('_EMP.jpg', '')
                ref_file = f"{base_name}_REF.jpg"
                
            if not os.path.exists(os.path.join(self.images_dir, ref_file)):
                 # Try without REF
                 if ' ' in emp_file:
                     ref_file = f"{base_name}.jpg"
                 else:
                     ref_file = f"{base_name}.jpg" # Same for underscore fallback
            
            
            if os.path.exists(os.path.join(self.images_dir, ref_file)):
                # Get annotations
                # Priority: EMP missing_annotations (validation target) > REF annotations
                anns = file_annotations.get(emp_file, [])
                if not anns:
                    anns = file_annotations.get(ref_file, [])

                if anns:
                    data_pairs.append(DataPair(
                        id=base_name,
                        emp_image_path=os.path.join(self.images_dir, emp_file),
                        ref_image_path=os.path.join(self.images_dir, ref_file),
                        annotations=anns
                    ))
        
        return data_pairs

if __name__ == "__main__":
    base_dir = os.path.join(os.path.dirname(__file__), "data_tek_pak/data")
    loader = DataLoader(
        os.path.join(base_dir, "JSONL-Files/Testcase.jsonl"),
        os.path.join(base_dir, "Images")
    )
    pairs = loader.load_data()
    print(f"Found {len(pairs)} pairs.")
    for p in pairs:
        print(f"ID: {p.id}")
        print(f"  Anns: {len(p.annotations)}")
