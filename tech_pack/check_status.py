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
