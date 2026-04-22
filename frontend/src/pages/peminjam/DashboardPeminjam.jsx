// DashboardPeminjam.jsx - Versi Modern Minimalis
import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function DashboardPeminjam () {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState({
    alat: null,
    pinjam: null,
    aktif: null,
    menunggu: null
  })
  const [recentLoans, setRecentLoans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alatRes, pinjamRes] = await Promise.all([
          api.get('/alat/tersedia'),
          api.get('/peminjaman/saya')
        ])
        const peminjaman = pinjamRes.data.data

        setData({
          alat: alatRes.data.data.length,
          pinjam: peminjaman.length,
          aktif: peminjaman.filter(
            p =>
              p.status === 'disetujui' &&
              p.status_pengembalian !== 'dikembalikan'
          ).length,
          menunggu: peminjaman.filter(p => p.status === 'menunggu').length
        })

        // Recent loans (3 terbaru)
        const sortedLoans = [...peminjaman].sort(
          (a, b) => new Date(b.tgl_pinjam) - new Date(a.tgl_pinjam)
        )
        setRecentLoans(sortedLoans.slice(0, 3))
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatDate = date => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusBadge = status => {
    switch (status) {
      case 'menunggu':
        return 'bg-amber-50 text-amber-600 border-amber-100'
      case 'disetujui':
        return 'bg-green-50 text-green-600 border-green-100'
      case 'ditolak':
        return 'bg-red-50 text-red-600 border-red-100'
      default:
        return 'bg-gray-50 text-gray-500 border-gray-100'
    }
  }

  const getStatusText = status => {
    switch (status) {
      case 'menunggu':
        return 'Menunggu'
      case 'disetujui':
        return 'Disetujui'
      case 'ditolak':
        return 'Ditolak'
      default:
        return status
    }
  }

  return (
    <div className='space-y-5'>
      {/* Header */}
      <div>
        <h1 className='text-lg font-semibold tracking-tight text-gray-900'>
          Dashboard Peminjam
        </h1>
        <p className='text-sm text-gray-400 mt-0.5'>
          Selamat datang,{' '}
          <span className='font-medium text-gray-600'>{user?.name}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatCard
          loading={loading}
          label='Alat Tersedia'
          value={data.alat}
          sub='Alat siap dipinjam'
          icon='tool'
          color='blue'
        />
        <StatCard
          loading={loading}
          label='Total Peminjaman'
          value={data.pinjam}
          sub='Seluruh riwayat'
          icon='history'
          color='gray'
        />
        <StatCard
          loading={loading}
          label='Peminjaman Aktif'
          value={data.aktif}
          sub='Sedang berlangsung'
          icon='active'
          color='green'
          urgent={data.aktif > 0}
        />
        <StatCard
          loading={loading}
          label='Menunggu Persetujuan'
          value={data.menunggu}
          sub='Perlu diproses petugas'
          icon='pending'
          color='amber'
          urgent={data.menunggu > 0}
        />
      </div>

      {/* Quick Actions */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <QuickActionCard
          title='Pinjam Alat'
          description='Lihat dan pilih alat yang tersedia untuk dipinjam'
          icon='borrow'
          link='/peminjam/alat'
          color='blue'
        />
        <QuickActionCard
          title='Pengembalian'
          description='Ajukan pengembalian alat yang sedang dipinjam'
          icon='return'
          link='/peminjam/kembali'
          color='green'
        />
      </div>

      {/* Peminjaman Terbaru */}
      <div className='bg-white rounded-lg border border-gray-100 p-4 shadow-sm'>
        <div className='flex items-center gap-2 mb-3'>
          <div className='p-1.5 rounded-lg bg-purple-50 text-purple-500'>
            <svg
              width='16'
              height='16'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
              viewBox='0 0 24 24'
            >
              <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' />
              <polyline points='3.29 7 12 12 20.71 7' />
            </svg>
          </div>
          <h3 className='text-sm font-semibold text-gray-900'>
            Peminjaman Terbaru
          </h3>
        </div>

        {loading ? (
          <div className='space-y-2'>
            {[1, 2, 3].map(i => (
              <div key={i} className='h-14 bg-gray-100 rounded animate-pulse' />
            ))}
          </div>
        ) : recentLoans.length === 0 ? (
          <div className='text-center py-6'>
            <p className='text-sm text-gray-400'>Belum ada peminjaman</p>
            <button
              onClick={() => navigate('/peminjam/alat')}
              className='mt-2 text-sm text-blue-500 hover:text-blue-600'
            >
              Mulai pinjam alat sekarang
            </button>
          </div>
        ) : (
          <div className='space-y-2'>
            {recentLoans.map(loan => (
              <div
                key={loan.id_peminjaman}
                className='flex items-center justify-between py-2 border-b border-gray-50 last:border-0'
              >
                <div>
                  <p className='text-sm font-medium text-gray-900'>
                    {loan.alat}
                  </p>
                  <p className='text-xs text-gray-400'>
                    Pinjam: {formatDate(loan.tgl_pinjam)}
                  </p>
                </div>
                <div className='text-right'>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadge(
                      loan.status
                    )}`}
                  >
                    {getStatusText(loan.status)}
                  </span>
                  {loan.status === 'disetujui' && loan.tgl_jatuh_tempo && (
                    <p className='text-[10px] text-gray-400 mt-1'>
                      Jatuh tempo: {formatDate(loan.tgl_jatuh_tempo)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {recentLoans.length > 0 && (
          <button
            onClick={() => navigate('/peminjam/kembali')}
            className='mt-3 w-full text-center text-xs text-blue-500 hover:text-blue-600 pt-2 border-t border-gray-50'
          >
            Lihat semua peminjaman →
          </button>
        )}
      </div>

      {/* Info Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <InfoCard
          title='Informasi Penting'
          icon='info'
          items={[
            'Pastikan alat dikembalikan tepat waktu',
            'Denda keterlambatan: Rp 10.000/hari',
            'Kerusakan alat akan dikenakan denda sesuai ketentuan',
            'Gunakan QR Code untuk proses pengembalian cepat'
          ]}
        />
        <InfoCard
          title='Panduan Peminjaman'
          icon='guide'
          items={[
            'Pilih alat yang tersedia di halaman Daftar Alat',
            'Ajukan peminjaman dengan mengisi form',
            'Tunggu verifikasi dari petugas',
            'Ambil alat setelah status "Disetujui"'
          ]}
          variant='tips'
        />
      </div>
    </div>
  )
}

// StatCard Component
function StatCard ({ label, value, sub, icon, loading, urgent, color }) {
  const icons = {
    tool: (
      <svg
        width='18'
        height='18'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.5'
        viewBox='0 0 24 24'
      >
        <path d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' />
      </svg>
    ),
    history: (
      <svg
        width='18'
        height='18'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.5'
        viewBox='0 0 24 24'
      >
        <circle cx='12' cy='12' r='10' />
        <polyline points='12 6 12 12 16 14' />
      </svg>
    ),
    active: (
      <svg
        width='18'
        height='18'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.5'
        viewBox='0 0 24 24'
      >
        <path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
      </svg>
    ),
    pending: (
      <svg
        width='18'
        height='18'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.5'
        viewBox='0 0 24 24'
      >
        <rect x='3' y='4' width='18' height='18' rx='2' />
        <line x1='3' y1='10' x2='21' y2='10' />
      </svg>
    )
  }

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-500',
    gray: 'bg-gray-50 text-gray-400',
    green: 'bg-green-50 text-green-500',
    amber: 'bg-amber-50 text-amber-500'
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg border bg-white p-4 transition-all duration-200 hover:shadow-md ${
        urgent ? 'border-amber-200' : 'border-gray-100'
      }`}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] ${
          urgent ? 'bg-amber-400' : 'bg-gray-200'
        }`}
      />
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <p className='text-[11px] font-medium text-gray-400 uppercase tracking-wider'>
            {label}
          </p>
          {loading ? (
            <div className='h-7 w-16 bg-gray-100 rounded animate-pulse mt-1' />
          ) : (
            <p
              className={`text-2xl font-bold ${
                urgent ? 'text-amber-500' : 'text-gray-900'
              } mt-0.5`}
            >
              {value}
            </p>
          )}
          <p className='text-xs text-gray-400 mt-1'>{sub}</p>
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icons[icon]}
        </div>
      </div>
    </div>
  )
}

// QuickActionCard Component
function QuickActionCard ({ title, description, icon, link, color }) {
  const colors = {
    blue: 'border-blue-100 bg-blue-50/30 hover:bg-blue-50',
    green: 'border-green-100 bg-green-50/30 hover:bg-green-50'
  }

  const icons = {
    borrow: (
      <svg
        width='20'
        height='20'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.5'
        viewBox='0 0 24 24'
      >
        <path d='M12 5v14M5 12h14' />
      </svg>
    ),
    return: (
      <svg
        width='20'
        height='20'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.5'
        viewBox='0 0 24 24'
      >
        <polyline points='1,4 1,10 7,10' />
        <path d='M3.51 15a9 9 0 1 0 .49-3.99' />
      </svg>
    )
  }

  return (
    <button
      onClick={() => (window.location.href = link)}
      className={`w-full text-left rounded-lg border ${colors[color]} p-4 transition-all duration-200 hover:shadow-sm group`}
    >
      <div className='flex items-start gap-3'>
        <div
          className={`p-1.5 rounded-lg ${
            color === 'blue'
              ? 'bg-blue-100 text-blue-600'
              : 'bg-green-100 text-green-600'
          }`}
        >
          {icons[icon]}
        </div>
        <div>
          <h3 className='text-sm font-semibold text-gray-900'>{title}</h3>
          <p className='text-xs text-gray-500 mt-0.5'>{description}</p>
        </div>
      </div>
    </button>
  )
}

// InfoCard Component
function InfoCard ({ title, icon, items, variant = 'default' }) {
  const icons = {
    info: (
      <svg
        width='14'
        height='14'
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
    guide: (
      <svg
        width='14'
        height='14'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.5'
        viewBox='0 0 24 24'
      >
        <polyline points='9,11 12,14 22,4' />
        <path d='M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' />
      </svg>
    )
  }

  return (
    <div className='bg-white rounded-lg border border-gray-100 p-4 shadow-sm'>
      <div className='flex items-center gap-2 mb-2'>
        <div
          className={`p-1 rounded-lg ${
            variant === 'tips'
              ? 'bg-blue-50 text-blue-500'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {icons[icon]}
        </div>
        <h3 className='text-sm font-semibold text-gray-900'>{title}</h3>
      </div>
      <div className='space-y-1.5 ml-6'>
        {items.map((item, idx) => (
          <div key={idx} className='flex items-start gap-1.5'>
            <div
              className={`w-1 h-1 rounded-full mt-1.5 ${
                variant === 'tips' ? 'bg-blue-400' : 'bg-gray-300'
              }`}
            />
            <p className='text-xs text-gray-500 leading-relaxed'>{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
