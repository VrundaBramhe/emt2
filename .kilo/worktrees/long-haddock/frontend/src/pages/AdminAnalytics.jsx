import { useState, useEffect } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import API from "../api/axios";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const CATEGORY_COLORS = {
  travel: "#3B82F6",
  accommodation: "#8B5CF6",
  food: "#F59E0B",
  transport: "#10B981",
  other: "#6B7280",
};

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await API.get("/analytics/summary");
        setData(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading analytics...</p>;
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;
  if (!data) return null;

  const categoryChartData = {
    labels: data.byCategory.map((c) => c._id),
    datasets: [
      {
        data: data.byCategory.map((c) => c.total),
        backgroundColor: data.byCategory.map((c) => CATEGORY_COLORS[c._id] || "#999"),
      },
    ],
  };

  const monthChartData = {
    labels: data.byMonth.map((m) => `${MONTH_NAMES[m._id.month - 1]} ${m._id.year}`),
    datasets: [
      {
        label: "Approved amount (₹)",
        data: data.byMonth.map((m) => m.total),
        backgroundColor: "#3B82F6",
      },
    ],
  };

  const employeeChartData = {
    labels: data.byEmployee.map((e) => e.name),
    datasets: [
      {
        label: "Approved amount (₹)",
        data: data.byEmployee.map((e) => e.total),
        backgroundColor: "#8B5CF6",
      },
    ],
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-xs text-gray-500">Pending Expenses</p>
          <p className="text-2xl font-bold text-yellow-600">{data.pendingCount}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-xs text-gray-500">Policy Violations (pending)</p>
          <p className="text-2xl font-bold text-orange-600">{data.violationCount}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-xs text-gray-500">Approved This Month</p>
          <p className="text-2xl font-bold text-green-600">₹{data.totalApprovedThisMonth}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <p className="text-xs text-gray-500">Trips Awaiting Review</p>
          <p className="text-2xl font-bold text-blue-600">{data.tripsPendingReview}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="font-semibold mb-3">Spend by Category</h3>
          {data.byCategory.length > 0 ? (
            <Pie data={categoryChartData} />
          ) : (
            <p className="text-sm text-gray-400">No approved expenses yet</p>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <h3 className="font-semibold mb-3">Top Spenders</h3>
          {data.byEmployee.length > 0 ? (
            <Bar
              data={employeeChartData}
              options={{ indexAxis: "y", plugins: { legend: { display: false } } }}
            />
          ) : (
            <p className="text-sm text-gray-400">No data yet</p>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="font-semibold mb-3">Monthly Spend Trend</h3>
        {data.byMonth.length > 0 ? (
          <Bar data={monthChartData} options={{ plugins: { legend: { display: false } } }} />
        ) : (
          <p className="text-sm text-gray-400">No data yet</p>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;