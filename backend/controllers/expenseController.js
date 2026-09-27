const Expense = require("../models/Expense");
const Trip = require("../models/Trip");
const cloudinary = require("cloudinary").v2;

// @desc Add expense to a trip (with receipt upload)
// @route POST /api/expenses/:tripId
const addExpense = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    if (trip.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (trip.status !== "open") {
      return res.status(400).json({ message: "Cannot add expense, trip already submitted" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Receipt image is required" });
    }

    const { category, amount, date, description } = req.body;

    const expense = await Expense.create({
      trip: trip._id,
      employee: req.user._id,
      category,
      amount,
      date,
      description,
      receiptUrl: req.file.path,
      receiptPublicId: req.file.filename,
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all expenses for a trip
// @route GET /api/expenses/:tripId
const getExpensesByTrip = async (req, res) => {
  try {
    const expenses = await Expense.find({ trip: req.params.tripId }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete an expense (only if trip still open)
// @route DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    if (expense.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const trip = await Trip.findById(expense.trip);
    if (trip.status !== "open") {
      return res.status(400).json({ message: "Cannot delete, trip already submitted" });
    }

    if (expense.receiptPublicId) {
      await cloudinary.uploader.destroy(expense.receiptPublicId);
    }

    await expense.deleteOne();
    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Admin: approve or reject an expense
// @route PUT /api/expenses/:id/review
const reviewExpense = async (req, res) => {
  try {
    const { status, adminComment } = req.body; // status: "approved" | "rejected"

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    expense.status = status;
    expense.adminComment = adminComment || "";
    await expense.save();

    // Recalculate trip totals and status from all expenses
    const allExpenses = await Expense.find({ trip: expense.trip });
    const approvedExpenses = allExpenses.filter((e) => e.status === "approved");
    const rejectedExpenses = allExpenses.filter((e) => e.status === "rejected");
    const pendingExpenses = allExpenses.filter((e) => e.status === "pending");

    const total = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);

    let newTripStatus;
    if (pendingExpenses.length > 0) {
      newTripStatus = "submitted"; // still has unreviewed expenses
    } else if (rejectedExpenses.length > 0) {
      newTripStatus = "rejected"; // at least one rejected, review complete
    } else {
      newTripStatus = "approved"; // all reviewed, none rejected
    }

    await Trip.findByIdAndUpdate(expense.trip, {
      totalApprovedAmount: total,
      status: newTripStatus,
    });

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addExpense, getExpensesByTrip, deleteExpense, reviewExpense };