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
  const IMAGE_URL = api.defaults.baseURL.replace('/api', '')
  const [isDipinjam, setIsDipinjam] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alatRes, pinjamRes] = await Promise.all([
          api.get(`/alat/${id}`),
          api.get('/peminjaman/aktif')
        ])

        setAlat(alatRes.data.data)

        const sedangPinjam = pinjamRes.data.data.some(
          p => p.id_alat === Number(id)
        )

        if (pinjamRes.data.data.length > 0) {
          setIsDipinjam(true)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  useEffect(() => {
    api
      .get(`/alat/${id}`)
      .then(res => setAlat(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div>
        <div className='mb-6 flex items-center gap-3'>
          <div className='h-6 w-20 animate-pulse rounded bg-gray-100' />
          <div className='h-6 w-40 animate-pulse rounded bg-gray-100' />
        </div>
        <div className='grid gap-4 md:grid-cols-2'>
          <div className='h-72 animate-pulse rounded-xl bg-gray-100' />
          <div className='space-y-3 rounded-xl border border-gray-200 bg-white p-6'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className='h-4 animate-pulse rounded bg-gray-100'
                style={{ width: `${60 + i * 5}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!alat)
    return <p className='text-sm text-gray-400'>Alat tidak ditemukan.</p>

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
          <svg
            width='12'
            height='12'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            viewBox='0 0 24 24'
          >
            <polyline points='15,18 9,12 15,6' />
          </svg>
          Kembali
        </button>
      </div>

      {/* Card */}
      <div className='overflow-hidden rounded-xl border border-gray-200 bg-white md:grid md:grid-cols-2'>
        {/* Image pane */}
        <div className='flex items-center justify-center bg-gray-50 p-8 md:min-h-[340px]'>
          {alat.image ? (
            <img
              src={`${IMAGE_URL}${alat.image}`}
              alt={alat.name}
              className='max-h-72 w-full object-contain'
            />
          ) : (
            <div className='flex flex-col items-center gap-2 text-gray-300'>
              <svg
                width='40'
                height='40'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.5'
                viewBox='0 0 24 24'
              >
                <rect x='3' y='3' width='18' height='18' rx='2' />
                <circle cx='8.5' cy='8.5' r='1.5' />
                <polyline points='21,15 16,10 5,21' />
              </svg>
              <span className='text-xs'>Tidak ada gambar</span>
            </div>
          )}
        </div>

        {/* Detail pane */}
        <div className='flex flex-col p-6'>
          {/* Title */}
          <div className='mb-5 border-b border-gray-100 pb-5'>
            <div className='mb-1 flex items-start justify-between gap-2'>
              <h2 className='text-lg font-bold tracking-tight text-gray-900'>
                {alat.name}
              </h2>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                  alat.kondisi === 'rusak'
                    ? 'border-red-100 bg-red-50 text-red-500'
                    : 'border-green-100 bg-green-50 text-green-600'
                }`}
              >
                {alat.kondisi}
              </span>
            </div>
            <span className='font-mono text-xs text-gray-400'>
              {alat.kode_alat}
            </span>
          </div>

          {/* Grid details */}
          <div className='mb-5 grid grid-cols-2 gap-x-6 gap-y-4'>
            <DetailRow label='Merk' value={alat.merk} />
            <DetailRow label='Tipe / Model' value={alat.tipe_model} />
            <DetailRow
              label='Stok'
              value={alat.stok}
              valueClass={
                alat.stok <= 2
                  ? 'text-red-500'
                  : alat.stok <= 5
                  ? 'text-amber-500'
                  : 'text-green-600'
              }
            />
            <DetailRow label='Stok Minimum' value={alat.stok_minimum} />
            <DetailRow
              label='Status'
              value={alat.status_aktif ? 'Aktif' : 'Nonaktif'}
              valueClass={alat.status_aktif ? 'text-green-600' : 'text-red-500'}
            />
          </div>

          {/* Spesifikasi */}
          <div className='mb-5 rounded-lg bg-gray-50 p-4'>
            <p className='mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400'>
              Spesifikasi
            </p>
            <p className='text-sm leading-relaxed text-gray-600'>
              {alat.spesifikasi || 'Tidak ada spesifikasi'}
            </p>
          </div>

          <div className='mb-4 space-y-2'>
            {isDipinjam ? (
              <div className='rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600'>
                ⚠️ Kamu sedang memiliki peminjaman aktif
              </div>
            ) : (
              <div className='rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-600'>
                ✅ Alat tersedia untuk dipinjam
              </div>
            )}
          </div>

          <button
            disabled={isDipinjam}
            onClick={() =>
              navigate('/peminjam/pinjam', {
                state: { id_alat: alat.id_alat, name: alat.name }
              })
            }
            className={`w-full rounded-lg py-2.5 text-sm font-semibold text-white transition ${
              isDipinjam
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gray-900 hover:bg-gray-700'
            }`}
          >
            {isDipinjam ? 'Tidak bisa meminjam' : 'Ajukan Peminjaman'}
          </button>
        </div>
      </div>
    </div>
  )
}
