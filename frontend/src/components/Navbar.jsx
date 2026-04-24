import { useAuth } from '../context/AuthContext'
import { useLocation, useNavigate } from 'react-router-dom'

const pageTitles = {
  '/users': 'Kelola Pengguna',
  '/alat': 'Inventaris Alat',
  '/kategori': 'Kategori',
  '/verifikasi': 'Verifikasi Peminjaman',
  '/pengembalian': 'Verifikasi Pengembalian',
  '/denda': 'Denda',
  '/log': 'Log Aktivitas',
  '/scan': 'Scan QR Code',
  '/konfigurasi-denda': 'Konfigurasi Denda',
  '/pinjam': 'Pinjam Alat',
  '/kembali': 'Pengembalian Saya'
}

export default function Navbar ({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const title =
    Object.entries(pageTitles).find(([key]) =>
      location.pathname.includes(key)
    )?.[1] ?? 'Dashboard'

  const initials = (name = '') =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  return (
    <header className='sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur-sm px-5 md:px-6 shadow-sm'>
      {/* Left Section */}
      <div className='flex items-center gap-3'>
        <button
          onClick={onMenuClick}
          className='flex md:hidden items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors'
        >
          <svg
            width='18'
            height='18'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            viewBox='0 0 24 24'
          >
            <line x1='3' y1='6' x2='21' y2='6' />
            <line x1='3' y1='12' x2='21' y2='12' />
            <line x1='3' y1='18' x2='21' y2='18' />
          </svg>
        </button>

        <div className='hidden sm:flex items-center gap-2'>
          <span className='text-gray-400 text-sm'>/</span>
          <h1 className='text-sm font-medium text-gray-700'>{title}</h1>
        </div>
        <h1 className='text-base font-semibold text-gray-900 sm:hidden'>
          {title}
        </h1>
      </div>

      {/* Right Section */}
      <div className='flex items-center gap-3'>
        <div className='hidden sm:flex items-center gap-3'>
          <div className='text-right'>
            <p className='text-xs font-medium text-gray-700'>{user?.name}</p>
            <p className='text-[10px] text-gray-400 capitalize'>{user?.role}</p>
          </div>
          <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600'>
            {initials(user?.name)}
          </div>
        </div>

        {/* Divider */}
        <div className='hidden sm:block h-5 w-px bg-gray-200' />

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className='flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors'
        >
          <svg
            width='12'
            height='12'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
            <polyline points='16,17 21,12 16,7' />
            <line x1='21' y1='12' x2='9' y2='12' />
          </svg>
          <span className='hidden sm:inline'>Keluar</span>
        </button>

        {/* Mobile logout icon only */}
        <button
          onClick={handleLogout}
          className='flex sm:hidden items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors'
          title='Keluar'
        >
          <svg
            width='16'
            height='16'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
            <polyline points='16,17 21,12 16,7' />
            <line x1='21' y1='12' x2='9' y2='12' />
          </svg>
        </button>
      </div>
    </header>
  )
}
