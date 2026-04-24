import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

const Ico = {
  grid: (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
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
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
      viewBox='0 0 24 24'
    >
      <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
      <circle cx='9' cy='7' r='4' />
      <path d='M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' />
    </svg>
  ),
  tool: (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
      viewBox='0 0 24 24'
    >
      <path d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' />
    </svg>
  ),
  tag: (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
      viewBox='0 0 24 24'
    >
      <path d='M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z' />
      <circle cx='7' cy='7' r='1.5' />
    </svg>
  ),
  check: (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
      viewBox='0 0 24 24'
    >
      <polyline points='9,11 12,14 22,4' />
      <path d='M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' />
    </svg>
  ),
  return: (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
      viewBox='0 0 24 24'
    >
      <polyline points='1,4 1,10 7,10' />
      <path d='M3.51 15a9 9 0 1 0 .49-3.99' />
    </svg>
  ),
  alert: (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
      viewBox='0 0 24 24'
    >
      <circle cx='12' cy='12' r='10' />
      <line x1='12' y1='8' x2='12' y2='12' />
      <line x1='12' y1='16' x2='12.01' y2='16' />
    </svg>
  ),
  list: (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
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
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
      viewBox='0 0 24 24'
    >
      <line x1='12' y1='5' x2='12' y2='19' />
      <line x1='5' y1='12' x2='19' y2='12' />
    </svg>
  ),
  qr: (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
      viewBox='0 0 24 24'
    >
      <rect x='3' y='3' width='6' height='6' rx='1' />
      <rect x='15' y='3' width='6' height='6' rx='1' />
      <rect x='3' y='15' width='6' height='6' rx='1' />
      <path d='M15 15h3v3' />
      <path d='M21 15v6h-6' />
    </svg>
  ),
  settings: (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
      viewBox='0 0 24 24'
    >
      <circle cx='12' cy='12' r='3' />
      <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z' />
    </svg>
  ),
  logout: (
    <svg
      width='16'
      height='16'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
      viewBox='0 0 24 24'
    >
      <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
      <polyline points='16,17 21,12 16,7' />
      <line x1='21' y1='12' x2='9' y2='12' />
    </svg>
  )
}

const menus = {
  admin: [
    { name: 'Dashboard', to: '/admin', icon: Ico.grid, category: 'main' },
    {
      name: 'Users',
      to: '/admin/users',
      icon: Ico.users,
      category: 'management'
    },
    {
      name: 'Kategori',
      to: '/admin/kategori',
      icon: Ico.tag,
      category: 'management'
    },
    { name: 'Alat', to: '/admin/alat', icon: Ico.tool, category: 'management' },
    {
      name: 'Verifikasi Peminjaman',
      to: '/admin/verifikasi',
      icon: Ico.check,
      category: 'transactions'
    },
    {
      name: 'Verifikasi Pengembalian',
      to: '/admin/pengembalian',
      icon: Ico.return,
      category: 'transactions'
    },
    {
      name: 'Denda',
      to: '/admin/denda',
      icon: Ico.alert,
      category: 'transactions'
    },
    {
      name: 'Log Aktivitas',
      to: '/admin/log',
      icon: Ico.list,
      category: 'monitoring'
    },
    {
      name: 'Konfigurasi Denda',
      to: '/admin/konfigurasi-denda',
      icon: Ico.settings,
      category: 'settings'
    },
    {
      name: 'kasir denda',
      to: '/admin/kasir-denda',
      icon: Ico.settings,
      category: 'settings'
    },
    { name: 'Scan QR', to: '/admin/scan', icon: Ico.qr, category: 'tools' }
  ],
  petugas: [
    { name: 'Dashboard', to: '/petugas', icon: Ico.grid, category: 'main' },
    {
      name: 'Verifikasi Peminjaman',
      to: '/petugas/verifikasi',
      icon: Ico.check,
      category: 'transactions'
    },
    {
      name: 'Verifikasi Pengembalian',
      to: '/petugas/pengembalian',
      icon: Ico.return,
      category: 'transactions'
    },
    {
      name: 'Denda',
      to: '/petugas/denda',
      icon: Ico.alert,
      category: 'transactions'
    },
    { name: 'Scan QR', to: '/petugas/scan', icon: Ico.qr, category: 'tools' },
    {
      name: 'Konfigurasi Denda',
      to: '/petugas/konfigurasi-denda',
      icon: Ico.settings,
      category: 'settings'
    },
    {
      name: 'Kategori',
      to: '/petugas/kategori',
      icon: Ico.tag,
      category: 'management'
    },
    {
      name: 'Alat',
      to: '/petugas/alat',
      icon: Ico.tool,
      category: 'management'
    }
  ],
  peminjam: [
    { name: 'Dashboard', to: '/peminjam', icon: Ico.grid, category: 'main' },
    {
      name: 'Daftar Alat',
      to: '/peminjam/alat',
      icon: Ico.list,
      category: 'browse'
    },
    {
      name: 'Pinjam Alat',
      to: '/peminjam/pinjam',
      icon: Ico.plus,
      category: 'browse'
    },
    {
      name: 'Pengembalian Saya',
      to: '/peminjam/kembali',
      icon: Ico.return,
      category: 'history'
    },
    {
      name: 'Riwayat Peminjaman',
      to: '/peminjam/history',
      icon: Ico.list,
      category: 'history'
    },
    {
      name: 'Tagihan Denda',
      to: '/peminjam/tagihan-denda',
      icon: Ico.list,
      category: 'history'
    },
    // {
    //   name: 'Struk Denda',
    //   to: '/peminjam/struk-denda/:id',
    //   icon: Ico.list,
    //   category: 'history'
    // }
  ]
}

