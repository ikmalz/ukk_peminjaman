import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Ico = {
  grid: (
    <svg
      width='14'
      height='14'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      viewBox='0 0 24 24'
    >
      <rect x='3' y='3' width='7' height='7' rx='1.5' />
      <rect x='14' y='3' width='7' height='7' rx='1.5' />
      <rect x='3' y='14' width='7' height='7' rx='1.5' />
      <rect x='14' y='14' width='7' height='7' rx='1.5' />
    </svg>
  ),
  users: (
    <svg
      width='14'
      height='14'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      viewBox='0 0 24 24'
    >
      <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
      <circle cx='9' cy='7' r='4' />
      <path d='M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' />
    </svg>
  ),
  tool: (
    <svg
      width='14'
      height='14'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      viewBox='0 0 24 24'
    >
      <path d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' />
    </svg>
  ),
  tag: (
    <svg
      width='14'
      height='14'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      viewBox='0 0 24 24'
    >
      <path d='M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z' />
      <circle cx='7' cy='7' r='1.5' />
    </svg>
  ),
  check: (
    <svg
      width='14'
      height='14'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      viewBox='0 0 24 24'
    >
      <polyline points='9,11 12,14 22,4' />
      <path d='M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' />
    </svg>
  ),
  return: (
    <svg
      width='14'
      height='14'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      viewBox='0 0 24 24'
    >
      <polyline points='1,4 1,10 7,10' />
      <path d='M3.51 15a9 9 0 1 0 .49-3.99' />
    </svg>
  ),
  alert: (
    <svg
      width='14'
      height='14'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      viewBox='0 0 24 24'
    >
      <circle cx='12' cy='12' r='10' />
      <line x1='12' y1='8' x2='12' y2='12' />
      <line x1='12' y1='16' x2='12.01' y2='16' />
    </svg>
  ),
  list: (
    <svg
      width='14'
      height='14'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      viewBox='0 0 24 24'
    >
      <path d='M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2' />
      <rect x='9' y='3' width='6' height='4' rx='1' />
      <line x1='9' y1='12' x2='15' y2='12' />
      <line x1='9' y1='16' x2='13' y2='16' />
    </svg>
  ),
  plus: (
    <svg
      width='14'
      height='14'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      viewBox='0 0 24 24'
    >
      <line x1='12' y1='5' x2='12' y2='19' />
      <line x1='5' y1='12' x2='19' y2='12' />
    </svg>
  ),
  qr: (
  <svg
    width='14'
    height='14'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.8'
    viewBox='0 0 24 24'
  >
    <rect x='3' y='3' width='6' height='6' rx='1' />
    <rect x='15' y='3' width='6' height='6' rx='1' />
    <rect x='3' y='15' width='6' height='6' rx='1' />
    <path d='M15 15h3v3' />
    <path d='M21 15v6h-6' />
  </svg>
)
}

const menus = {
  admin: [
    { name: 'Dashboard', to: '/admin', icon: Ico.grid },
    { name: 'Users', to: '/admin/users', icon: Ico.users },
    { name: 'Alat', to: '/admin/alat', icon: Ico.tool },
    { name: 'Kategori', to: '/admin/kategori', icon: Ico.tag }
  ],
 petugas: [
  { name: 'Dashboard', to: '/petugas', icon: Ico.grid },
  {
    name: 'Verifikasi Peminjaman',
    to: '/petugas/verifikasi',
    icon: Ico.check
  },
  {
    name: 'Scan QR',
    to: '/petugas/scan',
    icon: Ico.qr
  },
  { name: 'Pengembalian', to: '/petugas/pengembalian', icon: Ico.return },
  { name: 'Denda', to: '/petugas/denda', icon: Ico.alert }
],
  peminjam: [
    { name: 'Dashboard', to: '/peminjam', icon: Ico.grid },
    { name: 'Daftar Alat', to: '/peminjam/alat', icon: Ico.list },
    { name: 'Pinjam Alat', to: '/peminjam/pinjam', icon: Ico.plus },
    { name: 'Pengembalian', to: '/peminjam/kembali', icon: Ico.return }
  ]
}

export default function Sidebar () {
  const { user } = useAuth()
  const menu = menus[user?.role] ?? []

  return (
    <aside className='fixed inset-y-0 left-0 z-40 hidden w-[220px] flex-col border-r border-gray-200 bg-white md:flex'>
      {/* Logo */}
      <div className='flex items-center gap-2.5 border-b border-gray-100 px-4 py-4'>
        <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-900'>
          <svg
            width='14'
            height='14'
            fill='none'
            stroke='white'
            strokeWidth='2'
            strokeLinecap='round'
            viewBox='0 0 24 24'
          >
            <path d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' />
          </svg>
        </div>
        <div>
          <p className='text-[13px] font-bold tracking-tight text-gray-900'>
            SiPinjam
          </p>
          <p className='text-[11px] text-gray-400'>Peminjaman Alat</p>
        </div>
      </div>

      {/* Role badge */}
      <div className='px-4 pt-3 pb-1'>
        <span className='inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold capitalize text-gray-500'>
          <span className='h-1.5 w-1.5 rounded-full bg-blue-500' />
          {user?.role}
        </span>
      </div>

      {/* Nav */}
      <nav className='flex-1 overflow-y-auto px-3 py-2'>
        <p className='mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-300'>
          Menu
        </p>
        {menu.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-gray-100 text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-gray-700' : 'text-gray-300'}>
                  {item.icon}
                </span>
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className='border-t border-gray-100 px-4 py-3'>
        <p className='text-[11px] text-gray-300'>UKK 2025/2026</p>
      </div>
    </aside>
  )
}
