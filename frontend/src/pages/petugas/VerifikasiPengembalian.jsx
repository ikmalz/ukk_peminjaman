// VerifikasiPengembalian.jsx - dengan fitur Export Excel
import { useEffect, useMemo, useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import api from '../../lib/api'
import { io } from 'socket.io-client'
import { useAuth } from '../../context/AuthContext'
import Toast from '../../components/Toast'

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
  { value: 'normal', label: 'Normal', color: 'green' },
  { value: 'rusak_ringan', label: 'Rusak Ringan', color: 'yellow' },
  { value: 'rusak_berat', label: 'Rusak Berat', color: 'orange' },
  { value: 'hilang', label: 'Hilang', color: 'red' }
]

// Tombol Export Excel
function ExportButton ({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className='flex items-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
    >
      <svg
        width='13'
        height='13'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.5'
        viewBox='0 0 24 24'
      >
        <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
        <polyline points='14 2 14 8 20 8' />
        <line x1='12' y1='18' x2='12' y2='12' />
        <polyline points='9 15 12 18 15 15' />
      </svg>
      Export Excel
    </button>
  )
}

export default function VerifikasiPengembalian () {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('verifikasi')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [kondisi, setKondisi] = useState({})
  const [confirmData, setConfirmData] = useState(null)
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  })
  const limit = 6
  const [loadingVerif, setLoadingVerif] = useState(false)
  const socketRef = useRef(null)

  const showToast = (message, type = 'success') =>
    setToast({ show: true, message, type })
  const closeToast = () =>
    setToast({ show: false, message: '', type: 'success' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/pengembalian')
      setData(res.data.data)
      setError('')
    } catch (err) {
      console.error(err)
      setError('Gagal mengambil data pengembalian')
      showToast('Gagal mengambil data pengembalian', 'error')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    socketRef.current = io('http://localhost:3000')
    socketRef.current.on('pengembalian_update', () => {
      fetchData()
      showToast('Data pengembalian diperbarui', 'success')
    })
    return () => socketRef.current.disconnect()
  }, [])

  const verifikasi = async () => {
    if (loadingVerif) return
    setLoadingVerif(true)
    try {
      const kondisiFinal = kondisi[confirmData.id] || 'normal'
      const kondisiLabel = kondisiOpts.find(
        o => o.value === kondisiFinal
      )?.label
      await api.patch(`/pengembalian/${confirmData.id}/verifikasi`, {
        kondisi_final: kondisiFinal
      })
      showToast(`Verifikasi berhasil! Kondisi: ${kondisiLabel}`, 'success')
      setConfirmData(null)
      fetchData()
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Gagal verifikasi pengembalian',
        'error'
      )
    } finally {
      setLoadingVerif(false)
    }
  }

  // ── Export Excel ────────────────────────────────────────────────────────────
  const exportExcel = () => {
    const exportData = filteredData.map((p, i) => {
      const terlambat = terlambatHari(p.tgl_jatuh_tempo, p.tgl_kembali)
      const kondisiLaporan =
        kondisiOpts.find(o => o.value === p.kondisi_laporan)?.label ||
        p.kondisi_laporan ||
        '-'
      const kondisiFinalLabel =
        kondisiOpts.find(o => o.value === p.kondisi_final)?.label ||
        p.kondisi_final ||
        '-'

      return {
        No: i + 1,
        Peminjam: p.peminjam || '-',
        Alat: p.alat || '-',
        'Tgl Dikembalikan': p.tgl_kembali ? formatDate(p.tgl_kembali) : '-',
        'Tgl Jatuh Tempo': p.tgl_jatuh_tempo
          ? formatDate(p.tgl_jatuh_tempo)
          : '-',
        'Keterlambatan (Hari)': terlambat > 0 ? terlambat : 0,
        'Kondisi Laporan': kondisiLaporan,
        'Kondisi Final': kondisiFinalLabel,
        'Status Verifikasi':
          p.status_verifikasi === 'menunggu' ? 'Menunggu' : 'Terverifikasi'
      }
    })

    const ws = XLSX.utils.json_to_sheet(exportData)

    // Atur lebar kolom
    ws['!cols'] = [
      { wch: 5 }, // No
      { wch: 22 }, // Peminjam
      { wch: 25 }, // Alat
      { wch: 20 }, // Tgl Dikembalikan
      { wch: 18 }, // Tgl Jatuh Tempo
      { wch: 20 }, // Keterlambatan
      { wch: 18 }, // Kondisi Laporan
      { wch: 16 }, // Kondisi Final
      { wch: 18 } // Status Verifikasi
    ]

    const wb = XLSX.utils.book_new()
    const sheetName =
      tab === 'verifikasi' ? 'Perlu Verifikasi' : 'Histori Pengembalian'
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    const tanggal = new Date()
      .toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      .replace(/\//g, '-')
    XLSX.writeFile(wb, `pengembalian_${tab}_${tanggal}.xlsx`)
    showToast(`Berhasil export ${exportData.length} data ke Excel`, 'success')
  }
  // ───────────────────────────────────────────────────────────────────────────

  const filteredData = useMemo(() => {
    const byTab =
      tab === 'verifikasi'
        ? data.filter(d => d.status_verifikasi === 'menunggu')
        : data.filter(d => d.status_verifikasi !== 'menunggu')
    return byTab.filter(
      d =>
        d.peminjam?.toLowerCase().includes(search.toLowerCase()) ||
        d.alat?.toLowerCase().includes(search.toLowerCase())
    )
  }, [data, tab, search])

  const totalPage = Math.ceil(filteredData.length / limit)
  const paginatedData = filteredData.slice((page - 1) * limit, page * limit)

  useEffect(() => {
    setPage(1)
  }, [tab, search])

  const pendingCount = data.filter(
    d => d.status_verifikasi === 'menunggu'
  ).length

  const getKondisiBadge = k => {
    const opt = kondisiOpts.find(o => o.value === k)
    const colors = {
      green: 'bg-green-50 text-green-600 border-green-100',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
      orange: 'bg-orange-50 text-orange-600 border-orange-100',
      red: 'bg-red-50 text-red-600 border-red-100'
    }
    return colors[opt?.color] || 'bg-gray-50 text-gray-500 border-gray-100'
  }

  return (
    <div>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
          duration={4000}
        />
      )}

      <style>{`
        @keyframes modalFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes backdropFade { from { opacity: 0; } to { opacity: 1; } }
        .modal-animate { animation: modalFadeIn 0.2s ease-out; }
        .backdrop-animate { animation: backdropFade 0.15s ease-out; }
      `}</style>

      {/* Header */}
      <div className='mb-5'>
        <h1 className='text-lg font-semibold tracking-tight text-gray-900'>
          Verifikasi Pengembalian
        </h1>
        <p className='text-sm text-gray-400 mt-0.5'>
          Verifikasi kondisi alat yang dikembalikan oleh peminjam
        </p>
      </div>

      {/* Stats Cards */}
      <div className='mb-5 grid grid-cols-2 md:grid-cols-4 gap-3'>
        {[
          { label: 'Total', value: data.length, cls: 'text-gray-900' },
          { label: 'Menunggu', value: pendingCount, cls: 'text-amber-500' },
          {
            label: 'Terverifikasi',
            value: data.filter(d => d.status_verifikasi !== 'menunggu').length,
            cls: 'text-green-600'
          },
          {
            label: 'Terlambat',
            value: data.filter(
              d => terlambatHari(d.tgl_jatuh_tempo, d.tgl_kembali) > 0
            ).length,
            cls: 'text-red-500'
          }
        ].map(s => (
          <div
            key={s.label}
            className='rounded-lg border border-gray-100 bg-white p-3 shadow-sm'
          >
            <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider'>
              {s.label}
            </p>
            <p className={`text-xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main Card */}
      <div className='rounded-lg border border-gray-100 bg-white overflow-hidden shadow-sm'>
        {/* Tabs, Search & Export */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 px-4 py-2.5'>
          <div className='flex gap-1'>
            <button
              onClick={() => setTab('verifikasi')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                tab === 'verifikasi'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              Perlu Verifikasi
              {pendingCount > 0 && (
                <span className='ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-white'>
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('histori')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                tab === 'histori'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              Histori
            </button>
          </div>

          <div className='flex items-center gap-2'>
            {/* Search */}
            <div className='relative'>
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
                placeholder='Cari peminjam atau alat...'
                value={search}
                onChange={e => setSearch(e.target.value)}
                className='w-full sm:w-48 rounded-md border border-gray-200 bg-white py-1.5 pl-8 pr-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-100'
              />
            </div>
            {/* Export Button */}
            <ExportButton
              onClick={exportExcel}
              disabled={filteredData.length === 0 || loading}
            />
          </div>
        </div>

        {error && (
          <div className='mx-4 mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600 border border-red-100'>
            {error}
          </div>
        )}

        {/* Content */}
        <div className='p-4'>
          {loading ? (
            <div className='space-y-3'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='rounded-lg border border-gray-100 p-4'>
                  <div className='flex items-start justify-between mb-3'>
                    <div>
                      <div className='h-4 w-32 bg-gray-100 rounded animate-pulse' />
                      <div className='h-3 w-48 bg-gray-50 rounded animate-pulse mt-1' />
                    </div>
                    <div className='h-5 w-20 bg-gray-100 rounded-full animate-pulse' />
                  </div>
                  <div className='flex gap-4 mb-3'>
                    <div className='h-3 w-24 bg-gray-100 rounded animate-pulse' />
                    <div className='h-3 w-24 bg-gray-100 rounded animate-pulse' />
                  </div>
                  <div className='h-8 w-32 bg-gray-100 rounded animate-pulse' />
                </div>
              ))}
            </div>
          ) : paginatedData.length === 0 ? (
            <div className='py-12 text-center'>
              <div className='flex flex-col items-center gap-2'>
                <svg
                  width='48'
                  height='48'
                  fill='none'
                  stroke='#d1d5db'
                  strokeWidth='1'
                  viewBox='0 0 24 24'
                >
                  <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' />
                  <polyline points='3.29 7 12 12 20.71 7' />
                </svg>
                <p className='text-sm text-gray-400'>
                  {tab === 'verifikasi'
                    ? 'Tidak ada pengembalian yang menunggu verifikasi'
                    : 'Belum ada histori pengembalian'}
                </p>
              </div>
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
                    className={`rounded-lg border p-4 transition-all duration-200 ${
                      isVerified
                        ? 'border-gray-100 bg-gray-50/30'
                        : 'border-gray-100 bg-white hover:shadow-sm'
                    }`}
                  >
                    {/* Header */}
                    <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3'>
                      <div>
                        <p className='font-semibold text-gray-900 text-sm'>
                          {p.alat}
                        </p>
                        <p className='text-xs text-gray-500 mt-0.5'>
                          Peminjam:{' '}
                          <span className='font-medium text-gray-700'>
                            {p.peminjam}
                          </span>
                        </p>
                      </div>
                      {isVerified ? (
                        <span className='inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-medium text-green-600 border border-green-100'>
                          <span className='h-1.5 w-1.5 rounded-full bg-green-500' />{' '}
                          Terverifikasi
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-600 border border-amber-100'>
                          <span className='h-1.5 w-1.5 rounded-full bg-amber-400' />{' '}
                          Menunggu
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className='flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3 text-xs'>
                      <span className='text-gray-400'>
                        Dikembalikan:{' '}
                        <span className='font-medium text-gray-600'>
                          {formatDate(p.tgl_kembali)}
                        </span>
                      </span>
                      <span className='text-gray-400'>
                        Kondisi Laporan:
                        <span
                          className={`ml-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getKondisiBadge(
                            p.kondisi_laporan
                          )} border`}
                        >
                          {p.kondisi_laporan?.replace('_', ' ')}
                        </span>
                      </span>
                      {terlambat > 0 && (
                        <span className='inline-flex items-center gap-1 text-red-500 font-medium'>
                          <svg
                            width='12'
                            height='12'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
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

                    {/* Verifikasi Actions */}
                    {!isVerified && (
                      <div className='flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100'>
                        <div className='flex-1 min-w-[150px]'>
                          <label className='block text-[10px] font-medium text-gray-500 mb-1'>
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
                            className='w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-100'
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
                          className='mt-5 rounded-md bg-gray-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors shadow-sm'
                        >
                          Verifikasi
                        </button>
                      </div>
                    )}

                    {/* Kondisi Final jika sudah terverifikasi */}
                    {isVerified && p.kondisi_final && (
                      <div className='pt-3 border-t border-gray-100 mt-2'>
                        <span className='text-xs text-gray-400'>
                          Kondisi Final:{' '}
                        </span>
                        <span
                          className={`ml-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getKondisiBadge(
                            p.kondisi_final
                          )} border`}
                        >
                          {p.kondisi_final?.replace('_', ' ')}
                        </span>
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
          <div className='flex items-center justify-between border-t border-gray-100 px-4 py-2.5'>
            <span className='text-[10px] text-gray-400'>
              {(page - 1) * limit + 1}–
              {Math.min(page * limit, filteredData.length)} dari{' '}
              {filteredData.length}
            </span>
            <div className='flex items-center gap-1'>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className='px-2.5 py-1 rounded-md border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition'
              >
                ← Prev
              </button>
              <span className='px-2 text-xs text-gray-400'>
                {page} / {totalPage}
              </span>
              <button
                disabled={page === totalPage}
                onClick={() => setPage(p => p + 1)}
                className='px-2.5 py-1 rounded-md border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition'
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Konfirmasi */}
      {confirmData && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-animate'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => setConfirmData(null)}
          />
          <div className='relative w-full max-w-sm rounded-xl bg-white shadow-xl modal-animate'>
            <div className='p-5 text-center'>
              <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50'>
                <svg
                  width='22'
                  height='22'
                  fill='none'
                  stroke='#3b82f6'
                  strokeWidth='2'
                  viewBox='0 0 24 24'
                >
                  <polyline points='9,11 12,14 22,4' />
                  <path d='M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' />
                </svg>
              </div>
              <h3 className='text-base font-semibold text-gray-900 mb-1'>
                Konfirmasi Verifikasi
              </h3>
              <p className='text-xs text-gray-500 mb-2'>
                Kondisi final yang dipilih:
              </p>
              <p className='mb-5 text-sm font-semibold capitalize text-gray-800'>
                {
                  kondisiOpts.find(
                    o => o.value === (kondisi[confirmData.id] || 'normal')
                  )?.label
                }
              </p>
              <div className='flex gap-2'>
                <button
                  onClick={() => setConfirmData(null)}
                  className='flex-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors'
                >
                  Batal
                </button>
                <button
                  onClick={verifikasi}
                  disabled={loadingVerif}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-colors ${
                    loadingVerif
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                >
                  {loadingVerif ? 'Memproses...' : 'Ya, Verifikasi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
