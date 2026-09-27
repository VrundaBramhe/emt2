import { useState, useEffect } from "react";
import API from "../api/axios";
import {
  FileText,
  Loader2,
  Save,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Tag,
  CreditCard,
} from "lucide-react";

const CATEGORIES = ["travel", "accommodation", "food", "transport", "other"];

const categoryIcons = {
  travel: "✈️",
  accommodation: "🏨",
  food: "🍽️",
  transport: "🚌",
  other: "📦",
};

const AdminPolicies = () => {
  const [policies, setPolicies] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPolicies = async () => {
    try {
      const { data } = await API.get("/policies");
      const map = {};
      data.forEach((p) => {
        map[p.category] = { maxAmountPerExpense: p.maxAmountPerExpense, description: p.description || "" };
      });
      setPolicies(map);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleChange = (category, field, value) => {
    setPolicies((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleSave = async (category) => {
    setError("");
    setSuccess("");
    setSaving((prev) => ({ ...prev, [category]: true }));

    try {
      const payload = policies[category] || {};
      await API.put(`/policies/${category}`, {
        maxAmountPerExpense: Number(payload.maxAmountPerExpense) || 0,
        description: payload.description || "",
      });
      setSuccess(`${category.charAt(0).toUpperCase() + category.slice(1)} policy saved`);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to save ${category} policy`);
    } finally {
      setSaving((prev) => ({ ...prev, [category]: false }));
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-slate-50 min-h-screen">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" aria-hidden="true" />
          <p className="text-slate-500">Loading policies…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <FileText className="h-6 w-6 text-indigo-600" aria-hidden="true" />
          Expense Policies
        </h1>
        <p className="text-slate-500 text-sm mt-2">
          Set maximum allowed amounts per expense category. Expenses exceeding these limits will be flagged for admin review.
        </p>
      </div>

      {error && (
        <div
          className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-6"
          role="alert"
        >
          <AlertTriangle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}
      {success && (
        <div
          className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm mb-6"
          role="status"
        >
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
          {success}
        </div>
      )}

      <div className="space-y-4">
        {CATEGORIES.map((category) => {
          const policy = policies[category] || { maxAmountPerExpense: "", description: "" };
          const isSaving = saving[category];
          return (
            <div
              key={category}
              className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl" aria-hidden="true">{categoryIcons[category]}</span>
                <h3 className="font-semibold text-slate-900 capitalize">{category}</h3>
                <Tag className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label htmlFor={`max-${category}`} className="block text-sm font-medium text-slate-700 mb-1.5">
                    Max Amount (₹)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
                    <input
                      type="number"
                      id={`max-${category}`}
                      min="0"
                      step="100"
                      value={policy.maxAmountPerExpense || ""}
                      onChange={(e) => handleChange(category, "maxAmountPerExpense", e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="e.g. 5000"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Set to 0 for no limit</p>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor={`desc-${category}`} className="block text-sm font-medium text-slate-700 mb-1.5">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    id={`desc-${category}`}
                    value={policy.description || ""}
                    onChange={(e) => handleChange(category, "description", e.target.value)}
                    placeholder="Policy notes or guidelines"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end">
                  <button
                    onClick={() => handleSave(category)}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    <Save className="h-4 w-4" aria-hidden="true" />
                    <span>{isSaving ? "Saving…" : "Save Policy"}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPolicies;