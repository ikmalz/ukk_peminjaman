import { useEffect, useMemo, useState } from 'react'
import api from '../../lib/api'
import { io } from 'socket.io-client'
import { useRef } from 'react'

const formatDate = d =>
  new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

const terlambatHari = (jatuhTempo, kembali) => {
  const diff = Math.ceil((new Date(kembali) - new Date(jatuhTempo)) / 86400000)
  return diff > 0 ? diff : 0
}

const kondisiOpts = [
  { value: 'normal', label: 'Normal' },
  { value: 'rusak_ringan', label: 'Rusak Ringan' },
  { value: 'rusak_berat', label: 'Rusak Berat' },
  { value: 'hilang', label: 'Hilang' }
]

export default function VerifikasiPengembalian () {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('verifikasi')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [kondisi, setKondisi] = useState({})
  const [confirmData, setConfirmData] = useState(null)
  const limit = 5
  const [loadingVerif, setLoadingVerif] = useState(false)
  const socketRef = useRef(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/pengembalian')
      setData(res.data.data)
    } catch {
      setError('Gagal mengambil data pengembalian')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    socketRef.current = io('http://localhost:3000')

    socketRef.current.on('pengembalian_update', () => {
      console.log('REALTIME PENGEMBALIAN 🔥')
      fetchData()
    })

    return () => {
      socketRef.current.disconnect()
    }
  }, [])

  const verifikasi = async () => {
    if (loadingVerif) return

    setLoadingVerif(true)

    try {
      await api.patch(`/pengembalian/${confirmData.id}/verifikasi`, {
        kondisi_final: kondisi[confirmData.id] || 'normal'
      })

      setConfirmData(null)
      fetchData()
    } catch {
      alert('Gagal verifikasi')
    } finally {
      setLoadingVerif(false)
    }
  }

  const filteredData = useMemo(() => {
    const byTab =
      tab === 'verifikasi'
        ? data.filter(d => d.status_verifikasi === 'menunggu')
        : data.filter(d => d.status_verifikasi !== 'menunggu')
    return byTab.filter(
      d =>
        d.peminjam.toLowerCase().includes(search.toLowerCase()) ||
        d.alat.toLowerCase().includes(search.toLowerCase())
    )
  }, [data, tab, search])

  const totalPage = Math.ceil(filteredData.length / limit)
  const paginatedData = filteredData.slice((page - 1) * limit, page * limit)
  useEffect(() => {
    setPage(1)
  }, [tab, search])

  const pending = data.filter(d => d.status_verifikasi === 'menunggu').length
  console.log('CLICK VERIFIKASI')

  return (
    <div>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-[20px] font-bold tracking-tight text-gray-900'>
          Verifikasi Pengembalian
        </h1>
        <p className='mt-0.5 text-sm text-gray-400'>
          Verifikasi kondisi alat setelah dikembalikan peminjam
        </p>
      </div>

      <div className='rounded-xl border border-gray-200 bg-white overflow-hidden'>
        {/* Toolbar */}
        <div className='flex flex-col gap-3 border-b border-gray-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex gap-1'>
            {[
              { key: 'verifikasi', label: 'Menunggu' },
              { key: 'histori', label: 'Histori' }
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  tab === t.key
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                {t.label}
                {t.key === 'verifikasi' && pending > 0 && (
                  <span className='ml-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-white'>
                    {pending}
                  </span>
                )}
              </button>
            ))}
          </div>
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
              placeholder='Cari peminjam / alat...'
              value={search}
              onChange={e => setSearch(e.target.value)}
              className='w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-xs outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:w-56'
            />
          </div>
        </div>

        {error && (
          <div className='mx-5 mt-3 rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-600'>
            {error}
          </div>
        )}

        {/* Content */}
        <div className='p-5'>
          {loading ? (
            <div className='space-y-3'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='rounded-xl border border-gray-100 p-5'>
                  <div className='mb-3 h-4 w-40 animate-pulse rounded bg-gray-100' />
                  <div className='h-3 w-60 animate-pulse rounded bg-gray-100' />
                </div>
              ))}
            </div>
          ) : paginatedData.length === 0 ? (
            <div className='py-10 text-center text-sm text-gray-300'>
              {tab === 'verifikasi'
                ? 'Tidak ada pengembalian yang menunggu verifikasi'
                : 'Belum ada histori'}
            </div>
          ) : (
            <div className='space-y-3'>
              {paginatedData.map(p => {
                const terlambat = terlambatHari(
                  p.tgl_jatuh_tempo,
                  p.tgl_kembali
                )
                const isVerified = p.status_verifikasi !== 'menunggu'

                return (
                  <div
                    key={p.id_pengembalian}
                    className={`rounded-xl border p-5 transition ${
                      isVerified
                        ? 'border-gray-100 bg-gray-50/50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {/* Top row */}
                    <div className='mb-3 flex items-start justify-between gap-3'>
                      <div>
                        <p className='font-semibold text-gray-900'>{p.alat}</p>
                        <p className='mt-0.5 text-[12px] text-gray-400'>
                          Peminjam:{' '}
                          <span className='font-medium text-gray-600'>
                            {p.peminjam}
                          </span>
                        </p>
                      </div>

                      {/* Status badge */}
                      {isVerified ? (
                        <span className='inline-flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-600'>
                          <span className='h-1.5 w-1.5 rounded-full bg-green-500' />{' '}
                          Terverifikasi
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600'>
                          <span className='h-1.5 w-1.5 rounded-full bg-amber-400' />{' '}
                          Menunggu
                        </span>
                      )}
                    </div>

                    {/* Meta row */}
                    <div className='mb-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px]'>
                      <span className='text-gray-400'>
                        Dikembalikan:{' '}
                        <span className='font-medium text-gray-600'>
                          {formatDate(p.tgl_kembali)}
                        </span>
                      </span>
                      <span className='text-gray-400'>
                        Kondisi laporan:{' '}
                        <span className='font-medium text-gray-600 capitalize'>
                          {p.kondisi_laporan}
                        </span>
                      </span>
                      {terlambat > 0 && (
                        <span className='inline-flex items-center gap-1 font-semibold text-red-500'>
                          <svg
                            width='11'
                            height='11'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2.5'
                            viewBox='0 0 24 24'
                          >
                            <circle cx='12' cy='12' r='10' />
                            <line x1='12' y1='8' x2='12' y2='12' />
                            <line x1='12' y1='16' x2='12.01' y2='16' />
                          </svg>
                          Terlambat {terlambat} hari
                        </span>
                      )}
                    </div>

                    {/* Verifikasi actions */}
                    {!isVerified && (
                      <div className='flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3'>
                        <div className='flex flex-col gap-1'>
                          <label className='text-[10px] font-semibold uppercase tracking-wider text-gray-400'>
                            Kondisi Final
                          </label>
                          <select
                            value={kondisi[p.id_pengembalian] || 'normal'}
                            onChange={e =>
                              setKondisi(prev => ({
                                ...prev,
                                [p.id_pengembalian]: e.target.value
                              }))
                            }
                            className='rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                          >
                            {kondisiOpts.map(o => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() =>
                            setConfirmData({ id: p.id_pengembalian })
                          }
                          className='mt-auto rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-700 transition'
                        >
                          Verifikasi
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPage > 1 && (
          <div className='flex items-center justify-between border-t border-gray-100 px-5 py-3'>
            <span className='text-xs text-gray-400'>
              {(page - 1) * limit + 1}–
              {Math.min(page * limit, filteredData.length)} dari{' '}
              {filteredData.length}
            </span>
            <div className='flex items-center gap-1'>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className='rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition'
              >
                ← Prev
              </button>
              <span className='px-2 text-xs text-gray-400'>
                {page} / {totalPage}
              </span>
              <button
                disabled={page === totalPage}
                onClick={() => setPage(p => p + 1)}
                className='rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition'
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {confirmData && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]'>
          <div className='w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl'>
            <div className='mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50'>
              <svg
                width='18'
                height='18'
                fill='none'
                stroke='#3451b2'
                strokeWidth='2.5'
                viewBox='0 0 24 24'
              >
                <polyline points='9,11 12,14 22,4' />
                <path d='M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' />
              </svg>
            </div>
            <h3 className='mb-1 text-[15px] font-bold text-gray-900'>
              Konfirmasi Verifikasi
            </h3>
            <p className='mb-1 text-sm text-gray-400'>
              Kondisi final yang dipilih:
            </p>
            <p className='mb-5 font-semibold capitalize text-gray-800'>
              {
                kondisiOpts.find(
                  o => o.value === (kondisi[confirmData.id] || 'normal')
                )?.label
              }
            </p>
            <div className='flex justify-end gap-2'>
              <button
                onClick={() => setConfirmData(null)}
                className='rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition'
              >
                Batal
              </button>
              <button
                onClick={verifikasi}
                disabled={loadingVerif}
                className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition ${
                  loadingVerif
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 hover:bg-gray-700'
                }`}
              >
                {loadingVerif ? 'Memproses...' : 'Ya, Verifikasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
