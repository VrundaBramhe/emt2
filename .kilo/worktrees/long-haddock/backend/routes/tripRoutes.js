const express = require("express");
const router = express.Router();
const {
  createTrip,
  getMyTrips,
  getTripById,
  submitTrip,
  getAllTrips,
  markReimbursed,
} = require("../controllers/tripController");
const { protect, adminOnly } = require("../middleware/auth");

router.post("/", protect, createTrip);
router.get("/mine", protect, getMyTrips);
router.get("/", protect, adminOnly, getAllTrips);
router.get("/:id", protect, getTripById);
router.put("/:id/submit", protect, submitTrip);
router.put("/:id/reimburse", protect, adminOnly, markReimbursed);

module.exports = router;