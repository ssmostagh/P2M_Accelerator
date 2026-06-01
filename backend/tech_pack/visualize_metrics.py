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
import matplotlib.pyplot as plt
import os

def plot_metrics(trace_file='trace.json', output_file='metrics_plot.png'):
    if not os.path.exists(trace_file):
        print(f"Error: {trace_file} not found.")
        return

    with open(trace_file, 'r') as f:
        data = json.load(f)

    epochs = []
    # Training score lists
    base_scores = []
    arrow_scores = []
    text_scores = []

    # Validation score lists
    val_base_scores = []
    val_arrow_scores = []
    val_text_scores = []

    for entry in data:
        if 'epoch' in entry and 'avg_scores' in entry:
            epochs.append(entry['epoch'])
            
            # Training scores
            scores = entry['avg_scores']
            base_scores.append(scores.get('base', 0))
            arrow_scores.append(scores.get('arrow', 0))
            text_scores.append(scores.get('text', 0))
            
            # Validation scores
            val_scores = entry.get('val_avg_scores', {})
            val_base_scores.append(val_scores.get('base', 0))
            val_arrow_scores.append(val_scores.get('arrow', 0))
            val_text_scores.append(val_scores.get('text', 0))

    if not epochs:
        print("No epoch data found in trace.")
        return

    plt.figure(figsize=(12, 8))
    
    # Plot Training Scores (Solid Lines)
    plt.plot(epochs, base_scores, label='Train Base', marker='o', linestyle='-', color='blue')
    plt.plot(epochs, arrow_scores, label='Train Arrow', marker='o', linestyle='-', color='green')
    plt.plot(epochs, text_scores, label='Train Text', marker='o', linestyle='-', color='red')
    
    # Plot Validation Scores (Dashed Lines)
    plt.plot(epochs, val_base_scores, label='Val Base', marker='x', linestyle='--', color='blue', alpha=0.7)
    plt.plot(epochs, val_arrow_scores, label='Val Arrow', marker='x', linestyle='--', color='green', alpha=0.7)
    plt.plot(epochs, val_text_scores, label='Val Text', marker='x', linestyle='--', color='red', alpha=0.7)

    plt.title('Optimization Metrics Over Epochs')
    plt.xlabel('Epoch')
    plt.ylabel('Average Score')
    plt.legend()
    plt.grid(True)
    plt.savefig(output_file)
    print(f"Plot saved to {output_file}")

if __name__ == "__main__":
    plot_metrics()
