from PIL import Image
from donut_model import extract_receipt_data

image = Image.open("test_images/X51005230648.jpg").convert("RGB")
parsed_json, raw_sequence = extract_receipt_data(image)

print("Full parsed JSON:")
print(parsed_json)
print("\nTotal section specifically:")
print(parsed_json.get("total", {}))