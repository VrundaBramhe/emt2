const sharp = require("sharp");

// Preprocesses receipt image for better OCR accuracy:
// grayscale, contrast boost, sharpen, upscale if small, binarize
const preprocessImage = async (inputBuffer) => {
  try {
    const metadata = await sharp(inputBuffer).metadata();

    let pipeline = sharp(inputBuffer);

    // Upscale small images (OCR does better on higher resolution)
    if (metadata.width < 1200) {
      pipeline = pipeline.resize({ width: 1500, withoutEnlargement: false });
    }

    const processedBuffer = await pipeline
      .grayscale()
      .normalize() // auto contrast stretch
      .sharpen()
      .threshold(150) // binarize: convert to pure black/white (removes shadows/noise)
      .toBuffer();

    return processedBuffer;
  } catch (error) {
    console.error("Image preprocessing failed:", error.message);
    // Fallback: return original buffer if preprocessing fails
    return inputBuffer;
  }
};

module.exports = { preprocessImage };