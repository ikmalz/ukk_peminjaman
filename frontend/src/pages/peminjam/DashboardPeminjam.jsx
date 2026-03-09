import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function DashboardPeminjam () {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState({ alat: 0, pinjam: 0 })

  useEffect(() => {
    const fetchData = async () => {
      const alat = await api.get('/alat/tersedia')
      const pinjam = await api.get('/peminjaman/saya')
      setData({ alat: alat.data.data.length, pinjam: pinjam.data.data.length })
    }
    fetchData()
  }, [])

  return (
    <div className='max-w-6xl mx-auto space-y-8'>
      {/* HEADER */}
      <div className='flex flex-col gap-1'>
        <h1 className='text-2xl font-semibold text-slate-800'>
          Dashboard Peminjam
        </h1>

        <p className='text-sm text-slate-500'>
          Selamat datang,
          <span className='ml-1 font-medium text-slate-700'>{user?.name}</span>
        </p>
      </div>

      {/* STAT */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
        <StatCard
          title='Alat Tersedia'
          value={data.alat}
          desc='Alat siap dipinjam'
        />

        <StatCard
          title='Peminjaman Saya'
          value={data.pinjam}
          desc='Riwayat peminjaman'
        />
      </div>

      {/* QUICK ACTION */}
      <div className='bg-white border border-slate-200 rounded-2xl p-6 shadow-sm'>
        <h2 className='text-sm font-semibold text-slate-700 mb-4'>
          Aksi Cepat
        </h2>

        <div className='flex flex-wrap gap-3'>
          <button
            onClick={() => navigate('/peminjam/alat')}
            className='px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition'
          >
            Lihat Daftar Alat
          </button>

          <button
            onClick={() => navigate('/peminjam/kembali')}
            className='px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition'
          >
            Ajukan Pengembalian
          </button>
        </div>
      </div>

      {/* INFO */}
      <div className='flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4'>
        <div className='text-blue-600 text-lg'>ℹ️</div>

        <p className='text-sm text-blue-800'>
          Pastikan alat dikembalikan tepat waktu untuk menghindari denda
          keterlambatan sesuai kebijakan yang berlaku.
        </p>
      </div>
    </div>
  )
}

function StatCard({ title, value, desc }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">

      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <h2 className="mt-2 text-4xl font-semibold text-slate-900">
        {value}
      </h2>

      <p className="mt-1 text-xs text-slate-500">
        {desc}
      </p>

    </div>
  )
}