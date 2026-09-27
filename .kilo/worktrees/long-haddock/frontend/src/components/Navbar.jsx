import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <Link to="/" className="text-xl font-bold">
        ExpenseTrack
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm">
              {user.name} ({user.role})
            </span>
            {user.role === "admin" ? (
              <>
                <Link to="/admin" className="hover:underline">
                  Admin Dashboard
                </Link>
                <Link to="/admin/analytics" className="hover:underline">
                  Analytics
                </Link>
                <Link to="/admin/policies" className="hover:underline">
                  Policies
                </Link>
              </>
            ) : (
              <Link to="/dashboard" className="hover:underline">
                My Trips
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="bg-blue-800 px-3 py-1 rounded hover:bg-blue-900 text-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:underline">
              Login
            </Link>
            <Link to="/register" className="hover:underline">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
