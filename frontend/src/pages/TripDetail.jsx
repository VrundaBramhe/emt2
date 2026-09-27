import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Briefcase,
  CreditCard,
  Upload,
  ScanLine,
  AlertTriangle,
  Trash2,
  Loader2,
  Plus,
  X,
  ChevronDown,
  Receipt,
  Tag,
  DollarSign,
  MessageSquare,
  Send,
} from "lucide-react";

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanWarning, setScanWarning] = useState("");

  const [formData, setFormData] = useState({
    category: "travel",
    merchantName: "",
    amount: "",
    date: "",
    billDate: "",
    paymentMethod: "cash",
    description: "",
  });
  const [receiptFile, setReceiptFile] = useState(null);

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileSelect = (e) => {
    setReceiptFile(e.target.files[0]);
    setScanWarning("");
  };

  const handleScanReceipt = async () => {
    if (!receiptFile) {
      setError("Please select a receipt image first, then click Scan");
      return;
    }
    setError("");
    setScanWarning("");
    setScanning(true);

    try {
      const data = new FormData();
      data.append("receipt", receiptFile);

      const { data: parsed } = await API.post("/ocr/scan", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFormData((prev) => ({
        ...prev,
        category: parsed.category || prev.category,
        amount: parsed.amount ? parsed.amount.toString() : prev.amount,
        date: parsed.date || prev.date,
        billDate: parsed.date || prev.billDate,
        description: parsed.description || prev.description,
        merchantName: parsed.description || prev.merchantName,
      }));

      if (parsed.lowConfidence) {
        setScanWarning(parsed.confidenceNote);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to scan receipt. Please fill manually.");
    } finally {
      setScanning(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!receiptFile) {
      setError("Please attach a receipt image");
      return;
    }

    const data = new FormData();
    data.append("category", formData.category);
    data.append("merchantName", formData.merchantName);
    data.append("amount", formData.amount);
    data.append("date", formData.date);
    if (formData.billDate) data.append("billDate", formData.billDate);
    data.append("paymentMethod", formData.paymentMethod);
    data.append("description", formData.description);
    data.append("receipt", receiptFile);

    try {
      setSubmitting(true);
      await API.post(`/expenses/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFormData({
        category: "travel",
        merchantName: "",
        amount: "",
        date: "",
        billDate: "",
        paymentMethod: "cash",
        description: "",
      });
      setReceiptFile(null);
      setScanWarning("");
      setShowForm(false);
      fetchTrip();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await API.delete(`/expenses/${expenseId}`);
      fetchTrip();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete expense");
    }
  };

  const handleSubmitTrip = async () => {
    if (!confirm("Submit this trip for admin review? You won't be able to add more expenses.")) return;
    try {
      await API.put(`/trips/${id}/submit`);
      fetchTrip();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit trip");
    }
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

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const isOwner = trip.employee._id === user._id || trip.employee === user._id;
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-5 w-5 text-indigo-600" aria-hidden="true" />
              <h1 className="text-2xl font-semibold text-slate-900">{trip.title}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 mb-3">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <span>{trip.destination}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <span>{formatDate(trip.startDate)} – {formatDate(trip.endDate)}</span>
              </div>
            </div>
            {trip.purpose && (
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <Briefcase className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <span>Purpose: {trip.purpose}</span>
              </div>
            )}
          </div>
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${tripStatus.bg} ${tripStatus.text} whitespace-nowrap`}>
            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
          </span>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <span>Total expenses: <strong className="text-slate-900">${totalAmount.toLocaleString()}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span>Approved: <strong className="text-emerald-700">${trip.totalApprovedAmount.toLocaleString()}</strong></span>
          </div>
        </div>

        {isOwner && trip.status === "open" && (
          <button
            onClick={handleSubmitTrip}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            Submit Trip for Approval
          </button>
        )}
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

      {isOwner && trip.status === "open" && (
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            {showForm ? (
              <>
                <X className="h-4 w-4" aria-hidden="true" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Expense
              </>
            )}
          </button>

          {showForm && (
            <form
              onSubmit={handleAddExpense}
              className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mt-4 space-y-5"
            >
              <h2 className="text-lg font-semibold text-slate-900">Add New Expense</h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Receipt Image
                </label>
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    required
                    className="flex-1 text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleScanReceipt}
                    disabled={scanning || !receiptFile}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors whitespace-nowrap"
                  >
                    {scanning && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    <ScanLine className="h-4 w-4" aria-hidden="true" />
                    <span>{scanning ? "Scanning…" : "Scan Receipt"}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Upload receipt, then click Scan to auto-fill fields below. Review before submitting.
                </p>
                {scanWarning && (
                  <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs mt-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    {scanWarning}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="merchantName" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Merchant / Vendor Name
                  </label>
                  <input
                    type="text"
                    id="merchantName"
                    name="merchantName"
                    placeholder="e.g. Uber, Hotel Taj, Restaurant"
                    value={formData.merchantName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Category
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <option value="travel">Travel</option>
                      <option value="accommodation">Accommodation</option>
                      <option value="food">Food</option>
                      <option value="transport">Local Transport</option>
                      <option value="other">Other</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                  </div>
                </div>

                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Payment Method
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
                    <select
                      id="paymentMethod"
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <option value="cash">Cash</option>
                      <option value="personal_card">Personal Card</option>
                      <option value="company_card">Company Card</option>
                      <option value="other">Other</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                  </div>
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Amount (₹)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Date (filing date)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="billDate" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Bill Date (from receipt)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
                    <input
                      type="date"
                      id="billDate"
                      name="billDate"
                      value={formData.billDate}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description (optional)
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  placeholder="Additional details"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  <span>{submitting ? "Uploading…" : "Add Expense"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Expenses ({expenses.length})</h2>
      </div>

      {expenses.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
          <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No expenses yet</h3>
          <p className="text-slate-500 text-sm">Add your first expense using the button above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((exp) => {
            const status = expenseStatusConfig[exp.status] || expenseStatusConfig.pending;
            return (
              <div key={exp._id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200">
                <div className="flex gap-4">
                  <a href={exp.receiptUrl} target="_blank" rel="noreferrer" className="flex-shrink-0">
                    <img
                      src={exp.receiptUrl}
                      alt="Receipt thumbnail"
                      className="w-20 h-20 object-cover rounded-lg border border-slate-200"
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
                    {exp.adminComment && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Admin: {exp.adminComment}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <p className="font-semibold text-slate-900">${exp.amount.toLocaleString()}</p>
                    {isOwner && trip.status === "open" && (
                      <button
                        onClick={() => handleDeleteExpense(exp._id)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                      >
                        Delete
                      </button>
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

export default TripDetail;