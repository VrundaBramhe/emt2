const axios = require("axios");
const FormData = require("form-data");
const Tesseract = require("tesseract.js");
const { preprocessImage } = require("../utils/imagePreprocess");
const { extractDate } = require("../utils/dateExtractor");
const { extractAmountFallback } = require("../utils/amountFallback");

const DONUT_SERVICE_URL = process.env.DONUT_SERVICE_URL || "http://localhost:8000";

// @desc Scan a receipt image and extract expense fields
// @route POST /api/ocr/scan
const scanReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    // Run Donut (primary) and Tesseract (date + fallback amount) in parallel
    const donutPromise = (async () => {
      try {
        const formData = new FormData();
        formData.append("file", req.file.buffer, {
          filename: req.file.originalname || "receipt.jpg",
          contentType: req.file.mimetype,
        });

        const response = await axios.post(`${DONUT_SERVICE_URL}/scan`, formData, {
          headers: formData.getHeaders(),
          timeout: 60000,
        });

        return response.data;
      } catch (err) {
        console.error("Donut scan failed:", err.message);
        return null;
      }
    })();

    const tesseractPromise = (async () => {
      try {
        const processedBuffer = await preprocessImage(req.file.buffer);
        const {
          data: { text },
        } = await Tesseract.recognize(processedBuffer, "eng");
        return {
          date: extractDate(text),
          fallbackAmount: extractAmountFallback(text),
        };
      } catch (err) {
        console.error("Tesseract fallback failed:", err.message);
        return { date: null, fallbackAmount: null };
      }
    })();

    const [donutResult, tesseractResult] = await Promise.all([donutPromise, tesseractPromise]);

    const donutAmount = donutResult?.amount ?? null;
    const fallbackAmount = tesseractResult.fallbackAmount;

    let finalAmount = donutAmount;
    let lowConfidence = false;
    let confidenceNote = "";

    if (donutAmount === null && fallbackAmount !== null) {
      // Donut failed entirely, use fallback
      finalAmount = fallbackAmount;
      lowConfidence = true;
      confidenceNote = "Amount extracted using backup method — please verify.";
    } else if (donutAmount === null && fallbackAmount === null) {
      // Both failed
      finalAmount = null;
      lowConfidence = true;
      confidenceNote = "Could not extract amount automatically — please enter manually.";
    } else if (
      donutAmount !== null &&
      fallbackAmount !== null &&
      Math.abs(donutAmount - fallbackAmount) > Math.max(donutAmount, fallbackAmount) * 0.15
    ) {
      // Both succeeded but disagree by more than 15% — flag for review
      lowConfidence = true;
      confidenceNote = `Please verify amount — two methods disagreed (₹${donutAmount} vs ₹${fallbackAmount}).`;
    }

    res.json({
      amount: finalAmount,
      date: tesseractResult.date,
      category: donutResult?.category || "other",
      description: donutResult?.description || "",
      lowConfidence,
      confidenceNote,
    });
  } catch (error) {
    console.error("OCR scan failed:", error.message);

    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        message: "OCR service unavailable. Make sure the Python OCR service is running.",
      });
    }

    res.status(500).json({ message: "Failed to scan receipt", error: error.message });
  }
};

module.exports = { scanReceipt };