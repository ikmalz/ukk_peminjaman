import { useEffect, useState } from 'react'
import api from '../../lib/api'

export default function DashboardAdmin () {
  const [stats, setStats] = useState({ users: 0, alat: 0, kategori: 0 })

  useEffect(() => {
    const fetchData = async () => {
      const [users, alat, kategori] = await Promise.all([
        api.get('/users'),
        api.get('/alat'),
        api.get('/kategori')
      ])

      setStats({
        users: users.data.data.length,
        alat: alat.data.data.length,
        kategori: kategori.data.data.length
      })
    }
    fetchData()
  }, [])

  return (
    <div className='space-y-6'>
      {/* HEADER */}
      <div>
        <h1 className='text-xl md:text-2xl font-semibold text-slate-800'>
          Dashboard Admin
        </h1>
        <p className='text-sm text-slate-500'>
          Ringkasan data dan kondisi sistem peminjaman
        </p>
      </div>

      {/* STAT CARDS */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        <StatCard
          title='Total Pengguna'
          value={stats.users}
          desc='Jumlah akun terdaftar'
        />
        <StatCard
          title='Total Alat'
          value={stats.alat}
          desc='Seluruh alat inventaris'
        />
        <StatCard
          title='Kategori Alat'
          value={stats.kategori}
          desc='Jenis kategori tersedia'
        />
      </div>

      {/* INSIGHT */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <div className='bg-white rounded-xl border border-slate-200 p-4 md:p-6'>
          <h2 className='text-sm font-semibold text-slate-700 mb-2'>
            Analisis Sistem
          </h2>
          <ul className='text-sm text-slate-600 space-y-2 list-disc pl-4'>
            <li>
              Sistem memiliki{' '}
              <span className='font-medium text-slate-800'>{stats.users}</span>{' '}
              pengguna aktif terdaftar
            </li>
            <li>
              Total{' '}
              <span className='font-medium text-slate-800'>{stats.alat}</span>{' '}
              alat tersedia untuk dikelola
            </li>
            <li>
              Alat dikelompokkan dalam{' '}
              <span className='font-medium text-slate-800'>
                {stats.kategori}
              </span>{' '}
              kategori
            </li>
            <li>
              Admin dapat mengelola user, alat, dan kategori secara terpusat
            </li>
          </ul>
        </div>

        <div className='bg-white rounded-xl border border-slate-200 p-4 md:p-6'>
          <h2 className='text-sm font-semibold text-slate-700 mb-2'>
            Catatan Operasional
          </h2>
          <ul className='text-sm text-slate-600 space-y-2 list-disc pl-4'>
            <li>
              Pastikan data alat selalu diperbarui sebelum proses peminjaman
            </li>
            <li>Periksa status user secara berkala</li>
            <li>Gunakan fitur kategori untuk mempermudah pengelompokan alat</li>
            <li>
              Sistem dirancang untuk mendukung proses peminjaman yang efisien
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function StatCard ({ title, value, desc }) {
  return (
    <div className='bg-white rounded-xl border border-slate-200 p-4 md:p-5'>
      <p className='text-sm font-medium text-slate-600'>{title}</p>
      <h2 className='mt-1 text-3xl font-semibold text-slate-800'>{value}</h2>
      <p className='mt-1 text-xs text-slate-500'>{desc}</p>
    </div>
  )
}
