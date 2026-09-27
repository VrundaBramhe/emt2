import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";

const AdminTripReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentDrafts, setCommentDrafts] = useState({});

  const fetchTrip = async () => {
    try {
      const { data } = await API.get(`/trips/${id}`);
      setTrip(data.trip);
      setExpenses(data.expenses);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load trip");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrip();
  }, [id]);

  const handleReview = async (expenseId, status) => {
    try {
      await API.put(`/expenses/${expenseId}/review`, {
        status,
        adminComment: commentDrafts[expenseId] || "",
      });
      fetchTrip();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update expense");
    }
  };

  const handleCommentChange = (expenseId, value) => {
    setCommentDrafts({ ...commentDrafts, [expenseId]: value });
  };

  const statusColor = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!trip) return <p className="text-center mt-10 text-red-600">{error}</p>;

  const violationCount = expenses.filter((e) => e.isPolicyViolation).length;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button onClick={() => navigate(-1)} className="text-blue-600 text-sm mb-4">
        ← Back
      </button>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold">{trip.title}</h1>
        <p className="text-gray-600">
          {trip.employee?.name} ({trip.employee?.email})
        </p>
        <p className="text-sm text-gray-500">{trip.destination}</p>
        <p className="text-xs text-gray-400">
          {new Date(trip.startDate).toLocaleDateString()} -{" "}
          {new Date(trip.endDate).toLocaleDateString()}
        </p>
        <p className="text-sm mt-2">
          Status: <span className="font-medium capitalize">{trip.status}</span>
        </p>
        <p className="text-sm font-medium text-green-700 mt-1">
          Approved total: ₹{trip.totalApprovedAmount}
        </p>
        {violationCount > 0 && (
          <p className="text-sm font-medium text-orange-600 mt-1">
            ⚠ {violationCount} expense{violationCount > 1 ? "s" : ""} flagged for policy violation
          </p>
        )}
      </div>

      {error && <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</p>}

      <h2 className="text-lg font-semibold mb-3">Expenses ({expenses.length})</h2>

      <div className="space-y-4">
        {expenses.map((exp) => (
          <div
            key={exp._id}
            className={`bg-white shadow rounded-lg p-4 ${
              exp.isPolicyViolation ? "border-l-4 border-orange-400" : ""
            }`}
          >
            <div className="flex gap-4">
              <a href={exp.receiptUrl} target="_blank" rel="noreferrer">
                <img
                  src={exp.receiptUrl}
                  alt="receipt"
                  className="w-24 h-24 object-cover rounded border"
                />
              </a>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium capitalize">{exp.category}</p>
                    {exp.merchantName && (
                      <p className="text-xs text-gray-500">{exp.merchantName}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {exp.isPolicyViolation && (
                      <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                        ⚠ Policy
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColor[exp.status]}`}>
                      {exp.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{exp.description}</p>
                <p className="text-sm text-gray-400">
                  {new Date(exp.date).toLocaleDateString()}
                  {exp.paymentMethod && ` · ${exp.paymentMethod.replace("_", " ")}`}
                </p>
                {exp.isPolicyViolation && (
                  <p className="text-xs text-orange-600 mt-1 font-medium">
                    {exp.policyViolationReason}
                  </p>
                )}
                <p className="font-semibold mt-1">₹{exp.amount}</p>
              </div>
            </div>

            {exp.status === "pending" ? (
              <div className="mt-3 flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Comment (optional)"
                  value={commentDrafts[exp._id] || ""}
                  onChange={(e) => handleCommentChange(exp._id, e.target.value)}
                  className="border rounded px-3 py-1 text-sm flex-1"
                />
                <button
                  onClick={() => handleReview(exp._id, "approved")}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReview(exp._id, "rejected")}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            ) : (
              exp.adminComment && (
                <p className="text-xs text-gray-500 mt-2">Admin comment: {exp.adminComment}</p>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminTripReview;