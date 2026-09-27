from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io

from donut_model import extract_receipt_data, get_grand_total, get_items_description, guess_category

app = FastAPI(title="Receipt OCR Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict this to your backend URL in production
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    return {"status": "Donut OCR service running"}


@app.post("/scan")
async def scan_receipt(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        parsed_json, raw_sequence = extract_receipt_data(image)

        amount = get_grand_total(parsed_json)
        description = get_items_description(parsed_json)
        category = guess_category(parsed_json, description)

        return {
            "amount": amount,
            "description": description,
            "category": category,
            "raw_parsed": parsed_json,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")