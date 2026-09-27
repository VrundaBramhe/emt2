import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  LogOut,
  User,
  ChevronDown,
  CreditCard,
} from "lucide-react";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleLabel = user?.role === "admin" ? "Admin" : "Employee";

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors" aria-label="ExpenseTrack Home">
          <CreditCard className="h-8 w-8" aria-hidden="true" />
          <span className="text-xl font-semibold tracking-tight">ExpenseTrack</span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-4 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                <User className="h-4 w-4 text-slate-500" aria-hidden="true" />
                <div className="flex flex-col items-end leading-tight">
                  <span className="text-sm font-medium text-slate-900">{user.name}</span>
                  <span className="text-xs text-slate-500 capitalize">{roleLabel}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {user.role === "admin" ? (
                  <>
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                    <Link
                      to="/admin/analytics"
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <BarChart3 className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Analytics</span>
                    </Link>
                    <Link
                      to="/admin/policies"
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <FileText className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Policies</span>
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">My Trips</span>
                  </Link>
                )}

                <div className="relative" role="menu">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    aria-label="User menu"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Logout</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;