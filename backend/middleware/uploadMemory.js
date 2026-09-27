const multer = require("multer");

// Memory storage — used only for OCR scanning (temporary, not saved to Cloudinary)
const storage = multer.memoryStorage();

const uploadMemory = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

module.exports = uploadMemory;