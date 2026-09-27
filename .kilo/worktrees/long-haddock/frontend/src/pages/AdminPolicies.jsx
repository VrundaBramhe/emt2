import { useState, useEffect } from "react";
import API from "../api/axios";

const CATEGORIES = ["travel", "accommodation", "food", "transport", "other"];

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
      setSuccess(`${category} policy saved`);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to save ${category} policy`);
    } finally {
      setSaving((prev) => ({ ...prev, [category]: false }));
    }
  };

  if (loading) return <p className="text-center mt-10">Loading policies...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Expense Policies</h1>
      <p className="text-sm text-gray-500 mb-6">
        Set the maximum allowed amount per expense for each category. Expenses exceeding these
        limits will be flagged for admin review.
      </p>

      {error && <p className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">{error}</p>}
      {success && <p className="bg-green-100 text-green-700 text-sm p-2 rounded mb-4">{success}</p>}

      <div className="space-y-4">
        {CATEGORIES.map((category) => (
          <div key={category} className="bg-white shadow rounded-lg p-4">
            <h3 className="font-semibold capitalize mb-3">{category}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Max amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={policies[category]?.maxAmountPerExpense || ""}
                  onChange={(e) => handleChange(category, "maxAmountPerExpense", e.target.value)}
                  className="border rounded px-3 py-2 w-full"
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-1">Description</label>
                <input
                  type="text"
                  value={policies[category]?.description || ""}
                  onChange={(e) => handleChange(category, "description", e.target.value)}
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Optional note"
                />
              </div>

              <button
                onClick={() => handleSave(category)}
                disabled={saving[category]}
                className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving[category] ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPolicies;