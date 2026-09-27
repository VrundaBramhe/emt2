"""
Quick accuracy test for the Donut receipt model, using SROIE test data.
Run: python test_accuracy.py
"""

import os
import csv
from PIL import Image
from donut_model import extract_receipt_data, get_grand_total, get_items_description

TEST_IMAGES_DIR = "test_images"
GROUND_TRUTH_FILE = "ground_truth.csv"

SAMPLE_LIMIT = 100  # credible sample size for reporting

def load_ground_truth():
    rows = []
    with open(GROUND_TRUTH_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows[:SAMPLE_LIMIT]


def merchant_match(predicted, actual):
    if not predicted or not actual:
        return False
    predicted_words = set(predicted.lower().replace(",", " ").split())
    actual_words = set(actual.lower().replace(",", " ").split())
    # Ignore very short/common words
    actual_words = {w for w in actual_words if len(w) > 2}
    if not actual_words:
        return False
    overlap = actual_words & predicted_words
    return len(overlap) / len(actual_words) >= 0.5  # at least half the merchant name words present

def run_test():
    ground_truth = load_ground_truth()

    amount_correct = 0
    merchant_correct = 0
    total = 0

    print(f"\nRunning accuracy test on {len(ground_truth)} receipts...\n")

    for row in ground_truth:
        filename = row["filename"]
        actual_amount = float(row["actual_amount"])
        actual_merchant = row.get("actual_merchant", "")

        image_path = os.path.join(TEST_IMAGES_DIR, filename)
        if not os.path.exists(image_path):
            continue

        image = Image.open(image_path).convert("RGB")

        try:
            parsed_json, _ = extract_receipt_data(image)
            predicted_amount = get_grand_total(parsed_json)
            predicted_merchant = get_items_description(parsed_json)
        except Exception:
            predicted_amount = None
            predicted_merchant = ""

        amount_ok = predicted_amount is not None and abs(predicted_amount - actual_amount) < 1.0
        merchant_ok = merchant_match(predicted_merchant, actual_merchant)

        status = "✅" if amount_ok else "❌"
        print(f"{status} {filename}  |  actual: {actual_amount}  predicted: {predicted_amount}")

        if amount_ok:
            amount_correct += 1
        if merchant_ok:
            merchant_correct += 1
        total += 1

    print("\n" + "=" * 40)
    print("FINAL ACCURACY REPORT")
    print("=" * 40)
    print(f"Sample size:        {total} receipts")
    print(f"Amount Accuracy:    {amount_correct}/{total}  ({100 * amount_correct / total:.1f}%)")
    print(f"Merchant Accuracy:  {merchant_correct}/{total}  ({100 * merchant_correct / total:.1f}%)")
    print("=" * 40)


if __name__ == "__main__":
    run_test()