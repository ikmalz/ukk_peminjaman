import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function DashboardPeminjam () {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState({ alat: null, pinjam: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const [alatRes, pinjamRes] = await Promise.all([
        api.get('/alat/tersedia'),
        api.get('/peminjaman/saya')
      ])
      setData({
        alat: alatRes.data.data.length,
        pinjam: pinjamRes.data.data.length
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
          Selamat datang,{' '}
          <span className='font-medium text-gray-600'>{user?.name}</span>
        </p>
      </div>

      {/* Stats */}
      <div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div className='relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 transition hover:shadow-sm'>
          <div className='absolute top-0 left-0 right-0 h-[3px] bg-gray-100' />
          <div className='mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-400'>
            <svg
              width='15'
              height='15'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <path d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' />
            </svg>
          </div>
          <p className='mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400'>
            Alat Tersedia
          </p>
          {loading ? (
            <div className='mb-1 h-8 w-12 animate-pulse rounded bg-gray-100' />
          ) : (
            <p className='text-[32px] font-bold leading-none tracking-tight text-gray-900'>
              {data.alat}
            </p>
          )}
          <p className='mt-1 text-[12px] text-gray-400'>alat siap dipinjam</p>
        </div>

        <div className='relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 transition hover:shadow-sm'>
          <div className='absolute top-0 left-0 right-0 h-[3px] bg-gray-100' />
          <div className='mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-400'>
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
          </div>
          <p className='mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400'>
            Peminjaman Saya
          </p>
          {loading ? (
            <div className='mb-1 h-8 w-12 animate-pulse rounded bg-gray-100' />
          ) : (
            <p className='text-[32px] font-bold leading-none tracking-tight text-gray-900'>
              {data.pinjam}
            </p>
          )}
          <p className='mt-1 text-[12px] text-gray-400'>
            total riwayat peminjaman
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className='mb-4 rounded-xl border border-gray-200 bg-white p-5'>
        <p className='mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400'>
          Aksi Cepat
        </p>
        <div className='flex flex-wrap gap-2'>
          <button
            onClick={() => navigate('/peminjam/alat')}
            className='rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-700 transition'
          >
            Lihat Daftar Alat
          </button>
          <button
            onClick={() => navigate('/peminjam/kembali')}
            className='rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition'
          >
            Ajukan Pengembalian
          </button>
        </div>
      </div>

      {/* Info notice */}
      <div className='flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4'>
        <svg
          className='mt-0.5 shrink-0 text-amber-500'
          width='15'
          height='15'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          viewBox='0 0 24 24'
        >
          <circle cx='12' cy='12' r='10' />
          <line x1='12' y1='8' x2='12' y2='12' />
          <line x1='12' y1='16' x2='12.01' y2='16' />
        </svg>
        <p className='text-[13px] text-amber-700 leading-relaxed'>
          Pastikan alat dikembalikan tepat waktu untuk menghindari denda
          keterlambatan sesuai kebijakan yang berlaku.
        </p>
      </div>
    </div>
  )
}
