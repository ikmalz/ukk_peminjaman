// DaftarAlat.jsx - Versi Modern Minimalis
import { useEffect, useMemo, useState } from 'react'
import api from '../../lib/api'
import { useNavigate } from 'react-router-dom'

const stokColor = stok => {
  if (stok <= 0) return 'text-red-500'
  if (stok <= 2) return 'text-orange-500'
  if (stok <= 5) return 'text-amber-500'
  return 'text-green-600'
}

const stokText = stok => {
  if (stok <= 0) return 'Habis'
  if (stok <= 2) return 'Sisa Sedikit'
  if (stok <= 5) return 'Terbatas'
  return 'Tersedia'
}

function SkeletonCard () {
  return (
    <div className='animate-pulse rounded-lg border border-gray-100 bg-white overflow-hidden'>
      <div className='h-32 bg-gray-100' />
      <div className='p-3 space-y-2'>
        <div className='h-4 w-2/3 rounded bg-gray-100' />
        <div className='h-3 w-1/2 rounded bg-gray-100' />
        <div className='h-3 rounded bg-gray-100' />
        <div className='h-3 w-4/5 rounded bg-gray-100' />
        <div className='mt-2 flex gap-2'>
          <div className='h-7 w-full rounded-md bg-gray-100' />
          <div className='h-7 w-full rounded-md bg-gray-100' />
        </div>
      </div>
    </div>
  )
}

