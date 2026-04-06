import { useEffect, useState } from 'react'
import api from '../../lib/api'

export default function DashboardPetugas () {
  const [summary, setSummary] = useState({
    peminjaman: null,
    pengembalian: null,
    menungguVerifikasi: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [peminjamanRes, pengembalianRes] = await Promise.all([
        api.get('/peminjaman'),
        api.get('/pengembalian')
      ])
      const peminjaman = peminjamanRes.data.data
      const pengembalian = pengembalianRes.data.data
      setSummary({
        peminjaman: peminjaman.length,
        pengembalian: pengembalian.length,
        menungguVerifikasi: peminjaman.filter(p => p.status === 'menunggu')
          .length
      })
      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <div>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-[20px] font-bold tracking-tight text-gray-900'>
          Dashboard
        </h1>
        <p className='mt-0.5 text-sm text-gray-400'>
          Ringkasan aktivitas dan tugas operasional
        </p>
      </div>

      {/* Stats */}
      <div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <StatCard
          loading={loading}
          label='Total Peminjaman'
          value={summary.peminjaman}
          sub='seluruh data peminjaman'
          icon={
            <svg
              width='15'
              height='15'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <path d='M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2' />
              <rect x='9' y='3' width='6' height='4' rx='1' />
              <line x1='9' y1='12' x2='15' y2='12' />
              <line x1='9' y1='16' x2='13' y2='16' />
            </svg>
          }
        />
        <StatCard
          loading={loading}
          label='Total Pengembalian'
          value={summary.pengembalian}
          sub='pengembalian tercatat'
          icon={
            <svg
              width='15'
              height='15'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <polyline points='1,4 1,10 7,10' />
              <path d='M3.51 15a9 9 0 1 0 .49-3.99' />
            </svg>
          }
        />
        <StatCard
          loading={loading}
          label='Menunggu Verifikasi'
          value={summary.menungguVerifikasi}
          sub='perlu segera diproses'
          urgent={summary.menungguVerifikasi > 0}
          icon={
            <svg
              width='15'
              height='15'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <circle cx='12' cy='12' r='10' />
              <polyline points='12,6 12,12 16,14' />
            </svg>
          }
        />
      </div>

      {/* Info cards */}
      <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
        <InfoCard
          title='Tugas Hari Ini'
          icon={
            <svg
              width='14'
              height='14'
              fill='none'
              stroke='#3451b2'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <polyline points='9,11 12,14 22,4' />
              <path d='M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' />
            </svg>
          }
          items={[
            'Periksa peminjaman yang menunggu persetujuan',
            'Verifikasi pengembalian alat yang masuk',
            'Pastikan kondisi alat sesuai laporan peminjam',
            'Koordinasikan denda jika terjadi keterlambatan'
          ]}
        />
        <InfoCard
          title='Catatan Operasional'
          icon={
            <svg
              width='14'
              height='14'
              fill='none'
              stroke='#3451b2'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <circle cx='12' cy='12' r='10' />
              <line x1='12' y1='8' x2='12' y2='12' />
              <line x1='12' y1='16' x2='12.01' y2='16' />
            </svg>
          }
          items={[
            'Proses verifikasi dilakukan sesuai urutan pengajuan',
            'Pastikan data pengembalian tercatat dengan benar',
            'Laporkan kerusakan alat ke admin segera',
            'Sistem dirancang untuk mendukung alur kerja cepat'
          ]}
        />
      </div>
    </div>
  )
}

function StatCard ({ label, value, sub, icon, loading, urgent }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-white p-5 transition hover:shadow-sm ${
        urgent ? 'border-amber-200' : 'border-gray-200'
      }`}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-[3px] ${
          urgent ? 'bg-amber-400' : 'bg-gray-100'
        }`}
      />
      <div
        className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${
          urgent ? 'bg-amber-50 text-amber-500' : 'bg-gray-100 text-gray-400'
        }`}
      >
        {icon}
      </div>
      <p className='mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400'>
        {label}
      </p>
      {loading ? (
        <div className='mb-1 h-8 w-12 animate-pulse rounded bg-gray-100' />
      ) : (
        <p
          className={`text-[32px] font-bold leading-none tracking-tight ${
            urgent ? 'text-amber-500' : 'text-gray-900'
          }`}
        >
          {value}
        </p>
      )}
      <p className='mt-1 text-[12px] text-gray-400'>{sub}</p>
    </div>
  )
}

function InfoCard ({ title, icon, items }) {
  return (
    <div className='rounded-xl border border-gray-200 bg-white p-5'>
      <div className='mb-4 flex items-center gap-2'>
        <div className='flex h-6 w-6 items-center justify-center rounded-md bg-blue-50'>
          {icon}
        </div>
        <h2 className='text-[13px] font-semibold text-gray-800'>{title}</h2>
      </div>
      <div className='space-y-0'>
        {items.map((item, i) => (
          <div
            key={i}
            className='flex items-start gap-2.5 border-t border-gray-50 py-2.5 first:border-0 first:pt-0'
          >
            <span className='mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-gray-200' />
            <p className='text-[13px] text-gray-500 leading-relaxed'>{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
