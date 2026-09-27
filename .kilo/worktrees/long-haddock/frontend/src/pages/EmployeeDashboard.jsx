import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import QuickScanModal from "../components/QuickScanModal";

const EmployeeDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showQuickScan, setShowQuickScan] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    purpose: "",
    destination: "",
    startDate: "",
    endDate: "",
  });

  const fetchTrips = async () => {
    try {
      const { data } = await API.get("/trips/mine");
      setTrips(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load trips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    try {
      await API.post("/trips", formData);
      setFormData({ title: "", purpose: "", destination: "", startDate: "", endDate: "" });
      setShowForm(false);
      fetchTrips();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create trip");
    }
  };

  const handleQuickScanSuccess = () => {
    setShowQuickScan(false);
    fetchTrips();
  };

  const statusColor = {
    open: "bg-gray-200 text-gray-800",
    submitted: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    reimbursed: "bg-blue-100 text-blue-800",
  };

  if (loading) return <p className="text-center mt-10">Loading trips...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Trips</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowQuickScan(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            🔍 Quick Scan
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "+ New Trip"}
          </button>
        </div>
      </div>

      {error && <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</p>}

      {showForm && (
        <form
          onSubmit={handleCreateTrip}
          className="bg-white shadow rounded-lg p-6 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <input
            type="text"
            name="title"
            placeholder="Trip Title (e.g. Client visit - Mumbai)"
            value={formData.title}
            onChange={handleChange}
            required
            className="border rounded px-3 py-2 sm:col-span-2"
          />
          <input
            type="text"
            name="destination"
            placeholder="Destination"
            value={formData.destination}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            name="purpose"
            placeholder="Purpose"
            value={formData.purpose}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />
          <div>
            <label className="text-sm text-gray-600">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">End Date</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <button
            type="submit"
            className="bg-green-600 text-white py-2 rounded hover:bg-green-700 sm:col-span-2"
          >
            Create Trip
          </button>
        </form>
      )}

      {trips.length === 0 ? (
        <p className="text-gray-500">No trips yet. Create your first trip or use Quick Scan.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {trips.map((trip) => (
            <Link
              key={trip._id}
              to={`/trips/${trip._id}`}
              className="bg-white shadow rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold">{trip.title}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${statusColor[trip.status]}`}
                >
                  {trip.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">{trip.destination}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(trip.startDate).toLocaleDateString()} -{" "}
                {new Date(trip.endDate).toLocaleDateString()}
              </p>
              {trip.totalApprovedAmount > 0 && (
                <p className="text-sm font-medium text-green-700 mt-2">
                  Approved: ₹{trip.totalApprovedAmount}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      {showQuickScan && (
        <QuickScanModal
          onClose={() => setShowQuickScan(false)}
          onSuccess={handleQuickScanSuccess}
        />
      )}
    </div>
  );
};

export default EmployeeDashboard;