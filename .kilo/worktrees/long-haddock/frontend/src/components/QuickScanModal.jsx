import { useState, useEffect } from "react";
import API from "../api/axios";

const QuickScanModal = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [receiptFile, setReceiptFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
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

  const [openTrips, setOpenTrips] = useState([]);
  const [assignMode, setAssignMode] = useState("existing");
  const [selectedTripId, setSelectedTripId] = useState("");
  const [newTripData, setNewTripData] = useState({
    title: "",
    destination: "",
    startDate: "",
    endDate: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const { data } = await API.get("/trips/mine");
        const open = data.filter((t) => t.status === "open");
        setOpenTrips(open);
        if (open.length > 0) setSelectedTripId(open[0]._id);
        else setAssignMode("new");
      } catch (err) {
        console.error("Failed to load trips", err);
      }
    };
    fetchTrips();
  }, []);

  const handleFileSelect = (e) => {
    setReceiptFile(e.target.files[0]);
    setScanWarning("");
  };

  const handleScan = async () => {
    if (!receiptFile) {
      setError("Please select a receipt image");
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

      setFormData({
        category: parsed.category || "other",
        merchantName: parsed.description || "",
        amount: parsed.amount ? parsed.amount.toString() : "",
        date: parsed.date || "",
        billDate: parsed.date || "",
        paymentMethod: "cash",
        description: parsed.description || "",
      });

      if (parsed.lowConfidence) {
        setScanWarning(parsed.confidenceNote);
      }

      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Scan failed. You can still fill manually.");
      setStep(2);
    } finally {
      setScanning(false);
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNewTripChange = (e) => {
    setNewTripData({ ...newTripData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);

    try {
      let tripId = selectedTripId;

      if (assignMode === "new") {
        const { data: createdTrip } = await API.post("/trips", newTripData);
        tripId = createdTrip._id;
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

      await API.post(`/expenses/${tripId}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save expense");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Quick Scan Receipt</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
              ×
            </button>
          </div>

          {error && <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</p>}

          {step === 1 && (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Upload a bill photo. We'll try to extract the details automatically.
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full text-sm mb-4"
              />
              <button
                onClick={handleScan}
                disabled={scanning || !receiptFile}
                className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {scanning ? "Scanning..." : "🔍 Scan & Continue"}
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!receiptFile}
                className="w-full mt-2 text-sm text-gray-500 hover:underline disabled:opacity-50"
              >
                Skip scan, fill manually
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {receiptFile && (
                <img
                  src={URL.createObjectURL(receiptFile)}
                  alt="receipt preview"
                  className="w-full h-40 object-contain border rounded bg-gray-50"
                />
              )}

              {scanWarning && (
                <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                  ⚠ {scanWarning}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="merchantName"
                  placeholder="Merchant name"
                  value={formData.merchantName}
                  onChange={handleFormChange}
                  className="border rounded px-3 py-2 col-span-2"
                />
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className="border rounded px-3 py-2"
                >
                  <option value="travel">Travel</option>
                  <option value="accommodation">Accommodation</option>
                  <option value="food">Food</option>
                  <option value="transport">Transport</option>
                  <option value="other">Other</option>
                </select>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleFormChange}
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
                  onChange={handleFormChange}
                  required
                  className="border rounded px-3 py-2"
                />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  required
                  className="border rounded px-3 py-2"
                />
                <input
                  type="text"
                  name="description"
                  placeholder="Description"
                  value={formData.description}
                  onChange={handleFormChange}
                  className="border rounded px-3 py-2 col-span-2"
                />
              </div>

              <hr />

              <div>
                <p className="text-sm font-medium mb-2">Assign to trip</p>
                <div className="flex gap-4 mb-3 text-sm">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={assignMode === "existing"}
                      onChange={() => setAssignMode("existing")}
                      disabled={openTrips.length === 0}
                    />
                    Existing trip
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={assignMode === "new"}
                      onChange={() => setAssignMode("new")}
                    />
                    Create new trip
                  </label>
                </div>

                {assignMode === "existing" ? (
                  openTrips.length > 0 ? (
                    <select
                      value={selectedTripId}
                      onChange={(e) => setSelectedTripId(e.target.value)}
                      className="border rounded px-3 py-2 w-full"
                    >
                      {openTrips.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.title} ({t.destination})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-400">No open trips. Create a new one below.</p>
                  )
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      name="title"
                      placeholder="Trip title"
                      value={newTripData.title}
                      onChange={handleNewTripChange}
                      className="border rounded px-3 py-2 col-span-2"
                      required
                    />
                    <input
                      type="text"
                      name="destination"
                      placeholder="Destination"
                      value={newTripData.destination}
                      onChange={handleNewTripChange}
                      className="border rounded px-3 py-2 col-span-2"
                    />
                    <input
                      type="date"
                      name="startDate"
                      value={newTripData.startDate}
                      onChange={handleNewTripChange}
                      className="border rounded px-3 py-2"
                      required
                    />
                    <input
                      type="date"
                      name="endDate"
                      value={newTripData.endDate}
                      onChange={handleNewTripChange}
                      className="border rounded px-3 py-2"
                      required
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Expense"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickScanModal;