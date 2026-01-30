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

try:
    with open("trace.json", "r") as f:
        data = json.load(f)

    if not data:
        print("Trace file is empty.")
        exit()

    last_epoch = data[-1]
    epoch_num = last_epoch["epoch"]
    avg_scores = last_epoch["avg_scores"]
    val_avg_scores = last_epoch.get("val_avg_scores", {})

    print(f"Latest Epoch: {epoch_num} (0-indexed)")
    print(f"Training Scores: {avg_scores}")
    print(f"Validation Scores: {val_avg_scores}")
    
    # Check for best scores
    best_epoch = max(data, key=lambda x: sum(x["avg_scores"].values()))
    print(f"Best Training Epoch: {best_epoch['epoch']} with scores {best_epoch['avg_scores']}")

except Exception as e:
    print(f"Error reading trace.json: {e}")
