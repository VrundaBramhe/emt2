import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import QuickScanModal from "../components/QuickScanModal";
import {
  Plus,
  Search,
  X,
  Calendar,
  MapPin,
  Briefcase,
  Loader2,
  CreditCard,
} from "lucide-react";

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

  const statusConfig = {
    open: { bg: "bg-slate-100", text: "text-slate-700", icon: "🟢" },
    submitted: { bg: "bg-amber-100", text: "text-amber-800", icon: "🟡" },
    approved: { bg: "bg-emerald-100", text: "text-emerald-800", icon: "✅" },
    rejected: { bg: "bg-red-100", text: "text-red-800", icon: "❌" },
    reimbursed: { bg: "bg-indigo-100", text: "text-indigo-800", icon: "💰" },
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-hidden="true" />
            <span className="text-sm">Loading trips…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-indigo-600" aria-hidden="true" />
          My Trips
        </h1>
        <p className="text-slate-500 text-sm mt-1">Manage your business travel and expenses</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex gap-3">
          <button
            onClick={() => setShowQuickScan(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Quick Scan Receipt
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors"
          >
            {showForm ? (
              <>
                <X className="h-4 w-4" aria-hidden="true" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" aria-hidden="true" />
                New Trip
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-6"
          role="alert"
        >
          <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreateTrip}
          className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-6 space-y-5"
        >
          <h2 className="text-lg font-semibold text-slate-900">Create New Trip</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">
                Trip Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                placeholder="e.g. Client visit - Mumbai"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-slate-700 mb-1.5">
                Destination
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
                <input
                  type="text"
                  id="destination"
                  name="destination"
                  placeholder="City, Country"
                  value={formData.destination}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="purpose" className="block text-sm font-medium text-slate-700 mb-1.5">
                Purpose
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
                <input
                  type="text"
                  id="purpose"
                  name="purpose"
                  placeholder="Business purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-1.5">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 mb-1.5">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Trip
            </button>
          </div>
        </form>
      )}

      {trips.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <CreditCard className="h-8 w-8 text-slate-400" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No trips yet</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            Get started by creating your first trip or scanning a receipt with Quick Scan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Trip
            </button>
            <button
              onClick={() => setShowQuickScan(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Quick Scan
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {trips.map((trip) => {
            const status = statusConfig[trip.status] || statusConfig.open;
            return (
              <Link
                key={trip._id}
                to={`/trips/${trip._id}`}
                className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 p-5 group"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{trip.title}</h3>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                    {status.icon} {trip.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
                    <span>{trip.destination}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
                    <span className="text-slate-500">
                      {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                    </span>
                  </div>
                </div>
                {trip.totalApprovedAmount > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-sm font-medium text-emerald-700 flex items-center gap-1">
                      Approved: ${trip.totalApprovedAmount.toLocaleString()}
                    </p>
                  </div>
                )}
              </Link>
            );
          })}
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