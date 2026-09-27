import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";

const AdminDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/trips", {
        params: statusFilter ? { status: statusFilter } : {},
      });
      setTrips(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load trips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [statusFilter]);

  const handleMarkReimbursed = async (tripId) => {
    if (!confirm("Mark this trip as reimbursed?")) return;
    try {
      await API.put(`/trips/${tripId}/reimburse`);
      fetchTrips();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update trip");
    }
  };

  const statusColor = {
    open: "bg-gray-200 text-gray-800",
    submitted: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    reimbursed: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">All Trips</option>
          <option value="submitted">Submitted (Needs Review)</option>
          <option value="open">Open</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="reimbursed">Reimbursed</option>
        </select>
      </div>

      {error && <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</p>}

      {loading ? (
        <p>Loading trips...</p>
      ) : trips.length === 0 ? (
        <p className="text-gray-500">No trips found.</p>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <div key={trip._id} className="bg-white shadow rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{trip.title}</h3>
                  <p className="text-sm text-gray-600">
                    {trip.employee?.name} ({trip.employee?.email})
                  </p>
                  <p className="text-sm text-gray-500">{trip.destination}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(trip.startDate).toLocaleDateString()} -{" "}
                    {new Date(trip.endDate).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColor[trip.status]}`}>
                  {trip.status}
                </span>
              </div>

              <div className="flex justify-between items-center mt-3">
                <p className="text-sm font-medium text-green-700">
                  Approved: ₹{trip.totalApprovedAmount}
                </p>
                <div className="flex gap-3">
                  <Link
                    to={`/admin/trips/${trip._id}`}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    Review Expenses
                  </Link>
                  {trip.status === "approved" && (
                    <button
                      onClick={() => handleMarkReimbursed(trip._id)}
                      className="text-purple-600 text-sm hover:underline"
                    >
                      Mark Reimbursed
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;