export default function DaftarAlat () {
  const [alat, setAlat] = useState([])
  const [dipinjam, setDipinjam] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const IMAGE_URL = api.defaults.baseURL.replace('/api', '')
  const [isBlocked, setIsBlocked] = useState(false)
  const [statusPinjam, setStatusPinjam] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alatRes, pinjamRes] = await Promise.all([
          api.get('/alat/tersedia'),
          api.get('/peminjaman/aktif')
        ])
        setAlat(alatRes.data.data)
        setDipinjam(pinjamRes.data.data)
        const { total_aktif, is_blocked } = pinjamRes.data
        setIsBlocked(is_blocked)
        setStatusPinjam(`${total_aktif}/5 peminjaman aktif`)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredAlat = useMemo(() => {
    return alat.filter(
      a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.kategori?.toLowerCase().includes(search.toLowerCase()) ||
        a.merk?.toLowerCase().includes(search.toLowerCase())
    )
  }, [alat, search])

  return (
    <div className='space-y-5'>
      {/* Header */}
      <div>
        <h1 className='text-lg font-semibold tracking-tight text-gray-900'>
          Daftar Alat
        </h1>
        <p className='text-sm text-gray-400 mt-0.5'>
          Pilih alat yang tersedia untuk diajukan peminjaman
        </p>
      </div>

      {/* Search and Filter */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div className='relative flex-1 max-w-sm'>
          <svg
            className='absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.5'
            viewBox='0 0 24 24'
          >
            <circle cx='11' cy='11' r='8' />
            <line x1='21' y1='21' x2='16.65' y2='16.65' />
          </svg>
          <input
            placeholder='Cari alat, kategori, atau merk...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            className='w-full rounded-md border border-gray-200 bg-white py-1.5 pl-8 pr-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-100'
          />
        </div>
        <div className='text-right'>
          <p className='text-xs text-gray-400'>
            Menampilkan {filteredAlat.length} dari {alat.length} alat
          </p>
        </div>
      </div>

      {/* Status Info */}
      <div>
        {isBlocked ? (
          <div className='rounded-md bg-red-50 border border-red-100 p-3'>
            <div className='flex items-center gap-2'>
              <svg
                width='14'
                height='14'
                fill='none'
                stroke='#ef4444'
                strokeWidth='2'
                viewBox='0 0 24 24'
              >
                <circle cx='12' cy='12' r='10' />
                <line x1='12' y1='8' x2='12' y2='12' />
                <line x1='12' y1='16' x2='12.01' y2='16' />
              </svg>
              <p className='text-xs text-red-600'>
                Kamu sudah mencapai batas maksimal 5 peminjaman aktif.
                Selesaikan salah satu peminjaman terlebih dahulu.
              </p>
            </div>
          </div>
        ) : (
          <div className='rounded-md bg-green-50 border border-green-100 p-3'>
            <div className='flex items-center gap-2'>
              <svg
                width='14'
                height='14'
                fill='none'
                stroke='#10b981'
                strokeWidth='2'
                viewBox='0 0 24 24'
              >
                <polyline points='20,6 9,17 4,12' />
              </svg>
              <p className='text-xs text-green-600'>
                {statusPinjam} — Kamu masih dapat mengajukan peminjaman
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredAlat.length === 0 ? (
        <div className='rounded-lg border border-gray-100 bg-white py-12 text-center'>
          <div className='flex flex-col items-center gap-2'>
            <svg
              width='48'
              height='48'
              fill='none'
              stroke='#d1d5db'
              strokeWidth='1'
              viewBox='0 0 24 24'
            >
              <circle cx='11' cy='11' r='8' />
              <line x1='21' y1='21' x2='16.65' y2='16.65' />
            </svg>
            <p className='text-sm text-gray-400'>
              {search
                ? 'Alat tidak ditemukan'
                : 'Tidak ada alat tersedia saat ini'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className='text-xs text-blue-500 hover:text-blue-600'
              >
                Hapus pencarian
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
          {filteredAlat.map(a => {
            const pinjamItem = dipinjam.find(p => p.id_alat === a.id_alat)
            const isMenunggu = pinjamItem?.status === 'menunggu'
            const isDisetujui =
              pinjamItem?.status === 'disetujui' ||
              pinjamItem?.status === 'dipinjam'

            return (
              <div
                key={a.id_alat}
                className='group rounded-lg border border-gray-100 bg-white overflow-hidden transition-all duration-200 hover:shadow-md'
              >
                {/* Image */}
                <div className='relative h-32 overflow-hidden bg-gray-50'>
                  {a.image ? (
                    <img
                      src={`${IMAGE_URL}${a.image}`}
                      alt={a.name}
                      className='h-full w-full object-cover transition duration-300 group-hover:scale-105'
                    />
                  ) : (
                    <div className='flex h-full items-center justify-center text-gray-300'>
                      <svg
                        width='24'
                        height='24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='1.5'
                        viewBox='0 0 24 24'
                      >
                        <rect x='3' y='3' width='18' height='18' rx='2' />
                        <circle cx='8.5' cy='8.5' r='1.5' />
                        <polyline points='21,15 16,10 5,21' />
                      </svg>
                    </div>
                  )}

                  {/* Overlay for borrowed/awaiting */}
                  {(isMenunggu || isDisetujui) && (
                    <div className='absolute inset-0 bg-black/50 flex items-center justify-center'>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                          isMenunggu
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {isMenunggu ? 'Menunggu' : 'Dipinjam'}
                      </span>
                    </div>
                  )}

                  {/* Kondisi badge */}
                  <span
                    className={`absolute right-2 top-2 rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${
                      a.kondisi === 'rusak'
                        ? 'bg-red-50 text-red-500 border border-red-100'
                        : 'bg-green-50 text-green-600 border border-green-100'
                    }`}
                  >
                    {a.kondisi === 'rusak' ? 'Rusak' : 'Normal'}
                  </span>
                </div>

                {/* Content */}
                <div className='p-3'>
                  <p className='text-sm font-semibold text-gray-900 line-clamp-1'>
                    {a.name}
                  </p>
                  <p className='text-[10px] text-gray-400 mt-0.5'>
                    <span className='font-mono'>{a.kode_alat}</span> ·{' '}
                    {a.kategori}
                  </p>

                  {/* Spesifikasi ringkas */}
                  <div className='mt-2 text-[10px] text-gray-500 space-y-0.5'>
                    {a.merk && (
                      <p>
                        <span className='font-medium text-gray-600'>Merk:</span>{' '}
                        {a.merk}
                      </p>
                    )}
                    {a.tipe_model && (
                      <p>
                        <span className='font-medium text-gray-600'>
                          Model:
                        </span>{' '}
                        {a.tipe_model}
                      </p>
                    )}
                  </div>

                  {/* Stok */}
                  <div className='mt-2 flex items-center justify-between border-t border-gray-50 pt-2'>
                    <span className='text-[9px] text-gray-400'>Stok</span>
                    <div className='flex items-center gap-1'>
                      <span
                        className={`text-sm font-bold ${stokColor(a.stok)}`}
                      >
                        {a.stok}
                      </span>
                      <span className='text-[9px] text-gray-400'>
                        ({stokText(a.stok)})
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='mt-2 flex gap-2'>
                    <button
                      onClick={() => navigate(`/peminjam/detail/${a.id_alat}`)}
                      className='flex-1 rounded-md border border-gray-200 py-1.5 text-[10px] font-medium text-gray-600 hover:bg-gray-50 transition'
                    >
                      Detail
                    </button>

                    {isMenunggu ? (
                      <button
                        disabled
                        className='flex-1 rounded-md bg-amber-50 py-1.5 text-[10px] font-medium text-amber-600 cursor-not-allowed'
                      >
                        Menunggu
                      </button>
                    ) : isDisetujui ? (
                      <button
                        disabled
                        className='flex-1 rounded-md bg-blue-50 py-1.5 text-[10px] font-medium text-blue-600 cursor-not-allowed'
                      >
                        Dipinjam
                      </button>
                    ) : isBlocked ? (
                      <button
                        disabled
                        className='flex-1 rounded-md bg-gray-50 py-1.5 text-[10px] font-medium text-gray-400 cursor-not-allowed'
                      >
                        Ajukan
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          navigate(`/peminjam/pinjam/${a.id_alat}`, {
                            state: { alat: a }
                          })
                        }
                        className='flex-1 rounded-md bg-gray-900 py-1.5 text-[10px] font-medium text-white hover:bg-gray-800 transition'
                      >
                        Ajukan
                      </button>
                    )}
                  </div>

                  {/* QR/Struk button for active loans */}
                  {isDisetujui && pinjamItem?.id_peminjaman && (
                    <button
                      onClick={() =>
                        navigate(`/peminjam/struk/${pinjamItem.id_peminjaman}`)
                      }
                      className='mt-2 w-full rounded-md border border-blue-200 bg-blue-50 py-1 text-[9px] font-medium text-blue-600 hover:bg-blue-100 transition flex items-center justify-center gap-1'
                    >
                      <svg
                        width='10'
                        height='10'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                      >
                        <rect x='3' y='3' width='7' height='7' />
                        <rect x='14' y='3' width='7' height='7' />
                        <rect x='3' y='14' width='7' height='7' />
                        <line x1='14' y1='14' x2='14' y2='14' />
                        <line x1='17' y1='14' x2='21' y2='14' />
                        <line x1='14' y1='17' x2='14' y2='21' />
                        <line x1='21' y1='17' x2='21' y2='21' />
                        <line x1='17' y1='17' x2='17' y2='17' />
                      </svg>
                      Lihat Struk / QR
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