const categoryLabels = {
  main: 'UTAMA',
  management: 'KELOLA',
  transactions: 'TRANSAKSI',
  monitoring: 'MONITORING',
  settings: 'SETTING',
  tools: 'ALAT',
  browse: 'BROWSE',
  history: 'RIWAYAT'
}

export default function Sidebar ({ open, onClose }) {
  const { user, logout } = useAuth()
  const menu = menus[user?.role] ?? []
  const [isCollapsed, setIsCollapsed] = useState(false)

  const groupedMenu = menu.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d4d4d4; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a3a3a3; }
        @keyframes fadeInSidebar { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tooltipFade { from { opacity: 0; transform: translateX(-5px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fadeIn { animation: fadeInSidebar 0.2s ease-out; }
        .tooltip-animate { animation: tooltipFade 0.15s ease-out; }
      `}</style>

      {open && (
        <div
          onClick={onClose}
          className='fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden animate-fadeIn'
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col bg-white
          transform transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-[52px]' : 'w-[200px]'}
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:flex
          shadow-sm border-r border-gray-100
        `}
      >
        {/* Logo Section */}
        <div
          className={`flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          } px-3 py-3 border-b border-gray-100`}
        >
          {!isCollapsed ? (
            <>
              <div className='flex items-center gap-2'>
                <div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gray-900'>
                  <svg
                    width='10'
                    height='10'
                    fill='none'
                    stroke='white'
                    strokeWidth='2'
                    viewBox='0 0 24 24'
                  >
                    <path d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' />
                  </svg>
                </div>
                <div>
                  <p className='text-[11px] font-bold tracking-tight text-gray-900'>
                    SiPinjam
                  </p>
                  <p className='text-[8px] text-gray-400'>Peminjaman Alat</p>
                </div>
              </div>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className='p-1 rounded text-gray-400 hover:bg-gray-100 transition-colors'
              >
                <svg
                  width='10'
                  height='10'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  viewBox='0 0 24 24'
                >
                  <polyline points='15,18 9,12 15,6' />
                </svg>
              </button>
            </>
          ) : (
            <>
              <div className='flex h-6 w-6 items-center justify-center rounded-lg bg-gray-900'>
                <svg
                  width='9'
                  height='9'
                  fill='none'
                  stroke='white'
                  strokeWidth='2'
                  viewBox='0 0 24 24'
                >
                  <path d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' />
                </svg>
              </div>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className='p-1 rounded text-gray-400 hover:bg-gray-100 transition-colors'
              >
                <svg
                  width='10'
                  height='10'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  viewBox='0 0 24 24'
                >
                  <polyline points='9,18 15,12 9,6' />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* User Profile Section */}
        <div
          className={`${
            isCollapsed ? 'px-2 py-3' : 'px-3 py-3'
          } border-b border-gray-100`}
        >
          <div
            className={`flex ${
              isCollapsed ? 'justify-center' : 'items-center gap-2'
            }`}
          >
            <div className='relative'>
              <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 font-semibold text-[10px]'>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className='absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 ring-1 ring-white' />
            </div>
            {!isCollapsed && (
              <div className='flex-1 min-w-0'>
                <p className='text-[11px] font-semibold text-gray-900 truncate'>
                  {user?.name || 'User'}
                </p>
                <p className='text-[9px] text-gray-500 capitalize'>
                  {user?.role || 'Role'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Section */}
        <nav className='flex-1 overflow-y-auto py-3 px-1.5 custom-scrollbar'>
          {Object.entries(groupedMenu).map(([category, items]) => (
            <div key={category} className='mb-3'>
              {!isCollapsed && (
                <p className='px-2 mb-1.5 text-[8px] font-semibold uppercase tracking-wider text-gray-400'>
                  {categoryLabels[category] || category.toUpperCase()}
                </p>
              )}
              {items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  onClick={onClose}
                  className={({ isActive }) => `
                    group relative flex items-center gap-2 mb-0.5 px-2 py-1.5 rounded-md
                    text-[12px] font-medium transition-all duration-200
                    ${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`transition-colors ${
                          isActive
                            ? 'text-gray-900'
                            : 'text-gray-400 group-hover:text-gray-600'
                        }`}
                      >
                        {item.icon}
                      </span>
                      {!isCollapsed && <span>{item.name}</span>}
                      {isCollapsed && (
                        <div className='absolute left-full ml-1.5 px-1.5 py-0.5 bg-gray-800 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-lg tooltip-animate'>
                          {item.name}
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer Section */}
        <div className='border-t border-gray-100 p-3'>
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-2 px-2 py-1.5 rounded-md
              text-[11px] font-medium text-gray-500 hover:text-red-600 hover:bg-red-50
              transition-all duration-200 group
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <span className='text-gray-400 group-hover:text-red-500 transition-colors'>
              {Ico.logout}
            </span>
            {!isCollapsed && <span>Keluar</span>}
            {isCollapsed && (
              <div className='absolute left-full ml-1.5 px-1.5 py-0.5 bg-gray-800 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-lg tooltip-animate'>
                Keluar
              </div>
            )}
          </button>
          {!isCollapsed && (
            <p className='text-[8px] text-center text-gray-400 mt-3'>
              © 2025 SiPinjam
            </p>
          )}
        </div>
      </aside>
    </>
  )
}
