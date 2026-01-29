import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white border-b px-6 py-3 flex justify-between items-center">
      <h2 className="font-semibold text-gray-800">
        Dashboard
      </h2>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700">
            {user?.name}
          </p>
          <p className="text-xs text-gray-500">
            {user?.role}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
