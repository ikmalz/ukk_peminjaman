import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'

function DetailRow ({ label, value, valueClass = '' }) {
  return (
    <div>
      <p className='text-[11px] font-semibold uppercase tracking-wider text-gray-400'>
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-medium text-gray-800 ${valueClass}`}>
        {value || '—'}
      </p>
    </div>
  )
}

export default function DetailAlat () {
  const { id } = useParams()
  const navigate = useNavigate()

  const [alat, setAlat] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDipinjam, setIsDipinjam] = useState(false)
  const [error, setError] = useState(null)

  const IMAGE_URL = api.defaults.baseURL.replace('/api', '')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const alatRes = await api.get(`/alat/${id}/detail`)

        if (alatRes.data.data) {
          setAlat(alatRes.data.data)
        } else {
          setError('Data alat tidak ditemukan')
        }

        try {
          const pinjamRes = await api.get('/peminjaman/aktif') 
          const sedangPinjam = pinjamRes.data.data?.some(
            p => p.id_alat === Number(id)
          )
          setIsDipinjam(!!sedangPinjam)
        } catch (pinjamErr) {
          console.warn('Gagal cek peminjaman aktif:', pinjamErr)
          setIsDipinjam(false) 
        }
      } catch (err) {
        console.error('Error fetch detail alat:', err)
        setError(err.response?.data?.message || 'Gagal memuat detail alat')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchData()
  }, [id])

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='h-8 w-64 animate-pulse rounded bg-gray-100' />
        <div className='grid gap-6 md:grid-cols-2'>
          <div className='h-80 animate-pulse rounded-xl bg-gray-100' />
          <div className='space-y-4 rounded-xl border bg-white p-6'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='h-5 animate-pulse rounded bg-gray-100' />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !alat) {
    return (
      <div className='text-center py-20'>
        <p className='text-red-500 text-lg'>
          Alat tidak ditemukan atau gagal dimuat
        </p>
        <button
          onClick={() => navigate(-1)}
          className='mt-4 text-blue-600 hover:underline'
        >
          ← Kembali
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-[20px] font-bold tracking-tight text-gray-900'>
            Detail Alat
          </h1>
          <p className='mt-0.5 text-sm text-gray-400'>
            Informasi lengkap alat inventaris
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className='flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition'
        >
          ← Kembali
        </button>
      </div>

      {/* Main Card */}
      <div className='overflow-hidden rounded-xl border border-gray-200 bg-white md:grid md:grid-cols-2'>
        {/* Image Section */}
        <div className='flex items-center justify-center bg-gray-50 p-8 md:min-h-[340px]'>
          {alat.image ? (
            <img
              src={`${IMAGE_URL}${alat.image}`}
              alt={alat.name}
              className='max-h-72 w-full object-contain'
            />
          ) : (
            <div className='flex flex-col items-center gap-3 text-gray-300'>
              <svg
                width='48'
                height='48'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.2'
                viewBox='0 0 24 24'
              >
                <rect x='3' y='3' width='18' height='18' rx='2' />
                <circle cx='8.5' cy='8.5' r='1.5' />
                <polyline points='21,15 16,10 5,21' />
              </svg>
              <span className='text-sm'>Tidak ada gambar</span>
            </div>
          )}
        </div>

        {/* Detail Section */}
        <div className='flex flex-col p-6'>
          <div className='mb-6 border-b border-gray-100 pb-5'>
            <div className='flex items-start justify-between'>
              <h2 className='text-xl font-bold text-gray-900'>{alat.name}</h2>
              <span
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                  alat.kondisi === 'rusak'
                    ? 'border-red-200 bg-red-50 text-red-600'
                    : 'border-green-200 bg-green-50 text-green-600'
                }`}
              >
                {alat.kondisi || 'Normal'}
              </span>
            </div>
            <p className='font-mono text-sm text-gray-400 mt-1'>
              {alat.kode_alat}
            </p>
          </div>

          <div className='grid grid-cols-2 gap-x-8 gap-y-5 mb-6'>
            <DetailRow label='Merk' value={alat.merk} />
            <DetailRow label='Tipe / Model' value={alat.tipe_model} />
            <DetailRow
              label='Stok'
              value={alat.stok}
              valueClass={
                alat.stok <= (alat.stok_minimum || 0)
                  ? 'text-red-600'
                  : 'text-emerald-600'
              }
            />
            <DetailRow label='Stok Minimum' value={alat.stok_minimum} />
            <DetailRow
              label='Status'
              value={alat.status_aktif === 1 ? 'Aktif' : 'Nonaktif'}
              valueClass={
                alat.status_aktif === 1 ? 'text-emerald-600' : 'text-red-600'
              }
            />
            <DetailRow
              label='Harga'
              value={`Rp ${Number(alat.harga || 0).toLocaleString('id-ID')}`}
            />
          </div>

          {alat.spesifikasi && (
            <div className='mb-6 rounded-xl bg-gray-50 p-5'>
              <p className='text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2'>
                Spesifikasi
              </p>
              <p className='text-sm text-gray-700 leading-relaxed'>
                {alat.spesifikasi}
              </p>
            </div>
          )}

          <div className='mt-auto'>
            {isDipinjam ? (
              <div className='rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 mb-4'>
                ⚠️ Kamu sedang memiliki peminjaman aktif untuk alat ini
              </div>
            ) : (
              <div className='rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 mb-4'>
                ✅ Alat ini tersedia untuk dipinjam
              </div>
            )}

            <button
              disabled={isDipinjam || alat.status_aktif !== 1}
              onClick={() =>
                navigate('/peminjam/pinjam', {
                  state: { id_alat: alat.id_alat, name: alat.name }
                })
              }
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
                isDipinjam || alat.status_aktif !== 1
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gray-900 hover:bg-gray-800'
              }`}
            >
              {isDipinjam
                ? 'Tidak dapat meminjam (sedang aktif)'
                : 'Ajukan Peminjaman'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
