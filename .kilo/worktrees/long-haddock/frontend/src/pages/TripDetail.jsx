import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";

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

  const expenseStatusColor = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  if (loading) return <p className="text-center mt-10">Loading trip...</p>;
  if (!trip) return <p className="text-center mt-10 text-red-600">{error}</p>;

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const isOwner = trip.employee._id === user._id || trip.employee === user._id;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button onClick={() => navigate(-1)} className="text-blue-600 text-sm mb-4">
        ← Back
      </button>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{trip.title}</h1>
            <p className="text-gray-600">{trip.destination}</p>
            <p className="text-sm text-gray-400">
              {new Date(trip.startDate).toLocaleDateString()} -{" "}
              {new Date(trip.endDate).toLocaleDateString()}
            </p>
            {trip.purpose && <p className="text-sm mt-2">Purpose: {trip.purpose}</p>}
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-gray-200 capitalize">
            {trip.status}
          </span>
        </div>

        <div className="mt-4 flex gap-4 text-sm">
          <p>Total expenses: <strong>₹{totalAmount}</strong></p>
          <p>Approved: <strong className="text-green-700">₹{trip.totalApprovedAmount}</strong></p>
        </div>

        {isOwner && trip.status === "open" && (
          <button
            onClick={handleSubmitTrip}
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
          >
            Submit Trip for Approval
          </button>
        )}
      </div>

      {error && <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</p>}

      {isOwner && trip.status === "open" && (
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "+ Add Expense"}
          </button>

          {showForm && (
            <form
              onSubmit={handleAddExpense}
              className="bg-white shadow rounded-lg p-6 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-600 block mb-1">Receipt Image</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    required
                    className="flex-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleScanReceipt}
                    disabled={scanning || !receiptFile}
                    className="bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
                  >
                    {scanning ? "Scanning..." : "🔍 Scan Receipt"}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Upload receipt, then click Scan to auto-fill fields below. Review before submitting.
                </p>
                {scanWarning && (
                  <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded mt-2">
                    ⚠ {scanWarning}
                  </p>
                )}
              </div>

              <input
                type="text"
                name="merchantName"
                placeholder="Merchant / Vendor name"
                value={formData.merchantName}
                onChange={handleChange}
                className="border rounded px-3 py-2 sm:col-span-2"
              />

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="border rounded px-3 py-2"
              >
                <option value="travel">Travel</option>
                <option value="accommodation">Accommodation</option>
                <option value="food">Food</option>
                <option value="transport">Local Transport</option>
                <option value="other">Other</option>
              </select>

              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="border rounded px-3 py-2"
              >
                <option value="cash">Cash</option>
                <option value="personal_card">Personal Card</option>
                <option value="company_card">Company Card</option>
                <option value="other">Other</option>
              </select>

              <input
                type="number"
                name="amount"
                placeholder="Amount (₹)"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="border rounded px-3 py-2"
              />

              <div>
                <label className="text-xs text-gray-500 block mb-1">Date (filing date)</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="border rounded px-3 py-2 w-full"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Bill date (optional, from receipt)</label>
                <input
                  type="date"
                  name="billDate"
                  value={formData.billDate}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>

              <input
                type="text"
                name="description"
                placeholder="Description (optional)"
                value={formData.description}
                onChange={handleChange}
                className="border rounded px-3 py-2 sm:col-span-2"
              />

              <button
                type="submit"
                disabled={submitting}
                className="bg-green-600 text-white py-2 rounded hover:bg-green-700 sm:col-span-2 disabled:opacity-50"
              >
                {submitting ? "Uploading..." : "Add Expense"}
              </button>
            </form>
          )}
        </div>
      )}

      <h2 className="text-lg font-semibold mb-3">Expenses ({expenses.length})</h2>

      {expenses.length === 0 ? (
        <p className="text-gray-500">No expenses added yet.</p>
      ) : (
        <div className="space-y-3">
          {expenses.map((exp) => (
            <div key={exp._id} className="bg-white shadow rounded-lg p-4 flex gap-4">
              <a href={exp.receiptUrl} target="_blank" rel="noreferrer">
                <img
                  src={exp.receiptUrl}
                  alt="receipt"
                  className="w-20 h-20 object-cover rounded border"
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
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${expenseStatusColor[exp.status]}`}
                    >
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
                  <p className="text-xs text-orange-600 mt-1">{exp.policyViolationReason}</p>
                )}
                {exp.adminComment && (
                  <p className="text-xs text-gray-500 mt-1">Admin: {exp.adminComment}</p>
                )}
                <p className="font-semibold mt-1">₹{exp.amount}</p>
              </div>
              {isOwner && trip.status === "open" && (
                <button
                  onClick={() => handleDeleteExpense(exp._id)}
                  className="text-red-500 text-sm hover:underline self-start"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TripDetail;