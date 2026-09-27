const express = require("express");
const router = express.Router();
const {
  addExpense,
  getExpensesByTrip,
  deleteExpense,
  reviewExpense,
} = require("../controllers/expenseController");
const { protect, adminOnly } = require("../middleware/auth");
const upload = require("../middleware/upload");
const multer = require("multer");

const handleUpload = (req, res, next) => {
  upload.single("receipt")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

router.post("/:tripId", protect, handleUpload, addExpense);
router.get("/:tripId", protect, getExpensesByTrip);
router.delete("/:id", protect, deleteExpense);
router.put("/:id/review", protect, adminOnly, reviewExpense);

module.exports = router;