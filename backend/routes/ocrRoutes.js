const express = require("express");
const router = express.Router();
const { scanReceipt } = require("../controllers/ocrController");
const { protect } = require("../middleware/auth");
const uploadMemory = require("../middleware/uploadMemory");
const multer = require("multer");

const handleUpload = (req, res, next) => {
  uploadMemory.single("receipt")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

router.post("/scan", protect, handleUpload, scanReceipt);

module.exports = router;