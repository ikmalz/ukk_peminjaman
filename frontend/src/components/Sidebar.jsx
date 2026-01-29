import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-blue-700 text-white flex flex-col">
      {/* Header sidebar */}
      <div className="px-4 py-5 border-b border-blue-600">
        <h1 className="text-lg font-bold leading-tight">
          Sistem Peminjaman
        </h1>
        <p className="text-xs text-blue-200">Admin UKK</p>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `block px-3 py-2 rounded text-sm font-medium ${
              isActive
                ? "bg-blue-600"
                : "hover:bg-blue-600/70"
            }`
          }
        >
          Dashboard
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="p-4 text-xs text-blue-200 border-t border-blue-600">
        © UKK 2026
      </div>
    </aside>
  );
}
