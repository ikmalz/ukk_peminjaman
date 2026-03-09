import { NavLink } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Sidebar() {
  const { user } = useAuth()

  const menuAdmin = [
    { name: "Dashboard", to: "/admin" },
    { name: "User", to: "/admin/users" },
    { name: "Alat", to: "/admin/alat" },
    { name: "Kategori", to: "/admin/kategori" }
  ]

  const menuPetugas = [
    { name: "Dashboard", to: "/petugas" },
    { name: "Verifikasi Peminjaman", to: "/petugas/verifikasi" },
    { name: "Pengembalian", to: "/petugas/pengembalian" },
    { name: "Denda", to: "/petugas/denda" }
  ]

  const menuPeminjam = [
    { name: "Dashboard", to: "/peminjam" },
    { name: "Daftar Alat", to: "/peminjam/alat" },
    { name: "Ajukan Peminjaman", to: "/peminjam/pinjam" },
    { name: "Pengembalian", to: "/peminjam/kembali" }
  ]

  let menu = []
  if (user?.role === "admin") menu = menuAdmin
  else if (user?.role === "petugas") menu = menuPetugas
  else if (user?.role === "peminjam") menu = menuPeminjam

  return (
    <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-64 flex-col bg-white border-r border-slate-200">

      {/* LOGO */}
      <div className="px-6 py-5 border-b border-slate-200">
        <h1 className="text-base font-semibold text-slate-800">
          Sistem Peminjaman
        </h1>

        <p className="text-xs text-slate-500 capitalize mt-1">
          {user?.role}
        </p>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-3 py-4 space-y-1">

        {menu.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}

      </nav>

      {/* FOOTER */}
      <div className="px-6 py-4 border-t border-slate-200 text-xs text-slate-400">
        © UKK 2026
      </div>

    </aside>
  )
}