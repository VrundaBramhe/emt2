const Expense = require("../models/Expense");
const Trip = require("../models/Trip");

// @desc Get analytics summary for admin dashboard
// @route GET /api/analytics/summary
const getSummary = async (req, res) => {
  try {
    // Spend by category (approved expenses only)
    const byCategory = await Expense.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    // Spend by month (last 6 months, approved expenses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const byMonth = await Expense.aggregate([
      { $match: { status: "approved", date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Top spending employees
    const byEmployee = await Expense.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: "$employee", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "employeeInfo",
        },
      },
      { $unwind: "$employeeInfo" },
      {
        $project: {
          name: "$employeeInfo.name",
          total: 1,
        },
      },
    ]);

    // Overall counts
    const pendingCount = await Expense.countDocuments({ status: "pending" });
    const violationCount = await Expense.countDocuments({
      isPolicyViolation: true,
      status: "pending",
    });
    const totalApprovedThisMonth = await Expense.aggregate([
      {
        $match: {
          status: "approved",
          date: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const tripsPendingReview = await Trip.countDocuments({ status: "submitted" });

    res.json({
      byCategory,
      byMonth,
      byEmployee,
      pendingCount,
      violationCount,
      totalApprovedThisMonth: totalApprovedThisMonth[0]?.total || 0,
      tripsPendingReview,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSummary };
