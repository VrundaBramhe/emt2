import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import {
  LayoutDashboard,
  Filter,
  Loader2,
  CreditCard,
  User,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

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

  const statusConfig = {
    open: { bg: "bg-slate-100", text: "text-slate-700", label: "Open" },
    submitted: { bg: "bg-amber-100", text: "text-amber-800", label: "Submitted" },
    approved: { bg: "bg-emerald-100", text: "text-emerald-800", label: "Approved" },
    rejected: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
    reimbursed: { bg: "bg-indigo-100", text: "text-indigo-800", label: "Reimbursed" },
  };

  const filterOptions = [
    { value: "", label: "All Trips" },
    { value: "submitted", label: "Submitted (Needs Review)" },
    { value: "open", label: "Open" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "reimbursed", label: "Reimbursed" },
  ];

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();

  return (
    <div className="max-w-5xl mx-auto p-6 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-indigo-600" aria-hidden="true" />
          Admin Dashboard
        </h1>
        <p className="text-slate-500 text-sm mt-1">Review and manage employee trip submissions</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors cursor-pointer w-full sm:w-[220px]"
            >
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" aria-hidden="true" />
          </div>
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

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" aria-hidden="true" />
          <p className="text-slate-500">Loading trips…</p>
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
          <CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No trips found</h3>
          <p className="text-slate-500 text-sm">{statusFilter ? "No trips match the selected filter." : "No trips have been created yet."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => {
            const status = statusConfig[trip.status] || statusConfig.open;
            return (
              <div key={trip._id} className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 p-5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900 truncate">{trip.title}</h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text} whitespace-nowrap flex-shrink-0`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
                        <span className="truncate">{trip.employee?.name} ({trip.employee?.email})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
                        <span className="truncate">{trip.destination}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" aria-hidden="true" />
                        <span className="text-slate-500">{formatDate(trip.startDate)} – {formatDate(trip.endDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-3 sm:flex-row">
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                      <DollarSign className="h-4 w-4" aria-hidden="true" />
                      <span>Approved: ${trip.totalApprovedAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/admin/trips/${trip._id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                      >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        Review
                      </Link>
                      {trip.status === "approved" && (
                        <button
                          onClick={() => handleMarkReimbursed(trip._id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          Mark Reimbursed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;