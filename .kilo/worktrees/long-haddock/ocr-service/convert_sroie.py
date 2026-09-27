"""
Converts SROIE2019 test set into the format needed for accuracy testing.
Run this once to generate test_images/ and ground_truth.csv
"""

import os
import json
import shutil
import csv
import re

SROIE_TEST_DIR = "../SROIE2019/test"
IMG_SRC_DIR = os.path.join(SROIE_TEST_DIR, "img")
ENTITIES_DIR = os.path.join(SROIE_TEST_DIR, "entities")

OUTPUT_IMG_DIR = "test_images"
OUTPUT_CSV = "ground_truth.csv"

os.makedirs(OUTPUT_IMG_DIR, exist_ok=True)

rows = []

for entity_file in os.listdir(ENTITIES_DIR):
    if not entity_file.endswith(".txt"):
        continue

    base_name = entity_file.replace(".txt", "")
    entity_path = os.path.join(ENTITIES_DIR, entity_file)
    img_path = os.path.join(IMG_SRC_DIR, base_name + ".jpg")

    if not os.path.exists(img_path):
        print(f"⚠ Skipping {base_name} — image not found")
        continue

    with open(entity_path, "r", encoding="utf-8", errors="ignore") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            print(f"⚠ Skipping {base_name} — invalid JSON")
            continue

    total_str = data.get("total", "")
    cleaned = re.sub(r"[^\d.]", "", total_str)
    if not cleaned:
        print(f"⚠ Skipping {base_name} — no valid total")
        continue

    try:
        amount = float(cleaned)
    except ValueError:
        print(f"⚠ Skipping {base_name} — could not parse amount: {total_str}")
        continue

    # Copy image to test_images folder
    dest_img_name = base_name + ".jpg"
    shutil.copy(img_path, os.path.join(OUTPUT_IMG_DIR, dest_img_name))

    rows.append({
        "filename": dest_img_name,
        "actual_amount": amount,
        "actual_category": "other",  # SROIE has no category labels
        "actual_merchant": data.get("company", ""),
    })

with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["filename", "actual_amount", "actual_category", "actual_merchant"])
    writer.writeheader()
    writer.writerows(rows)

print(f"\nDone. Converted {len(rows)} receipts.")
print(f"Images copied to: {OUTPUT_IMG_DIR}/")
print(f"Ground truth saved to: {OUTPUT_CSV}")