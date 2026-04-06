import { useAuth } from '../context/AuthContext'
import { useLocation, useNavigate } from 'react-router-dom'

const pageTitles = {
  '/users': 'Users',
  '/alat': 'Alat',
  '/kategori': 'Kategori',
  '/verifikasi': 'Verifikasi',
  '/pengembalian': 'Pengembalian',
  '/denda': 'Denda'
}

const initials = (name = '') =>
  name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

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

  return (
    <header className='sticky top-0 z-30 flex h-[52px] items-center justify-between border-b border-gray-200 bg-white px-5'>
      {/* Left */}
      <div className='flex items-center gap-3'>
        <button
          onClick={onMenuClick}
          className='flex items-center justify-center rounded-md p-1.5 text-gray-400 hover:bg-gray-100 transition md:hidden'
          aria-label='Menu'
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
        <span className='text-sm font-semibold tracking-tight text-gray-900'>
          {title}
        </span>
      </div>

      {/* Right */}
      <div className='flex items-center gap-3'>
        {/* User */}
        <div className='flex items-center gap-2.5'>
          <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[10px] font-bold text-blue-600'>
            {initials(user?.name)}
          </div>
          <div className='hidden sm:block leading-tight text-right'>
            <p className='text-[13px] font-semibold text-gray-900'>
              {user?.name}
            </p>
            <p className='text-[11px] capitalize text-gray-400'>{user?.role}</p>
          </div>
        </div>

        <div className='h-5 w-px bg-gray-200' />

        <button
          onClick={handleLogout}
          className='rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition'
        >
          Keluar
        </button>
      </div>
    </header>
  )
}
