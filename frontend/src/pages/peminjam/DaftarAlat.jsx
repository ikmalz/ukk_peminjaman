import { useEffect, useMemo, useState } from 'react'
import api from '../../lib/api'
import { useNavigate } from 'react-router-dom'

export default function DaftarAlat () {
  const [alat, setAlat] = useState([])
  const [dipinjam, setDipinjam] = useState([])
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const IMAGE_URL = api.defaults.baseURL.replace('/api', '')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const alatRes = await api.get('/alat/tersedia')
        const pinjamRes = await api.get('/peminjaman/aktif')

        setAlat(alatRes.data.data)
        setDipinjam(pinjamRes.data.data.map(p => p.id_alat))
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
        a.kategori?.toLowerCase().includes(search.toLowerCase())
    )
  }, [alat, search])

  const getStokColor = stok => {
    if (stok <= 2) return 'text-red-500'
    if (stok <= 5) return 'text-yellow-500'
    return 'text-emerald-500'
  }

  return (
    <div className='max-w-6xl mx-auto space-y-8'>
      {/* HEADER */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold text-slate-800'>Daftar Alat</h1>

          <p className='text-sm text-slate-500'>
            Pilih alat yang tersedia untuk diajukan peminjaman
          </p>
        </div>

        <div className='relative w-full md:w-80'>
          <input
            placeholder='Cari alat, kategori...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            className='w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none'
          />
        </div>
      </div>

      {/* GRID */}
      {loading ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredAlat.length === 0 ? (
        <div className='text-center text-sm text-slate-500 py-10'>
          Alat tidak ditemukan
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
          {filteredAlat.map(a => {
            const sedangDipinjam = dipinjam.includes(a.id_alat)

            return (
              <div
                key={a.id_alat}
                className='group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition flex flex-col'
              >
                {/* IMAGE */}
                <div className='h-40 bg-slate-100 flex items-center justify-center overflow-hidden'>
                  {a.image ? (
                    <img
                      src={`${IMAGE_URL}${a.image}`}
                      alt={a.name}
                      className='w-full h-full object-cover group-hover:scale-105 transition'
                    />
                  ) : (
                    <span className='text-slate-400 text-sm'>
                      Tidak ada gambar
                    </span>
                  )}
                </div>

                {/* CONTENT */}
                <div className='p-4 flex flex-col flex-1'>
                  {/* TITLE */}
                  <div className='flex justify-between items-start'>
                    <h2 className='font-semibold text-slate-800 text-base'>
                      {a.name}
                    </h2>

                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        a.kondisi === 'rusak'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {a.kondisi}
                    </span>
                  </div>

                  <p className='text-xs text-slate-500 mt-1'>
                    {a.kode_alat} • {a.kategori}
                  </p>

                  {/* DETAIL */}
                  <div className='mt-3 space-y-1 text-sm text-slate-600'>
                    <p>
                      <span className='font-medium'>Merk:</span> {a.merk}
                    </p>
                    <p>
                      <span className='font-medium'>Model:</span> {a.tipe_model}
                    </p>
                    <p className='line-clamp-2 text-xs text-slate-500'>
                      {a.spesifikasi}
                    </p>
                  </div>

                  {/* STOK */}
                  <div className='mt-3 flex items-center justify-between'>
                    <span className='text-xs text-slate-500'>Stok</span>
                    <span
                      className={`text-sm font-semibold ${getStokColor(
                        a.stok
                      )}`}
                    >
                      {a.stok}
                    </span>
                  </div>

                  {/* BUTTON */}
                  <div className='mt-4 grid grid-cols-2 gap-2'>
                    <button
                      onClick={() => navigate(`/peminjam/detail/${a.id_alat}`)}
                      className='rounded-lg border border-slate-300 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition'
                    >
                      Detail
                    </button>

                    {sedangDipinjam ? (
                      <button
                        disabled
                        className='rounded-lg bg-slate-300 py-2 text-xs font-medium text-white cursor-not-allowed'
                      >
                        Dipinjam
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          navigate('/peminjam/pinjam', {
                            state: {
                              id_alat: a.id_alat,
                              name: a.name
                            }
                          })
                        }
                        className='rounded-lg bg-blue-700 py-2 text-xs font-medium text-white hover:bg-blue-800 transition'
                      >
                        Ajukan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SkeletonCard () {
  return (
    <div className='bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse'>
      <div className='h-40 bg-slate-200'></div>

      <div className='p-4 space-y-3'>
        <div className='h-4 bg-slate-200 rounded w-2/3'></div>

        <div className='h-3 bg-slate-200 rounded w-1/2'></div>

        <div className='space-y-2'>
          <div className='h-3 bg-slate-200 rounded'></div>
          <div className='h-3 bg-slate-200 rounded w-5/6'></div>
        </div>

        <div className='flex gap-2 pt-2'>
          <div className='h-8 bg-slate-200 rounded w-full'></div>
          <div className='h-8 bg-slate-200 rounded w-full'></div>
        </div>
      </div>
    </div>
  )
}
