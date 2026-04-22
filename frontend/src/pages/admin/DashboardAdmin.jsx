// DashboardAdmin.jsx - Versi Modern Minimalis
import { useEffect, useState } from 'react'
import api from '../../lib/api'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'

export default function DashboardAdmin () {
  const [stats, setStats] = useState({
    users: null,
    alat: null,
    kategori: null,
    peminjamanAktif: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/users'),
      api.get('/alat'),
      api.get('/kategori'),
      api.get('/peminjaman?status=dipinjam')
    ])
      .then(([u, a, k, p]) => {
        const alatData = a.data.data
        const peminjamanData = p.data.data || []

        setStats({
          users: u.data.data.length,
          alat: alatData.length,
          kategori: k.data.data.length,
          peminjamanAktif: peminjamanData.length,
          kondisiChart: [
            {
              name: 'Normal',
              value: alatData.filter(x => x.kondisi === 'normal').length,
              color: '#10b981'
            },
            {
              name: 'Rusak',
              value: alatData.filter(x => x.kondisi === 'rusak').length,
              color: '#ef4444'
            }
          ],
          statusChart: [
            {
              name: 'Aktif',
              value: alatData.filter(x => x.status_aktif === 1).length,
              color: '#3b82f6'
            },
            {
              name: 'Nonaktif',
              value: alatData.filter(x => x.status_aktif !== 1).length,
              color: '#9ca3af'
            }
          ]
        })
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className='space-y-5'>
      {/* Header */}
      <div>
        <h1 className='text-base font-semibold tracking-tight text-gray-900'>
          Dashboard
        </h1>
        <p className='text-xs text-gray-400 mt-0.5'>
          Ringkasan sistem peminjaman alat
        </p>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
        <StatCard
          label='Total Pengguna'
          value={stats.users}
          sub='Akun terdaftar'
          loading={loading}
          icon='users'
        />
        <StatCard
          label='Total Alat'
          value={stats.alat}
          sub='Unit inventaris'
          loading={loading}
          icon='tool'
        />
        <StatCard
          label='Kategori'
          value={stats.kategori}
          sub='Jenis alat'
          loading={loading}
          icon='category'
        />
        <StatCard
          label='Peminjaman Aktif'
          value={stats.peminjamanAktif}
          sub='Sedang dipinjam'
          loading={loading}
          icon='active'
        />
      </div>

      {/* Charts Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {/* Kondisi Alat Chart */}
        <div className='bg-white rounded-lg border border-gray-100 p-4 shadow-sm'>
          <div className='flex items-center justify-between mb-3'>
            <div>
              <h3 className='text-xs font-semibold text-gray-900 uppercase tracking-wider'>
                Kondisi Alat
              </h3>
              <p className='text-[10px] text-gray-400 mt-0.5'>
                Distribusi berdasarkan kondisi
              </p>
            </div>
            <div className='flex gap-2'>
              {stats.kondisiChart?.map((item, idx) => (
                <div key={idx} className='flex items-center gap-1'>
                  <div
                    className='w-1.5 h-1.5 rounded-full'
                    style={{ backgroundColor: item.color }}
                  />
                  <span className='text-[9px] text-gray-500'>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
          {!loading && stats.kondisiChart ? (
            <ResponsiveContainer width='100%' height={220}>
              <PieChart>
                <Pie
                  data={stats.kondisiChart}
                  dataKey='value'
                  nameKey='name'
                  cx='50%'
                  cy='50%'
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {stats.kondisiChart.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke='none'
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '10px',
                    padding: '6px 10px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className='h-[220px] flex items-center justify-center'>
              <div className='animate-pulse text-gray-400 text-xs'>
                Memuat data...
              </div>
            </div>
          )}
        </div>

        {/* Status Alat Chart */}
        <div className='bg-white rounded-lg border border-gray-100 p-4 shadow-sm'>
          <div className='flex items-center justify-between mb-3'>
            <div>
              <h3 className='text-xs font-semibold text-gray-900 uppercase tracking-wider'>
                Status Alat
              </h3>
              <p className='text-[10px] text-gray-400 mt-0.5'>
                Aktif vs Nonaktif
              </p>
            </div>
            <div className='flex gap-2'>
              {stats.statusChart?.map((item, idx) => (
                <div key={idx} className='flex items-center gap-1'>
                  <div
                    className='w-1.5 h-1.5 rounded-full'
                    style={{ backgroundColor: item.color }}
                  />
                  <span className='text-[9px] text-gray-500'>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
          {!loading && stats.statusChart ? (
            <ResponsiveContainer width='100%' height={220}>
              <BarChart
                data={stats.statusChart}
                layout='vertical'
                margin={{ left: 35 }}
              >
                <CartesianGrid
                  strokeDasharray='3 3'
                  horizontal={false}
                  stroke='#f0f0f0'
                />
                <XAxis
                  type='number'
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type='category'
                  dataKey='name'
                  tick={{ fontSize: 10, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '10px',
                    padding: '6px 10px'
                  }}
                />
                <Bar dataKey='value' radius={[0, 4, 4, 0]}>
                  {stats.statusChart?.map((entry, idx) => (
                    <Cell key={`bar-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className='h-[220px] flex items-center justify-center'>
              <div className='animate-pulse text-gray-400 text-xs'>
                Memuat data...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <InfoCard
          title='Ringkasan Sistem'
          items={[
            `Total ${loading ? '...' : stats.users} pengguna terdaftar`,
            `${loading ? '...' : stats.alat} alat dalam ${
              loading ? '...' : stats.kategori
            } kategori`,
            `3 role: Admin, Petugas, Peminjam`,
            `${
              loading ? '...' : stats.peminjamanAktif || 'Tidak ada'
            } peminjaman aktif`
          ]}
        />
        <InfoCard
          title='Panduan Operasional'
          items={[
            'Update data alat sebelum peminjaman',
            'Verifikasi via QR Code',
            'Kelola denda secara berkala',
            'Pantau log aktivitas'
          ]}
          variant='tips'
        />
      </div>
    </div>
  )
}

// StatCard Component
function StatCard ({ label, value, sub, loading, icon }) {
  const icons = {
    users: (
      <svg
        width='16'
        height='16'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.5'
        viewBox='0 0 24 24'
      >
        <path d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' />
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
    category: (
      <svg
        width='16'
        height='16'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.5'
        viewBox='0 0 24 24'
      >
        <path d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 0 1 .586 1.414V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z' />
      </svg>
    ),
    active: (
      <svg
        width='16'
        height='16'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.5'
        viewBox='0 0 24 24'
      >
        <path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
      </svg>
    )
  }

  return (
    <div className='bg-white rounded-lg border border-gray-100 p-3 shadow-sm transition-all duration-200 hover:shadow-md'>
      <div className='flex items-start justify-between'>
        <div>
          <p className='text-[9px] font-medium text-gray-400 uppercase tracking-wider'>
            {label}
          </p>
          {loading ? (
            <div className='h-6 w-16 bg-gray-100 rounded animate-pulse mt-1' />
          ) : (
            <p className='text-xl font-bold text-gray-900 mt-0.5'>{value}</p>
          )}
          <p className='text-[9px] text-gray-400 mt-0.5'>{sub}</p>
        </div>
        <div className='p-1.5 rounded-lg bg-gray-50 text-gray-400'>
          {icons[icon] || icons.users}
        </div>
      </div>
    </div>
  )
}

// InfoCard Component
function InfoCard ({ title, items, variant = 'default' }) {
  return (
    <div className='bg-white rounded-lg border border-gray-100 p-4 shadow-sm'>
      <h3 className='text-xs font-semibold text-gray-900 uppercase tracking-wider mb-2'>
        {title}
      </h3>
      <div className='space-y-1.5'>
        {items.map((item, idx) => (
          <div key={idx} className='flex items-start gap-1.5'>
            <div
              className={`w-1 h-1 rounded-full mt-1.5 ${
                variant === 'tips' ? 'bg-blue-400' : 'bg-gray-300'
              }`}
            />
            <p className='text-[11px] text-gray-500 leading-relaxed'>{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
