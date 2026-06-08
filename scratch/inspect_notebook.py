import json
import os

notebook_path = r"c:\Users\nirbh\Desktop\Capstone\real-time-accident-detection-and-traffic-analysis.ipynb"

with open(notebook_path, "r", encoding="utf-8") as f:
    data = json.load(f)

print("Searching notebook for congestion/traffic features:")
for i, cell in enumerate(data.get('cells', [])):
    cell_type = cell.get('cell_type')
    source = "".join(cell.get('source', []))
    if cell_type == 'code':
        keywords = ["congestion", "traffic_density", "density", "flow", "queue"]
        found = [k for k in keywords if k in source.lower()]
        if found:
            print(f"Cell {i} matches {found}: {source[:300]}...\n")
