import { useAuth } from '../context/AuthContext'
import { useLocation, useNavigate } from 'react-router-dom'

export default function Navbar ({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getTitle = () => {
    if (location.pathname.includes('/users')) return 'Manajemen User'
    if (location.pathname.includes('/alat')) return 'Manajemen Alat'
    if (location.pathname.includes('/kategori')) return 'Manajemen Kategori'
    if (location.pathname.includes('/verifikasi'))
      return 'Verifikasi Peminjaman'
    if (location.pathname.includes('/pengembalian')) return 'Pengembalian'
    if (location.pathname.includes('/denda')) return 'Manajemen Denda'
    return 'Dashboard'
  }

  return (
    <header className='sticky top-0 z-30 bg-white border-b px-6 py-3 flex justify-between items-center'>
      <div className='flex items-center gap-3'>
        <button
          onClick={onMenuClick}
          className='md:hidden text-slate-600 text-xl'
        >
          ☰
        </button>
        <h2 className='font-semibold text-gray-800'>{getTitle()}</h2>
      </div>

      <div className='flex items-center gap-4'>
        <div className='text-right hidden sm:block'>
          <p className='text-sm font-medium text-slate-700'>{user?.name}</p>
          <p className='text-xs text-slate-500 capitalize'>{user?.role}</p>
        </div>

        <button
          onClick={handleLogout}
          className='rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 transition'
        >
          Logout
        </button>
      </div>
    </header>
  )
}
