import { useEffect, useState } from 'react'
import api from '../../lib/api'

export default function DashboardPetugas () {
  const [summary, setSummary] = useState({
    peminjaman: 0,
    pengembalian: 0,
    menungguVerifikasi: 0
  })

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
    }

    fetchData()
  }, [])

  return (
    <div className='space-y-6'>
      {/* HEADER */}
      <div>
        <h1 className='text-xl md:text-2xl font-semibold text-slate-800'>
          Dashboard Petugas
        </h1>
        <p className='text-sm text-slate-500'>
          Ringkasan aktivitas dan tugas operasional
        </p>
      </div>

      {/* STAT CARDS */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        <StatCard
          title='Total Peminjaman'
          value={summary.peminjaman}
          desc='Seluruh data peminjaman'
        />
        <StatCard
          title='Total Pengembalian'
          value={summary.pengembalian}
          desc='Pengembalian yang tercatat'
        />
        <StatCard
          highlight
          title='Menunggu Verifikasi'
          value={summary.menungguVerifikasi}
          desc='Perlu segera diproses'
        />
      </div>

      {/* INSIGHT */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <div className='bg-white rounded-xl border border-slate-200 p-4 md:p-6'>
          <h2 className='text-sm font-semibold text-slate-700 mb-2'>
            Tugas Hari Ini
          </h2>
          <ul className='text-sm text-slate-600 space-y-2 list-disc pl-4'>
            <li>Periksa peminjaman yang menunggu persetujuan</li>
            <li>Verifikasi pengembalian alat yang masuk</li>
            <li>Pastikan kondisi alat sesuai laporan</li>
            <li>Koordinasikan denda jika terjadi keterlambatan</li>
          </ul>
        </div>

        <div className='bg-white rounded-xl border border-slate-200 p-4 md:p-6'>
          <h2 className='text-sm font-semibold text-slate-700 mb-2'>
            Catatan Operasional
          </h2>
          <ul className='text-sm text-slate-600 space-y-2 list-disc pl-4'>
            <li>Proses verifikasi dilakukan sesuai urutan pengajuan</li>
            <li>Pastikan data pengembalian tercatat dengan benar</li>
            <li>Laporkan kerusakan alat ke admin</li>
            <li>Sistem dirancang untuk mendukung alur kerja cepat</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function StatCard ({ title, value, desc, highlight }) {
  return (
    <div
      className={`rounded-xl border p-4 md:p-5 ${
        highlight ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'
      }`}
    >
      <p className='text-sm font-medium text-slate-600'>{title}</p>
      <h2 className='mt-1 text-3xl font-semibold text-slate-800'>{value}</h2>
      <p className='mt-1 text-xs text-slate-500'>{desc}</p>
    </div>
  )
}
