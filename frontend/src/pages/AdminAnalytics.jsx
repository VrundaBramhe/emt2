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
import {
  BarChart3,
  Loader2,
  AlertTriangle,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const CHART_COLORS = {
  primary: "#4F46E5",     // indigo-600
  secondary: "#8B5CF6",   // violet-500
  success: "#10B981",     // emerald-500
  warning: "#F59E0B",     // amber-500
  danger: "#EF4444",      // red-500
  muted: "#94A3B8",       // slate-400
};

const categoryPalette = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.warning,
  CHART_COLORS.success,
  CHART_COLORS.muted,
];

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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 bg-slate-50 min-h-screen">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" aria-hidden="true" />
          <p className="text-slate-500">Loading analytics…</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6 bg-slate-50 min-h-screen">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-lg font-medium text-slate-900 mb-2">Failed to load analytics</h2>
          <p className="text-slate-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }
  if (!data) return null;

  const categoryChartData = {
    labels: data.byCategory.map((c) => c._id.charAt(0).toUpperCase() + c._id.slice(1)),
    datasets: [
      {
        data: data.byCategory.map((c) => c.total),
        backgroundColor: data.byCategory.map((_, i) => categoryPalette[i % categoryPalette.length]),
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  };

  const monthChartData = {
    labels: data.byMonth.map((m) => `${MONTH_NAMES[m._id.month - 1]} ${m._id.year}`),
    datasets: [
      {
        label: "Approved amount (₹)",
        data: data.byMonth.map((m) => m.total),
        backgroundColor: CHART_COLORS.primary,
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 48,
      },
    ],
  };

  const employeeChartData = {
    labels: data.byEmployee.map((e) => e.name),
    datasets: [
      {
        label: "Approved amount (₹)",
        data: data.byEmployee.map((e) => e.total),
        backgroundColor: CHART_COLORS.secondary,
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 48,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1E293B",
        titleFont: { size: 13, weight: "600" },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (ctx) => `₹${ctx.parsed?.toLocaleString() ?? ctx.raw.toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#64748B", font: { size: 11 } },
      },
      y: {
        grid: { color: "#E2E8F0" },
        ticks: { color: "#64748B", font: { size: 11 }, callback: (val) => `₹${val.toLocaleString()}` },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 16,
          font: { size: 12, family: "inherit" },
          color: "#475569",
        },
      },
      tooltip: {
        backgroundColor: "#1E293B",
        titleFont: { size: 13, weight: "600" },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) => `${ctx.label}: ₹${ctx.raw.toLocaleString()}`,
        },
      },
    },
    cutout: "60%",
  };

  const formatNumber = (num) => (num ?? 0).toLocaleString();

  return (
    <div className="max-w-5xl mx-auto p-6 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-indigo-600" aria-hidden="true" />
          Analytics Dashboard
        </h1>
        <p className="text-slate-500 text-sm mt-1">Overview of expense trends and team spending</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          icon={Clock}
          iconColor="text-amber-600"
          bgColor="bg-amber-50"
          label="Pending Expenses"
          value={formatNumber(data.pendingCount)}
        />
        <SummaryCard
          icon={AlertCircle}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
          label="Policy Violations"
          value={formatNumber(data.violationCount)}
        />
        <SummaryCard
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
          label="Approved This Month"
          value={`₹${formatNumber(data.totalApprovedThisMonth)}`}
        />
        <SummaryCard
          icon={FileText}
          iconColor="text-indigo-600"
          bgColor="bg-indigo-50"
          label="Trips Awaiting Review"
          value={formatNumber(data.tripsPendingReview)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Spend by Category - Pie */}
        <ChartCard title="Spend by Category" icon={TrendingUp} hasData={data.byCategory.length > 0} emptyMessage="No approved expenses yet">
          {data.byCategory.length > 0 && (
            <div style={{ height: 280 }}>
              <Pie data={categoryChartData} options={pieOptions} />
            </div>
          )}
        </ChartCard>

        {/* Top Spenders - Horizontal Bar */}
        <ChartCard title="Top Spenders" icon={Users} hasData={data.byEmployee.length > 0} emptyMessage="No data yet">
          {data.byEmployee.length > 0 && (
            <div style={{ height: 280 }}>
              <Bar data={employeeChartData} options={{ ...chartOptions, indexAxis: "y" }} />
            </div>
          )}
        </ChartCard>
      </div>

      {/* Monthly Spend Trend - Vertical Bar */}
      <ChartCard title="Monthly Spend Trend" icon={TrendingUp} hasData={data.byMonth.length > 0} emptyMessage="No data yet" fullWidth>
        {data.byMonth.length > 0 && (
          <div style={{ height: 300 }}>
            <Bar data={monthChartData} options={chartOptions} />
          </div>
        )}
      </ChartCard>
    </div>
  );
};

const SummaryCard = ({ icon: Icon, iconColor, bgColor, label, value }) => (
  <div className={`bg-white border border-slate-200 rounded-xl shadow-sm p-5 ${bgColor}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
      </div>
      <div className={`p-2 rounded-lg ${bgColor.replace("bg-", "bg-").replace("50", "100")}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, icon: Icon, hasData, emptyMessage, fullWidth, children }) => (
  <div className={`bg-white border border-slate-200 rounded-xl shadow-sm ${fullWidth ? "" : ""}`}>
    <div className="p-5 border-b border-slate-100">
      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
        <Icon className="h-5 w-5 text-slate-400" aria-hidden="true" />
        {title}
      </h3>
    </div>
    <div className="p-5">
      {hasData ? (
        children
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Icon className="h-10 w-10 text-slate-300 mb-3" aria-hidden="true" />
          <p className="text-slate-500 text-sm">{emptyMessage}</p>
        </div>
      )}
    </div>
  </div>
);

export default AdminAnalytics;