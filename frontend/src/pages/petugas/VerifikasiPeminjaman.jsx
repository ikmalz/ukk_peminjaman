import { useEffect, useMemo, useState } from 'react'
import api from '../../lib/api'
import { io } from 'socket.io-client'
import { useRef } from 'react'

const statusCfg = {
  menunggu: {
    cls: 'bg-amber-50 text-amber-600 border-amber-100',
    dot: 'bg-amber-400',
    label: 'Menunggu'
  },
  disetujui: {
    cls: 'bg-green-50 text-green-600 border-green-100',
    dot: 'bg-green-500',
    label: 'Disetujui'
  },
  ditolak: {
    cls: 'bg-red-50   text-red-500   border-red-100',
    dot: 'bg-red-400',
    label: 'Ditolak'
  }
}

function StatusBadge ({ status }) {
  const cfg = statusCfg[status] ?? {
    cls: 'bg-gray-50 text-gray-400 border-gray-100',
    dot: 'bg-gray-300',
    label: status
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

export default function VerifikasiPeminjaman () {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmData, setConfirmData] = useState(null)
  const [tab, setTab] = useState('verifikasi')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10
  const socketRef = useRef(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/peminjaman')
      setData(res.data.data)
    } catch {
      setError('Gagal mengambil data peminjaman')
    }
    setLoading(false)
  }

  useEffect(() => {
    socketRef.current = io('http://localhost:3000')

    socketRef.current.on('peminjaman_update', () => {
      console.log('REALTIME PEMINJAMAN 🔥')
      fetchData()
    })

    return () => {
      socketRef.current.disconnect()
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  const updateStatus = async () => {
    try {
      await api.patch(`/peminjaman/${confirmData.id}/status`, {
        status: confirmData.status
      })
      setConfirmData(null)
      fetchData()
    } catch {
      alert('Gagal mengubah status')
    }
  }

  const filteredData = useMemo(() => {
    const byTab =
      tab === 'verifikasi'
        ? data.filter(d => d.status === 'menunggu')
        : data.filter(d => d.status !== 'menunggu')
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

  const formatTanggal = date => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTanggalWaktu = date => {
    if (!date) return '-'
    return new Date(date).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-[20px] font-bold tracking-tight text-gray-900'>
          Verifikasi Peminjaman
        </h1>
        <p className='mt-0.5 text-sm text-gray-400'>
          Kelola persetujuan dan histori peminjaman alat
        </p>
      </div>

      {/* Card */}
      <div className='rounded-xl border border-gray-200 bg-white overflow-hidden'>
        {/* Tabs + search bar */}
        <div className='flex flex-col gap-3 border-b border-gray-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex gap-1'>
            {[
              { key: 'verifikasi', label: 'Perlu Verifikasi' },
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
                {t.key === 'verifikasi' &&
                  data.filter(d => d.status === 'menunggu').length > 0 && (
                    <span className='ml-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-white'>
                      {data.filter(d => d.status === 'menunggu').length}
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

        {/* Table */}
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-gray-100 bg-gray-50'>
                {[
                  'Peminjam',
                  'Alat',
                  'Tgl Pinjam',
                  'Rencana Kembali',
                  'Status',
                ].map(h => (
                  <th
                    key={h}
                    className='px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400'
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className='border-b border-gray-50'>
                    {[130, 120, 90, 100, 70, 100].map((w, j) => (
                      <td key={j} className='px-5 py-3.5'>
                        <div
                          className='h-3 animate-pulse rounded bg-gray-100'
                          style={{ width: w }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan='6'
                    className='px-5 py-10 text-center text-sm text-gray-300'
                  >
                    {tab === 'verifikasi'
                      ? 'Tidak ada peminjaman yang menunggu'
                      : 'Belum ada histori'}
                  </td>
                </tr>
              ) : (
                paginatedData.map(p => (
                  <tr
                    key={p.id_peminjaman}
                    className='border-b border-gray-50 last:border-0 hover:bg-gray-50 transition'
                  >
                    <td className='px-5 py-3.5 font-medium text-gray-900'>
                      {p.peminjam}
                    </td>
                    <td className='px-5 py-3.5 text-gray-600'>{p.alat}</td>
                    <td className='px-5 py-3.5 text-gray-500 tabular-nums'>
                      {formatTanggalWaktu(p.tgl_pinjam)}
                    </td>
                    <td className='px-5 py-3.5 text-gray-500 tabular-nums'>
                      {formatTanggal(p.tgl_rencana_kembali)}
                    </td>
                    <td className='px-5 py-3.5'>
                      <StatusBadge status={p.status} />
                    </td>
                    <td className='px-5 py-3.5'>
                      {p.status === 'menunggu' ? (
                        <div className='flex items-center gap-3'>
                          <button
                            onClick={() =>
                              setConfirmData({
                                id: p.id_peminjaman,
                                status: 'disetujui'
                              })
                            }
                            className='text-xs font-semibold text-green-600 hover:text-green-800 transition'
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() =>
                              setConfirmData({
                                id: p.id_peminjaman,
                                status: 'ditolak'
                              })
                            }
                            className='text-xs font-semibold text-red-500 hover:text-red-700 transition'
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <span className='text-xs text-gray-300'>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
            <div
              className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full ${
                confirmData.status === 'disetujui' ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              {confirmData.status === 'disetujui' ? (
                <svg
                  width='18'
                  height='18'
                  fill='none'
                  stroke='#16a34a'
                  strokeWidth='2.5'
                  viewBox='0 0 24 24'
                >
                  <polyline points='20,6 9,17 4,12' />
                </svg>
              ) : (
                <svg
                  width='18'
                  height='18'
                  fill='none'
                  stroke='#ef4444'
                  strokeWidth='2.5'
                  viewBox='0 0 24 24'
                >
                  <line x1='18' y1='6' x2='6' y2='18' />
                  <line x1='6' y1='6' x2='18' y2='18' />
                </svg>
              )}
            </div>
            <h3 className='mb-1 text-[15px] font-bold text-gray-900'>
              {confirmData.status === 'disetujui'
                ? 'Setujui Peminjaman?'
                : 'Tolak Peminjaman?'}
            </h3>
            <p className='mb-5 text-sm text-gray-400'>
              {confirmData.status === 'disetujui'
                ? 'Peminjam akan mendapat notifikasi bahwa pengajuannya disetujui.'
                : 'Peminjaman akan ditolak dan stok alat tidak akan berkurang.'}
            </p>
            <div className='flex justify-end gap-2'>
              <button
                onClick={() => setConfirmData(null)}
                className='rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition'
              >
                Batal
              </button>
              <button
                onClick={updateStatus}
                className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition ${
                  confirmData.status === 'disetujui'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {confirmData.status === 'disetujui'
                  ? 'Ya, Setujui'
                  : 'Ya, Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
