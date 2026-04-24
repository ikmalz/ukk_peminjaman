import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { Link } from 'react-router-dom'

export default function DashboardPetugas() {
  const [summary, setSummary] = useState({
    peminjaman: null,
    pengembalian: null,
    menungguVerifikasi: null,
    menungguPengembalian: null
  })
  const [recentLoans, setRecentLoans] = useState([])
  const [topBorrowers, setTopBorrowers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [peminjamanRes, pengembalianRes] = await Promise.all([
          api.get('/peminjaman'),
          api.get('/pengembalian')
        ])
        const peminjaman = peminjamanRes.data.data
        const pengembalian = pengembalianRes.data.data
        
        setSummary({
          peminjaman: peminjaman.length,
          pengembalian: pengembalian.length,
          menungguVerifikasi: peminjaman.filter(p => p.status === 'menunggu').length,
          menungguPengembalian: pengembalian.filter(p => p.status_verifikasi === 'menunggu').length
        })

        const sortedLoans = [...peminjaman].sort((a, b) => new Date(b.tgl_pinjam) - new Date(a.tgl_pinjam))
        setRecentLoans(sortedLoans.slice(0, 3))

        const borrowerCount = peminjaman.reduce((acc, curr) => {
          acc[curr.peminjam] = (acc[curr.peminjam] || 0) + 1
          return acc
        }, {})
        const sortedBorrowers = Object.entries(borrowerCount)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)
        setTopBorrowers(sortedBorrowers)

      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatDateOnly = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className='space-y-5'>
      {/* Header */}
      <div>
        <h1 className='text-lg font-semibold tracking-tight text-gray-900'>
          Dashboard Petugas
        </h1>
        <p className='text-sm text-gray-400 mt-0.5'>
          Ringkasan aktivitas dan tugas operasional
        </p>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatCard
          loading={loading}
          label='Total Peminjaman'
          value={summary.peminjaman}
          sub='Seluruh data peminjaman'
          icon='loan'
        />
        <StatCard
          loading={loading}
          label='Total Pengembalian'
          value={summary.pengembalian}
          sub='Pengembalian tercatat'
          icon='return'
        />
        <StatCard
          loading={loading}
          label='Menunggu Verifikasi'
          value={summary.menungguVerifikasi}
          sub='Perlu segera diproses'
          icon='pending'
          urgent={summary.menungguVerifikasi > 0}
          link="/petugas/verifikasi"
        />
        <StatCard
          loading={loading}
          label='Menunggu Pengembalian'
          value={summary.menungguPengembalian}
          sub='Perlu verifikasi alat'
          icon='waiting'
          urgent={summary.menungguPengembalian > 0}
          link="/petugas/pengembalian"
        />
      </div>

      {/* Quick Actions */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <QuickActionCard
          title='Verifikasi Peminjaman'
          description='Setujui atau tolak permintaan peminjaman alat'
          icon='verify'
          link='/petugas/verifikasi'
          count={summary.menungguVerifikasi}
          loading={loading}
          color='blue'
        />
        <QuickActionCard
          title='Verifikasi Pengembalian'
          description='Periksa kondisi alat yang dikembalikan'
          icon='returnVerify'
          link='/petugas/pengembalian'
          count={summary.menungguPengembalian}
          loading={loading}
          color='green'
        />
      </div>

      {/* Additional Info Grid - 2 kolom */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <div className='bg-white rounded-lg border border-gray-100 p-4 shadow-sm'>
          <div className='flex items-center gap-2 mb-3'>
            <div className='p-1.5 rounded-lg bg-purple-50 text-purple-500'>
              <svg width='16' height='16' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
                <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' />
                <polyline points='3.29 7 12 12 20.71 7' />
              </svg>
            </div>
            <h3 className='text-sm font-semibold text-gray-900'>Peminjaman Terbaru</h3>
          </div>
          {loading ? (
            <div className='space-y-2'>
              {[1, 2, 3].map(i => <div key={i} className='h-12 bg-gray-100 rounded animate-pulse' />)}
            </div>
          ) : recentLoans.length === 0 ? (
            <p className='text-sm text-gray-400 text-center py-4'>Belum ada peminjaman</p>
          ) : (
            <div className='space-y-2'>
              {recentLoans.map(loan => (
                <div key={loan.id_peminjaman} className='flex items-center justify-between py-2 border-b border-gray-50 last:border-0'>
                  <div>
                    <p className='text-sm font-medium text-gray-900'>{loan.peminjam}</p>
                    <p className='text-xs text-gray-400'>{loan.alat}</p>
                  </div>
                  <div className='text-right'>
                    <p className='text-xs text-gray-400'>{formatDateOnly(loan.tgl_pinjam)}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${loan.status === 'menunggu' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                      {loan.status === 'menunggu' ? 'Menunggu' : 'Disetujui'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Peminjam */}
        <div className='bg-white rounded-lg border border-gray-100 p-4 shadow-sm'>
          <div className='flex items-center gap-2 mb-3'>
            <div className='p-1.5 rounded-lg bg-orange-50 text-orange-500'>
              <svg width='16' height='16' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
                <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
                <circle cx='9' cy='7' r='4' />
                <path d='M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' />
              </svg>
            </div>
            <h3 className='text-sm font-semibold text-gray-900'>Top Peminjam</h3>
          </div>
          {loading ? (
            <div className='space-y-2'>
              {[1, 2, 3].map(i => <div key={i} className='h-12 bg-gray-100 rounded animate-pulse' />)}
            </div>
          ) : topBorrowers.length === 0 ? (
            <p className='text-sm text-gray-400 text-center py-4'>Belum ada data peminjam</p>
          ) : (
            <div className='space-y-2'>
              {topBorrowers.map((borrower, idx) => (
                <div key={borrower.name} className='flex items-center justify-between py-2 border-b border-gray-50 last:border-0'>
                  <div className='flex items-center gap-3'>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                      {idx + 1}
                    </div>
                    <p className='text-sm font-medium text-gray-900'>{borrower.name}</p>
                  </div>
                  <div className='flex items-center gap-1'>
                    <span className='text-sm font-semibold text-blue-600'>{borrower.count}</span>
                    <span className='text-xs text-gray-400'>kali</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <InfoCard
          title='Tugas Hari Ini'
          items={[
            'Periksa peminjaman yang menunggu persetujuan',
            'Verifikasi pengembalian alat yang masuk',
            'Pastikan kondisi alat sesuai laporan peminjam',
            'Koordinasikan denda jika terjadi keterlambatan'
          ]}
        />
        <InfoCard
          title='Panduan Operasional'
          items={[
            'Proses verifikasi sesuai urutan pengajuan',
            'Gunakan QR Code untuk verifikasi cepat',
            'Laporkan kerusakan alat ke admin',
            'Denda dihitung otomatis oleh sistem'
          ]}
          variant='tips'
        />
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, icon, loading, urgent, link }) {
  const icons = {
    loan: (
      <svg width='18' height='18' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
        <path d='M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2' />
        <rect x='9' y='3' width='6' height='4' rx='1' />
        <line x1='9' y1='12' x2='15' y2='12' />
        <line x1='9' y1='16' x2='13' y2='16' />
      </svg>
    ),
    return: (
      <svg width='18' height='18' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
        <polyline points='1,4 1,10 7,10' />
        <path d='M3.51 15a9 9 0 1 0 .49-3.99' />
      </svg>
    ),
    pending: (
      <svg width='18' height='18' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
        <circle cx='12' cy='12' r='10' />
        <polyline points='12,6 12,12 16,14' />
      </svg>
    ),
    waiting: (
      <svg width='18' height='18' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
        <rect x='3' y='4' width='18' height='18' rx='2' />
        <line x1='3' y1='10' x2='21' y2='10' />
      </svg>
    )
  }

  const cardContent = (
    <div className={`relative overflow-hidden rounded-lg border bg-white p-4 transition-all duration-200 hover:shadow-md ${urgent ? 'border-amber-200' : 'border-gray-100'}`}>
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${urgent ? 'bg-amber-400' : 'bg-gray-200'}`} />
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <p className='text-[11px] font-medium text-gray-400 uppercase tracking-wider'>
            {label}
          </p>
          {loading ? (
            <div className='h-7 w-16 bg-gray-100 rounded animate-pulse mt-1' />
          ) : (
            <p className={`text-2xl font-bold ${urgent ? 'text-amber-500' : 'text-gray-900'} mt-0.5`}>
              {value}
            </p>
          )}
          <p className='text-xs text-gray-400 mt-1'>{sub}</p>
        </div>
        <div className={`p-2 rounded-lg ${urgent ? 'bg-amber-50 text-amber-500' : 'bg-gray-50 text-gray-400'}`}>
          {icons[icon]}
        </div>
      </div>
    </div>
  )

  if (link && !loading && value > 0) {
    return <Link to={link}>{cardContent}</Link>
  }
  return cardContent
}

function QuickActionCard({ title, description, icon, link, count, loading, color }) {
  const colors = {
    blue: 'border-blue-100 bg-blue-50/30 hover:bg-blue-50',
    green: 'border-green-100 bg-green-50/30 hover:bg-green-50'
  }

  const icons = {
    verify: (
      <svg width='20' height='20' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
        <polyline points='9,11 12,14 22,4' />
        <path d='M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' />
      </svg>
    ),
    returnVerify: (
      <svg width='20' height='20' fill='none' stroke='currentColor' strokeWidth='1.5' viewBox='0 0 24 24'>
        <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' />
        <polyline points='3.29 7 12 12 20.71 7' />
      </svg>
    )
  }

  return (
    <Link to={link} className={`block rounded-lg border ${colors[color]} p-4 transition-all duration-200 hover:shadow-sm group`}>
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-1'>
            <div className={`p-1.5 rounded-lg ${color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
              {icons[icon]}
            </div>
            <h3 className='text-sm font-semibold text-gray-900'>{title}</h3>
          </div>
          <p className='text-xs text-gray-500 ml-9'>{description}</p>
        </div>
        {!loading && count > 0 && (
          <div className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white ${color === 'blue' ? 'bg-blue-500' : 'bg-green-500'}`}>
            {count}
          </div>
        )}
      </div>
    </Link>
  )
}

function InfoCard({ title, items, variant = 'default' }) {
  return (
    <div className='bg-white rounded-lg border border-gray-100 p-4 shadow-sm'>
      <h3 className='text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2'>
        {title}
      </h3>
      <div className='space-y-2'>
        {items.map((item, idx) => (
          <div key={idx} className='flex items-start gap-2'>
            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${variant === 'tips' ? 'bg-blue-400' : 'bg-gray-300'}`} />
            <p className='text-sm text-gray-500 leading-relaxed'>{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}