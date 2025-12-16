
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
