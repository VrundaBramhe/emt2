import { useState, useEffect } from "react";
import API from "../api/axios";
import {
  X,
  Upload,
  ScanLine,
  Loader2,
  ArrowRight,
  AlertTriangle,
  ChevronDown,
  CreditCard,
  Tag,
  DollarSign,
  Calendar,
  Briefcase,
  MapPin,
  Plus,
  Radio,
  CheckCircle2,
  Image,
} from "lucide-react";

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

  const formatTripOption = (t) => `${t.title} (${t.destination})`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 id="modal-title" className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Image className="h-5 w-5 text-indigo-600" aria-hidden="true" />
              Quick Scan Receipt
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {error && (
            <div
              className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4"
              role="alert"
            >
              <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${step >= 1 ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-400"}`}>
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white text-slate-400">1</span>
              <span>Upload</span>
            </div>
            <div className="hidden sm:block w-8 h-0.5 bg-slate-200" />
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${step >= 2 ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-400"}`}>
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white text-slate-400">2</span>
              <span>Review & Save</span>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 text-center">
                Upload a receipt photo. We'll extract details automatically using OCR.
              </p>

              <div className="relative">
                <input
                  type="file"
                  id="receipt-upload"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="sr-only"
                  aria-describedby="upload-hint"
                />
                <label
                  htmlFor="receipt-upload"
                  className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                >
                  <Upload className="h-10 w-10 text-slate-400" aria-hidden="true" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-700">Drag & drop or click to upload</p>
                    <p id="upload-hint" className="text-xs text-slate-400">PNG, JPG up to 10MB</p>
                  </div>
                </label>
              </div>

              {receiptFile && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <Image className="h-8 w-8 text-indigo-600" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{receiptFile.name}</p>
                      <p className="text-xs text-slate-500">{(receiptFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReceiptFile(null)}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                    aria-label="Remove file"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              )}

              <button
                onClick={handleScan}
                disabled={scanning || !receiptFile}
                className="w-full py-3 px-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {scanning && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <ScanLine className="h-4 w-4" aria-hidden="true" />
                <span>{scanning ? "Scanning…" : "Scan & Continue"}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                onClick={() => setStep(2)}
                disabled={!receiptFile}
                className="w-full py-2.5 px-4 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Skip scan, fill manually
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              {receiptFile && (
                <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={URL.createObjectURL(receiptFile)}
                    alt="Receipt preview"
                    className="w-full h-full object-contain p-2"
                  />
                </div>
              )}

              {scanWarning && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  {scanWarning}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label htmlFor="qs-merchant" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Merchant / Vendor
                    </label>
                    <input
                      type="text"
                      id="qs-merchant"
                      name="merchantName"
                      placeholder="e.g. Uber, Hotel Taj"
                      value={formData.merchantName}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="qs-category" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Category
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
                      <select
                        id="qs-category"
                        name="category"
                        value={formData.category}
                        onChange={handleFormChange}
                        className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors cursor-pointer"
                      >
                        <option value="travel">Travel</option>
                        <option value="accommodation">Accommodation</option>
                        <option value="food">Food</option>
                        <option value="transport">Transport</option>
                        <option value="other">Other</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="qs-payment" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Payment Method
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
                      <select
                        id="qs-payment"
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleFormChange}
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
                    <label htmlFor="qs-amount" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Amount (₹)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
                      <input
                        type="number"
                        id="qs-amount"
                        name="amount"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={handleFormChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="qs-date" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
                      <input
                        type="date"
                        id="qs-date"
                        name="date"
                        value={formData.date}
                        onChange={handleFormChange}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="qs-description" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    id="qs-description"
                    name="description"
                    placeholder="Additional details"
                    value={formData.description}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <p className="text-sm font-medium text-slate-900 mb-3">Assign to trip</p>

                <div className="flex gap-6 mb-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={assignMode === "existing"}
                      onChange={() => setAssignMode("existing")}
                      disabled={openTrips.length === 0}
                      className="sr-only peer"
                    />
                    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-colors ${assignMode === "existing" ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"} peer-disabled:opacity-50 peer-disabled:cursor-not-allowed`}>
                      <Radio className={`h-5 w-5 ${assignMode === "existing" ? "text-indigo-600" : "text-slate-400"}`} aria-hidden="true" />
                      <span className="text-sm font-medium text-slate-700">Existing trip</span>
                    </div>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={assignMode === "new"}
                      onChange={() => setAssignMode("new")}
                      className="sr-only peer"
                    />
                    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-colors ${assignMode === "new" ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"}`}>
                      <Plus className="h-5 w-5 text-slate-400" aria-hidden="true" />
                      <span className="text-sm font-medium text-slate-700">Create new trip</span>
                    </div>
                  </label>
                </div>

                {assignMode === "existing" ? (
                  openTrips.length > 0 ? (
                    <div>
                      <label htmlFor="qs-trip-select" className="block text-sm font-medium text-slate-700 mb-1.5">
                        Select open trip
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
                        <select
                          id="qs-trip-select"
                          value={selectedTripId}
                          onChange={(e) => setSelectedTripId(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors cursor-pointer"
                        >
                          {openTrips.map((t) => (
                            <option key={t._id} value={t._id}>
                              {formatTripOption(t)}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No open trips available. Create a new one instead.</p>
                  )
                ) : (
                  <div className="grid grid-cols-2 gap-3 space-y-3">
                    <div className="col-span-2">
                      <label htmlFor="qs-trip-title" className="block text-sm font-medium text-slate-700 mb-1.5">
                        Trip Title
                      </label>
                      <input
                        type="text"
                        id="qs-trip-title"
                        name="title"
                        placeholder="e.g. Client visit - Mumbai"
                        value={newTripData.title}
                        onChange={handleNewTripChange}
                        required
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="qs-trip-destination" className="block text-sm font-medium text-slate-700 mb-1.5">
                        Destination
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
                        <input
                          type="text"
                          id="qs-trip-destination"
                          name="destination"
                          placeholder="City, Country"
                          value={newTripData.destination}
                          onChange={handleNewTripChange}
                          required
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="qs-start-date" className="block text-sm font-medium text-slate-700 mb-1.5">
                        Start Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
                        <input
                          type="date"
                          id="qs-start-date"
                          name="startDate"
                          value={newTripData.startDate}
                          onChange={handleNewTripChange}
                          required
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="qs-end-date" className="block text-sm font-medium text-slate-700 mb-1.5">
                        End Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
                        <input
                          type="date"
                          id="qs-end-date"
                          name="endDate"
                          value={newTripData.endDate}
                          onChange={handleNewTripChange}
                          required
                          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3 px-4 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>{submitting ? "Saving…" : "Save Expense"}</span>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickScanModal;