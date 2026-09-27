const Trip = require("../models/Trip");
const Expense = require("../models/Expense");

// @desc Create a new trip
// @route POST /api/trips
const createTrip = async (req, res) => {
  try {
    const { title, purpose, destination, startDate, endDate } = req.body;

    const trip = await Trip.create({
      employee: req.user._id,
      title,
      purpose,
      destination,
      startDate,
      endDate,
    });

    res.status(201).json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all trips of logged-in employee
// @route GET /api/trips/mine
const getMyTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ employee: req.user._id }).sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get single trip (with its expenses)
// @route GET /api/trips/:id
const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate("employee", "name email");
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    // Only owner employee or admin can view
    if (
      trip.employee._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized to view this trip" });
    }

    const expenses = await Expense.find({ trip: trip._id }).sort({ date: -1 });

    res.json({ trip, expenses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Submit trip for admin review
// @route PUT /api/trips/:id/submit
const submitTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    if (trip.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const expenseCount = await Expense.countDocuments({ trip: trip._id });
    if (expenseCount === 0) {
      return res.status(400).json({ message: "Add at least one expense before submitting" });
    }

    trip.status = "submitted";
    await trip.save();

    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all trips (admin)
// @route GET /api/trips
const getAllTrips = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const trips = await Trip.find(filter)
      .populate("employee", "name email")
      .sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Admin: mark trip as reimbursed
// @route PUT /api/trips/:id/reimburse
const markReimbursed = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    trip.status = "reimbursed";
    await trip.save();

    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTrip,
  getMyTrips,
  getTripById,
  submitTrip,
  getAllTrips,
  markReimbursed,
};