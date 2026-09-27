import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2,
  CreditCard,
  FileText,
} from "lucide-react";

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

  const expenseStatusConfig = {
    pending: { bg: "bg-amber-100", text: "text-amber-800", icon: "⏳" },
    approved: { bg: "bg-emerald-100", text: "text-emerald-800", icon: "✅" },
    rejected: { bg: "bg-red-100", text: "text-red-800", icon: "❌" },
  };

  const tripStatusConfig = {
    open: { bg: "bg-slate-100", text: "text-slate-700" },
    submitted: { bg: "bg-amber-100", text: "text-amber-800" },
    approved: { bg: "bg-emerald-100", text: "text-emerald-800" },
    rejected: { bg: "bg-red-100", text: "text-red-800" },
    reimbursed: { bg: "bg-indigo-100", text: "text-indigo-800" },
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();
  const formatPaymentMethod = (method) => method.replace("_", " ");

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-hidden="true" />
            <span className="text-sm">Loading trip…</span>
          </div>
        </div>
      </div>
    );
  }
  if (!trip) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-lg font-medium text-slate-900 mb-2">Trip not found</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const violationCount = expenses.filter((e) => e.isPolicyViolation).length;
  const tripStatus = tripStatusConfig[trip.status] || tripStatusConfig.open;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-slate-50 min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </button>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-indigo-600" aria-hidden="true" />
              {trip.title}
            </h1>
          </div>
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${tripStatus.bg} ${tripStatus.text} whitespace-nowrap`}>
            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
          </span>
        </div>

        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <span>{trip.employee?.name} ({trip.employee?.email})</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <span>{trip.destination}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <span>{formatDate(trip.startDate)} – {formatDate(trip.endDate)}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <DollarSign className="h-4 w-4" aria-hidden="true" />
            <span>Approved total: ${trip.totalApprovedAmount.toLocaleString()}</span>
          </div>
          {violationCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-700 font-medium">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <span>{violationCount} expense{violationCount > 1 ? "s" : ""} flagged for policy violation</span>
            </div>
          )}
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

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Expenses ({expenses.length})</h2>
      </div>

      {expenses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No expenses</h3>
          <p className="text-slate-500 text-sm">This trip has no expenses to review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {expenses.map((exp) => {
            const status = expenseStatusConfig[exp.status] || expenseStatusConfig.pending;
            return (
              <div
                key={exp._id}
                className={`bg-white border border-slate-200 rounded-xl shadow-sm p-5 transition-all duration-200 ${
                  exp.isPolicyViolation ? "border-l-4 border-amber-400 bg-amber-50" : "hover:shadow-md hover:border-slate-300"
                }`}
              >
                <div className="flex gap-4">
                  <a href={exp.receiptUrl} target="_blank" rel="noreferrer" className="flex-shrink-0">
                    <img
                      src={exp.receiptUrl}
                      alt="Receipt thumbnail"
                      className="w-24 h-24 object-cover rounded-lg border border-slate-200"
                    />
                  </a>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-medium text-slate-900 capitalize">{exp.category}</p>
                        {exp.merchantName && (
                          <p className="text-xs text-slate-500 mt-0.5">{exp.merchantName}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {exp.isPolicyViolation && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                            Policy
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                          {status.icon} {exp.status}
                        </span>
                      </div>
                    </div>
                    {exp.description && (
                      <p className="text-sm text-slate-600 mb-1">{exp.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatDate(exp.date)}
                      </span>
                      {exp.paymentMethod && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                          {formatPaymentMethod(exp.paymentMethod)}
                        </span>
                      )}
                    </div>
                    {exp.isPolicyViolation && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                        {exp.policyViolationReason}
                      </p>
                    )}
                    <p className="font-semibold text-slate-900 mt-1">${exp.amount.toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 sm:ml-4">
                    <p className="font-semibold text-slate-900">${exp.amount.toLocaleString()}</p>
                    {exp.status === "pending" && (
                      <div className="w-full sm:w-auto">
                        <label htmlFor={`comment-${exp._id}`} className="sr-only">
                          Admin comment
                        </label>
                        <input
                          type="text"
                          id={`comment-${exp._id}`}
                          placeholder="Comment (optional)"
                          value={commentDrafts[exp._id] || ""}
                          onChange={(e) => handleCommentChange(exp._id, e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleReview(exp._id, "approved")}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
                          >
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReview(exp._id, "rejected")}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                          >
                            <XCircle className="h-4 w-4" aria-hidden="true" />
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                    {exp.status !== "pending" && exp.adminComment && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Admin: {exp.adminComment}</span>
                      </p>
                    )}
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

export default AdminTripReview;