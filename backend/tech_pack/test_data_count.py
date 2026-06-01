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
import sys

# Add current directory to path
sys.path.append(os.getcwd())

from data_loader import DataLoader

base_dir = "/usr/local/google/home/jwortz/macys_tek_pak/macys_tek_pak/data"
loader = DataLoader(
    os.path.join(base_dir, "JSONL-Files/Testcase.jsonl"),
    os.path.join(base_dir, "Images")
)
all_data = loader.load_data()
print(f"Total data points: {len(all_data)}")
for i, d in enumerate(all_data):
    print(f"{i}: {d.id}")
