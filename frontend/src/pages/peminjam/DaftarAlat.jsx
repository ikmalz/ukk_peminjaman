import { useEffect, useMemo, useState } from 'react'
import api from '../../lib/api'
import { useNavigate } from 'react-router-dom'

const stokColor = stok => {
  if (stok <= 2) return 'text-red-500'
  if (stok <= 5) return 'text-amber-500'
  return 'text-green-600'
}

function SkeletonCard () {
  return (
    <div className='animate-pulse rounded-xl border border-gray-200 bg-white overflow-hidden'>
      <div className='h-36 bg-gray-100' />
      <div className='p-4 space-y-2.5'>
        <div className='h-3.5 w-2/3 rounded bg-gray-100' />
        <div className='h-3 w-1/2 rounded bg-gray-100' />
        <div className='h-3 rounded bg-gray-100' />
        <div className='h-3 w-4/5 rounded bg-gray-100' />
        <div className='mt-3 flex gap-2'>
          <div className='h-8 w-full rounded-lg bg-gray-100' />
          <div className='h-8 w-full rounded-lg bg-gray-100' />
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
  const [unitDetail, setUnitDetail] = useState({})

  useEffect(() => {
    const fetchUnit = async () => {
      try {
        const res = await api.get('/peminjaman/aktif')

        const promises = res.data.data.map(async p => {
          if (p.status === 'disetujui' || p.status === 'dipinjam') {
            try {
              const unitRes = await api.get(
                `/peminjaman/${p.id_peminjaman}/unit`
              )
              return { id_alat: p.id_alat, data: unitRes.data.data }
            } catch (err) {
              if (err.response?.status !== 404) {
                console.error(err)
              }
              return null
            }
          }
          return null
        })

        const results = await Promise.all(promises)

        const mapped = {}
        results.forEach(r => {
          if (r) mapped[r.id_alat] = r.data
        })

        setUnitDetail(mapped)
      } catch (err) {
        console.log(err)
      }
    }

    fetchUnit()
  }, [])

  useEffect(() => {
    const checkPeminjaman = async () => {
      try {
        const res = await api.get('/peminjaman/aktif')

        if (res.data.data.length > 0) {
          setIsBlocked(true)
          setStatusPinjam('Masih ada peminjaman yang belum selesai')
        }
      } catch (err) {
        console.log(err)
      }
    }

    checkPeminjaman()
  }, [])

  const [tooltip, setTooltip] = useState({
    show: false,
    text: '',
    x: 0,
    y: 0
  })

  const showTooltip = (e, text) => {
    setTooltip({
      show: true,
      text,
      x: e.clientX,
      y: e.clientY
    })
  }

  const moveTooltip = e => {
    setTooltip(prev => ({
      ...prev,
      x: e.clientX,
      y: e.clientY
    }))
  }

  const hideTooltip = () => {
    setTooltip(prev => ({ ...prev, show: false }))
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alatRes, pinjamRes] = await Promise.all([
          api.get('/alat/tersedia'),
          api.get('/peminjaman/aktif')
        ])
        setAlat(alatRes.data.data)
        setDipinjam(pinjamRes.data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredAlat = useMemo(
    () =>
      alat.filter(
        a =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.kategori?.toLowerCase().includes(search.toLowerCase())
      ),
    [alat, search]
  )

  return (
    <div>
      {/* Header */}
      <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-[20px] font-bold tracking-tight text-gray-900'>
            Daftar Alat
          </h1>
          <p className='mt-0.5 text-sm text-gray-400'>
            Pilih alat tersedia untuk diajukan peminjaman
          </p>
        </div>

        {/* Search */}
        <div className='relative'>
          <svg
            className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-300'
            width='13'
            height='13'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <circle cx='11' cy='11' r='8' />
            <line x1='21' y1='21' x2='16.65' y2='16.65' />
          </svg>
          <input
            placeholder='Cari alat, kategori...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            className='w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:w-64'
          />
        </div>
      </div>

      <div className='mb-4 space-y-2'>
        {/* Info status */}
        {isBlocked && (
          <div className='rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600'>
            ⚠️ Kamu masih memiliki peminjaman aktif / menunggu.
            <br />
            Selesaikan terlebih dahulu sebelum meminjam lagi.
          </div>
        )}

        {!isBlocked && (
          <div className='rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-600'>
            ✅ Kamu dapat mengajukan peminjaman alat
          </div>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredAlat.length === 0 ? (
        <div className='rounded-xl border border-gray-200 bg-white py-14 text-center'>
          <p className='text-sm text-gray-300'>Alat tidak ditemukan</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {filteredAlat.map(a => {
            const pinjamItem = dipinjam.find(p => p.id_alat === a.id_alat)
            const isMenunggu = pinjamItem?.status === 'menunggu'
            const isDisetujui =
              pinjamItem?.status === 'disetujui' ||
              pinjamItem?.status === 'dipinjam'

            return (
              <div
                key={a.id_alat}
                className='group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1'
              >
                {/* Image */}
                <div className='relative h-36 overflow-hidden bg-gray-50'>
                  {a.image ? (
                    <img
                      src={`${IMAGE_URL}${a.image}`}
                      alt={a.name}
                      className='h-full w-full object-cover transition duration-500 group-hover:scale-110'
                    />
                  ) : (
                    <div className='flex h-full items-center justify-center text-gray-300'>
                      <svg
                        width='28'
                        height='28'
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

                  {(isMenunggu || isDisetujui) && (
                    <div className='absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center'>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isMenunggu
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isMenunggu
                          ? 'Menunggu Persetujuan'
                          : 'Sedang Dipinjam'}
                      </span>
                    </div>
                  )}

                  {/* Kondisi badge (kanan atas) */}
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-[10px] backdrop-blur-sm font-semibold ${
                      a.kondisi === 'rusak'
                        ? 'bg-red-50 text-red-500 border border-red-100'
                        : 'bg-green-50 text-green-600 border border-green-100'
                    }`}
                  >
                    {a.kondisi}
                  </span>
                </div>

                {/* Content */}
                <div className='flex flex-1 flex-col p-4'>
                  <p className='font-semibold leading-tight text-gray-900'>
                    {a.name}
                  </p>
                  <p className='mt-0.5 text-[11px] text-gray-400'>
                    <span className='font-mono'>{a.kode_alat}</span> ·{' '}
                    {a.kategori}
                  </p>

                  <div className='mt-2.5 space-y-1 text-[12.5px] text-gray-500'>
                    {a.merk && (
                      <p>
                        <span className='font-medium text-gray-700'>Merk</span>{' '}
                        · {a.merk}
                      </p>
                    )}
                    {a.tipe_model && (
                      <p>
                        <span className='font-medium text-gray-700'>Model</span>{' '}
                        · {a.tipe_model}
                      </p>
                    )}
                    {a.spesifikasi && (
                      <p className='line-clamp-2 text-[11px] text-gray-400'>
                        {a.spesifikasi}
                      </p>
                    )}
                  </div>

                  {/* Stok */}
                  <div className='mt-3 flex items-center justify-between border-t border-gray-50 pt-3'>
                    <span className='text-[11px] text-gray-400'>
                      Stok tersedia
                    </span>
                    <span className={`text-sm font-bold ${stokColor(a.stok)}`}>
                      {a.stok}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className='mt-3 grid grid-cols-2 gap-2'>
                    <button
                      onClick={() => navigate(`/peminjam/detail/${a.id_alat}`)}
                      className='rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition'
                    >
                      Detail
                    </button>

                    {/* PRIORITAS STATUS */}
                    {isMenunggu ? (
                      <button
                        onMouseEnter={e =>
                          showTooltip(e, 'Menunggu persetujuan admin')
                        }
                        onMouseMove={moveTooltip}
                        onMouseLeave={hideTooltip}
                        onClick={e => e.preventDefault()}
                        className='cursor-not-allowed rounded-lg bg-yellow-100 py-2 text-xs font-semibold text-yellow-700'
                      >
                        Menunggu
                      </button>
                    ) : isDisetujui ? (
                      <button
                        onMouseEnter={e =>
                          showTooltip(e, 'Alat sedang dipinjam')
                        }
                        onMouseMove={moveTooltip}
                        onMouseLeave={hideTooltip}
                        onClick={e => e.preventDefault()}
                        className='cursor-not-allowed rounded-lg bg-blue-100 py-2 text-xs font-semibold text-blue-700'
                      >
                        Dipinjam
                      </button>
                    ) : isBlocked ? (
                      <button
                        onMouseEnter={e =>
                          showTooltip(e, 'Selesaikan peminjaman sebelumnya')
                        }
                        onMouseMove={moveTooltip}
                        onMouseLeave={hideTooltip}
                        className='cursor-not-allowed rounded-lg bg-gray-100 py-2 text-xs font-medium text-gray-400'
                      >
                        Ajukan
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          navigate('/peminjam/pinjam', {
                            state: { id_alat: a.id_alat, name: a.name }
                          })
                        }
                        className='rounded-lg bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 py-2 text-xs font-semibold text-white hover:bg-gray-700 transition'
                      >
                        Ajukan
                      </button>
                    )}
                    {unitDetail[a.id_alat] && (
                      <div className='mt-2 text-[10px] text-gray-400'>
                        Unit:
                        <div className='flex flex-wrap gap-1 mt-1'>
                          {unitDetail[a.id_alat].map(u => (
                            <span
                              key={u.kode_unit}
                              className='px-2 py-0.5 bg-gray-100 rounded text-[10px] font-mono'
                            >
                              {u.kode_unit}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tooltip.show && (
        <div
          style={{
            top: tooltip.y + 15,
            left: tooltip.x + 15
          }}
          className='fixed z-50 pointer-events-none rounded-md bg-gray-900 px-3 py-1.5 text-[11px] text-white shadow-lg transition'
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
