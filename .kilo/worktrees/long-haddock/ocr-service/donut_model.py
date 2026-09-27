import torch
from transformers import DonutProcessor, VisionEncoderDecoderModel
from PIL import Image
import re

MODEL_NAME = "naver-clova-ix/donut-base-finetuned-cord-v2"

print("Loading Donut model (first run downloads ~800MB, please wait)...")
processor = DonutProcessor.from_pretrained(MODEL_NAME)
model = VisionEncoderDecoderModel.from_pretrained(MODEL_NAME)

device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
model.eval()
print(f"Donut model loaded on {device}.")


def extract_receipt_data(image: Image.Image):
    """
    Runs Donut inference on a receipt image and returns structured data:
    { total, subtotal, tax, items: [...], raw_sequence }
    """
    pixel_values = processor(image, return_tensors="pt").pixel_values.to(device)

    task_prompt = "<s_cord-v2>"
    decoder_input_ids = processor.tokenizer(
        task_prompt, add_special_tokens=False, return_tensors="pt"
    ).input_ids.to(device)

    with torch.no_grad():
        outputs = model.generate(
            pixel_values,
            decoder_input_ids=decoder_input_ids,
            max_length=model.decoder.config.max_position_embeddings,
            pad_token_id=processor.tokenizer.pad_token_id,
            eos_token_id=processor.tokenizer.eos_token_id,
            use_cache=True,
            bad_words_ids=[[processor.tokenizer.unk_token_id]],
            return_dict_in_generate=True,
        )

    sequence = processor.batch_decode(outputs.sequences)[0]
    sequence = sequence.replace(processor.tokenizer.eos_token, "").replace(
        processor.tokenizer.pad_token, ""
    )
    sequence = re.sub(r"<.*?>", "", sequence, count=1).strip()  # remove first task token

    parsed = processor.token2json(sequence)
    return parsed, sequence



def get_grand_total(parsed_json):
    """Extract the final total amount from Donut's parsed CORD-format output."""

    def looks_like_date_or_time(text):
        text = str(text)
        # Reject if it looks like a date/timestamp, not an amount
        return bool(re.search(r"\d{1,2}[/:]\d{1,2}", text)) or "AM" in text.upper() or "PM" in text.upper()

    def extract_valid_amount(raw_value):
        text = str(raw_value)
        if looks_like_date_or_time(text):
            return None
        matches = re.findall(r"\d{1,3}(?:[,.]\d{3})*(?:\.\d{1,2})?|\d+\.\d{1,2}|\d+", text)
        if not matches:
            return None
        best = max(matches, key=len)
        cleaned = best.replace(",", "")
        try:
            val = float(cleaned)
            if 0 < val < 1000000:
                return val
        except ValueError:
            pass
        return None

    # Try total section first (preferred keys, then any value)
    total_section = parsed_json.get("total", {})
    for key in ["total_price", "cashprice", "creditcardprice"]:
        if key in total_section:
            val = extract_valid_amount(total_section[key])
            if val is not None:
                return val
    for v in total_section.values():
        val = extract_valid_amount(v if not isinstance(v, list) else " ".join(v))
        if val is not None:
            return val

    # Fallback: check sub_total section (sometimes the real total ends up here)
    sub_total_section = parsed_json.get("sub_total", {})
    for key in ["tax_price", "subtotal_price"]:
        if key in sub_total_section:
            val = extract_valid_amount(sub_total_section[key])
            if val is not None:
                return val
    for v in sub_total_section.values():
        val = extract_valid_amount(v if not isinstance(v, list) else " ".join(v))
        if val is not None:
            return val

    return None




def get_items_description(parsed_json):
    """Build a short description from item names in the receipt, filtering noise."""
    menu = parsed_json.get("menu", [])
    if isinstance(menu, dict):
        menu = [menu]

    noise_patterns = [":", "AM", "PM", "/202", "/", "DUET"]

    names = []
    for item in menu:
        name = item.get("nm")
        if not name:
            continue
        name = str(name).strip()
        if any(pat in name for pat in noise_patterns):
            continue
        if len(name) < 3:
            continue
        names.append(name)

    return ", ".join(names[:3]) if names else ""

def guess_category(parsed_json, items_description):
    """Simple category inference from item/merchant text found by Donut."""
    text = items_description.lower()

    if any(k in text for k in ["hotel", "room", "stay", "suite"]):
        return "accommodation"
    if any(k in text for k in ["uber", "ola", "taxi", "cab", "fuel", "parking", "toll"]):
        return "transport"
    if any(k in text for k in ["flight", "airlines", "train", "railway"]):
        return "travel"
    if any(k in text for k in ["restaurant", "cafe", "food", "meal", "menu", "dining"]):
        return "food"

    return "other"