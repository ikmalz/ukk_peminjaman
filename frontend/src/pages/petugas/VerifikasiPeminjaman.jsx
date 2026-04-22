// VerifikasiPeminjaman.jsx - dengan fitur Export Excel
import React, { useEffect, useMemo, useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import api from '../../lib/api'
import { io } from 'socket.io-client'
import { useAuth } from '../../context/AuthContext'
import Toast from '../../components/Toast'

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
    cls: 'bg-red-50 text-red-500 border-red-100',
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${cfg.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

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

export default function VerifikasiPeminjaman () {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmData, setConfirmData] = useState(null)
  const [editingDate, setEditingDate] = useState(null)
  const [tab, setTab] = useState('verifikasi')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  })
  const [submitting, setSubmitting] = useState(false)
  const limit = 10
  const socketRef = useRef(null)

  const showToast = (message, type = 'success') =>
    setToast({ show: true, message, type })
  const closeToast = () =>
    setToast({ show: false, message: '', type: 'success' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/peminjaman')
      setData(res.data.data || res.data || [])
      setError('')
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.message.includes('Network Error')) {
        setError(
          'Backend tidak terhubung. Pastikan server berjalan di http://localhost:3000'
        )
      } else {
        setError('Gagal mengambil data peminjaman')
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    socketRef.current = io('http://localhost:3000', {
      reconnectionAttempts: 5,
      timeout: 10000
    })
    socketRef.current.on('connect', () => console.log('Socket terhubung'))
    socketRef.current.on('peminjaman_update', fetchData)
    return () => socketRef.current.disconnect()
  }, [])

  useEffect(() => {
    fetchData()
  }, [isAdmin])

  const updateStatus = async () => {
    if (!confirmData?.id || !confirmData?.status) {
      showToast('Data konfirmasi tidak valid', 'error')
      return
    }
    setSubmitting(true)
    try {
      await api.patch(`/peminjaman/${confirmData.id}/status`, {
        status: confirmData.status.toLowerCase().trim()
      })
      const statusText =
        confirmData.status === 'disetujui' ? 'disetujui' : 'ditolak'
      showToast(`Peminjaman berhasil ${statusText}`, 'success')
      setConfirmData(null)
      fetchData()
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Gagal mengubah status peminjaman',
        'error'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const updateTanggal = async () => {
    if (!editingDate?.tgl_pinjam || !editingDate?.tgl_rencana_kembali) {
      showToast('Tanggal harus diisi', 'error')
      return
    }
    const tglPinjam = new Date(editingDate.tgl_pinjam)
    const tglKembali = new Date(editingDate.tgl_rencana_kembali)
    if (tglKembali < tglPinjam) {
      showToast('Tanggal kembali tidak boleh sebelum tanggal pinjam', 'error')
      return
    }
    setSubmitting(true)
    try {
      await api.put(`/peminjaman/${editingDate.id_peminjaman}/tanggal`, {
        tgl_pinjam: editingDate.tgl_pinjam,
        tgl_rencana_kembali: editingDate.tgl_rencana_kembali
      })
      showToast('Tanggal berhasil diubah', 'success')
      setEditingDate(null)
      fetchData()
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Gagal mengubah tanggal',
        'error'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ── Export Excel ────────────────────────────────────────────────────────────
  const exportExcel = () => {
    const exportData = filteredData.map((p, i) => ({
      No: i + 1,
      Peminjam: p.peminjam || '-',
      Alat: p.alat || '-',
      'Tanggal Pinjam': formatTanggalWaktu(p.tgl_pinjam),
      'Rencana Kembali': formatTanggal(p.tgl_rencana_kembali),
      'Durasi (Hari)': p.durasi_hari || '-',
      Status: p.status
        ? p.status.charAt(0).toUpperCase() + p.status.slice(1)
        : '-',
      Deskripsi: p.deskripsi || '-'
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)

    // Atur lebar kolom
    ws['!cols'] = [
      { wch: 5 }, // No
      { wch: 22 }, // Peminjam
      { wch: 25 }, // Alat
      { wch: 22 }, // Tgl Pinjam
      { wch: 20 }, // Rencana Kembali
      { wch: 14 }, // Durasi
      { wch: 14 }, // Status
      { wch: 30 } // Deskripsi
    ]

    const wb = XLSX.utils.book_new()
    const sheetName =
      tab === 'verifikasi' ? 'Perlu Verifikasi' : 'Histori Peminjaman'
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    const tanggal = new Date()
      .toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      .replace(/\//g, '-')
    XLSX.writeFile(wb, `peminjaman_${tab}_${tanggal}.xlsx`)
    showToast(`Berhasil export ${exportData.length} data ke Excel`, 'success')
  }
  // ───────────────────────────────────────────────────────────────────────────

  const filteredData = useMemo(() => {
    const byTab =
      tab === 'verifikasi'
        ? data.filter(d => d.status?.toLowerCase() === 'menunggu')
        : data.filter(d => d.status?.toLowerCase() !== 'menunggu')
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

  const formatTanggal = date =>
    date
      ? new Date(date).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : '-'
  const formatTanggalWaktu = date =>
    date
      ? new Date(date).toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : '-'
  const formatDateForInput = dateStr => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
    return date.toISOString().slice(0, 16)
  }

  const menungguCount = data.filter(d => d.status === 'menunggu').length

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
          {isAdmin ? 'Kelola Peminjaman' : 'Verifikasi Peminjaman'}
        </h1>
        <p className='text-sm text-gray-400 mt-0.5'>
          {isAdmin
            ? 'Kelola dan pantau semua peminjaman alat'
            : 'Setujui atau tolak permintaan peminjaman alat'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className='mb-5 grid grid-cols-2 md:grid-cols-4 gap-3'>
        {[
          { label: 'Total', value: data.length, cls: 'text-gray-900' },
          {
            label: 'Menunggu',
            value: data.filter(d => d.status === 'menunggu').length,
            cls: 'text-amber-500'
          },
          {
            label: 'Disetujui',
            value: data.filter(d => d.status === 'disetujui').length,
            cls: 'text-green-600'
          },
          {
            label: 'Ditolak',
            value: data.filter(d => d.status === 'ditolak').length,
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
              {menungguCount > 0 && (
                <span className='ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-white'>
                  {menungguCount}
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

        {/* Desktop Table */}
        <div className='hidden md:block overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-100 bg-gray-50/50'>
                {[
                  'Peminjam',
                  'Alat',
                  'Tgl Pinjam',
                  'Rencana Kembali',
                  'Status',
                  'Aksi'
                ].map(h => (
                  <th
                    key={h}
                    className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 ${
                      h === 'Aksi' ? 'text-center w-32' : 'text-left'
                    }`}
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
                    {[100, 120, 90, 90, 70, 80].map((w, j) => (
                      <td key={j} className='px-4 py-3'>
                        <div
                          className='h-3 bg-gray-100 rounded animate-pulse'
                          style={{ width: w }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan='6' className='px-5 py-12 text-center'>
                    <div className='flex flex-col items-center gap-2'>
                      <svg
                        width='48'
                        height='48'
                        fill='none'
                        stroke='#d1d5db'
                        strokeWidth='1'
                        viewBox='0 0 24 24'
                      >
                        <rect x='3' y='4' width='18' height='18' rx='2' />
                        <line x1='3' y1='10' x2='21' y2='10' />
                      </svg>
                      <p className='text-sm text-gray-400'>
                        {tab === 'verifikasi'
                          ? 'Tidak ada peminjaman yang menunggu'
                          : 'Belum ada histori peminjaman'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map(p => (
                  <React.Fragment key={p.id_peminjaman}>
                    <tr className='border-b border-gray-50 hover:bg-gray-50/50 transition-colors'>
                      <td className='px-4 py-2.5'>
                        <div>
                          <p className='font-medium text-gray-900 text-sm'>
                            {p.peminjam}
                          </p>
                          {p.durasi_hari > 7 && (
                            <p className='text-[10px] text-amber-500 mt-0.5'>
                              ⚠️ Durasi khusus {p.durasi_hari} hari
                            </p>
                          )}
                        </div>
                      </td>
                      <td className='px-4 py-2.5 text-sm text-gray-600'>
                        {p.alat}
                      </td>
                      <td className='px-4 py-2.5 text-xs text-gray-500'>
                        {formatTanggalWaktu(p.tgl_pinjam)}
                      </td>
                      <td className='px-4 py-2.5 text-xs text-gray-500'>
                        {formatTanggal(p.tgl_rencana_kembali)}
                      </td>
                      <td className='px-4 py-2.5'>
                        <StatusBadge status={p.status} />
                      </td>
                      <td className='px-4 py-2.5 text-center'>
                        {p.status === 'menunggu' ? (
                          <div className='flex items-center justify-center gap-2'>
                            <button
                              onClick={() =>
                                setConfirmData({
                                  id: p.id_peminjaman,
                                  status: 'disetujui'
                                })
                              }
                              className='px-3 py-1 rounded-md bg-green-50 text-green-600 text-xs font-medium hover:bg-green-100 transition-colors'
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
                              className='px-3 py-1 rounded-md bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 transition-colors'
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          p.status !== 'dipinjam' &&
                          p.status !== 'batal' && (
                            <button
                              onClick={() => setEditingDate(p)}
                              className='inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors'
                            >
                              ✏️ Ubah Tanggal
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                    {p.deskripsi && Number(p.durasi_hari) > 7 && (
                      <tr className='bg-amber-50/30'>
                        <td colSpan='6' className='px-4 pb-2 pt-0'>
                          <div className='text-xs text-amber-700'>
                            <span className='font-medium'>📝 Alasan:</span>{' '}
                            {p.deskripsi}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className='space-y-2 p-3 md:hidden'>
          {paginatedData.map(p => (
            <div
              key={p.id_peminjaman}
              className='rounded-lg border border-gray-100 bg-white p-3'
            >
              <div className='flex items-start justify-between mb-2'>
                <div>
                  <p className='font-semibold text-gray-900 text-sm'>
                    {p.alat}
                  </p>
                  <p className='text-xs text-gray-500'>{p.peminjam}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className='space-y-1 text-xs text-gray-500 mb-3'>
                <p>📅 Pinjam: {formatTanggalWaktu(p.tgl_pinjam)}</p>
                <p>📅 Rencana: {formatTanggal(p.tgl_rencana_kembali)}</p>
              </div>
              {p.deskripsi && Number(p.durasi_hari) > 7 && (
                <div className='mb-3 rounded-md bg-amber-50 px-2 py-1.5 text-[10px] text-amber-700'>
                  <span className='font-medium'>⚠️ Alasan:</span> {p.deskripsi}
                </div>
              )}
              {p.status === 'menunggu' && (
                <div className='flex gap-2'>
                  <button
                    onClick={() =>
                      setConfirmData({
                        id: p.id_peminjaman,
                        status: 'disetujui'
                      })
                    }
                    className='flex-1 rounded-md bg-green-50 py-1.5 text-xs font-medium text-green-600'
                  >
                    Setujui
                  </button>
                  <button
                    onClick={() =>
                      setConfirmData({ id: p.id_peminjaman, status: 'ditolak' })
                    }
                    className='flex-1 rounded-md bg-red-50 py-1.5 text-xs font-medium text-red-500'
                  >
                    Tolak
                  </button>
                </div>
              )}
            </div>
          ))}
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
              <div
                className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                  confirmData.status === 'disetujui'
                    ? 'bg-green-50'
                    : 'bg-red-50'
                }`}
              >
                {confirmData.status === 'disetujui' ? (
                  <svg
                    width='22'
                    height='22'
                    fill='none'
                    stroke='#16a34a'
                    strokeWidth='2'
                    viewBox='0 0 24 24'
                  >
                    <polyline points='20,6 9,17 4,12' />
                  </svg>
                ) : (
                  <svg
                    width='22'
                    height='22'
                    fill='none'
                    stroke='#ef4444'
                    strokeWidth='2'
                    viewBox='0 0 24 24'
                  >
                    <line x1='18' y1='6' x2='6' y2='18' />
                    <line x1='6' y1='6' x2='18' y2='18' />
                  </svg>
                )}
              </div>
              <h3 className='text-base font-semibold text-gray-900 mb-1'>
                {confirmData.status === 'disetujui'
                  ? 'Setujui Peminjaman?'
                  : 'Tolak Peminjaman?'}
              </h3>
              <p className='text-xs text-gray-500 mb-5'>
                {confirmData.status === 'disetujui'
                  ? 'Peminjam akan mendapat notifikasi persetujuan.'
                  : 'Peminjaman akan ditolak dan stok alat tidak akan berkurang.'}
              </p>
              <div className='flex gap-2'>
                <button
                  onClick={() => setConfirmData(null)}
                  className='flex-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50'
                >
                  Batal
                </button>
                <button
                  onClick={updateStatus}
                  disabled={submitting}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold text-white ${
                    confirmData.status === 'disetujui'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-500 hover:bg-red-600'
                  } disabled:opacity-60`}
                >
                  {submitting
                    ? 'Memproses...'
                    : confirmData.status === 'disetujui'
                    ? 'Ya, Setujui'
                    : 'Ya, Tolak'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Tanggal */}
      {editingDate && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-animate'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => setEditingDate(null)}
          />
          <div className='relative w-full max-w-md rounded-xl bg-white shadow-xl modal-animate'>
            <div className='border-b border-gray-100 px-5 py-4'>
              <h3 className='text-base font-semibold text-gray-900'>
                Ubah Tanggal Peminjaman
              </h3>
              <p className='text-xs text-gray-400 mt-0.5'>
                Sesuaikan tanggal pinjam dan rencana kembali
              </p>
            </div>
            <div className='p-5 space-y-4'>
              <div>
                <label className='mb-1 block text-xs font-medium text-gray-600'>
                  Tanggal & Waktu Pinjam
                </label>
                <input
                  type='datetime-local'
                  value={formatDateForInput(editingDate.tgl_pinjam)}
                  onChange={e =>
                    setEditingDate({
                      ...editingDate,
                      tgl_pinjam: e.target.value
                    })
                  }
                  className='w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-100'
                />
              </div>
              <div>
                <label className='mb-1 block text-xs font-medium text-gray-600'>
                  Rencana Tanggal Kembali
                </label>
                <input
                  type='date'
                  value={formatDateForInput(
                    editingDate.tgl_rencana_kembali
                  ).slice(0, 10)}
                  min={formatDateForInput(editingDate.tgl_pinjam).slice(0, 10)}
                  onChange={e =>
                    setEditingDate({
                      ...editingDate,
                      tgl_rencana_kembali: e.target.value + 'T23:59:59'
                    })
                  }
                  className='w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-100'
                />
                <p className='text-[10px] text-gray-400 mt-1'>
                  Tanggal kembali tidak boleh sebelum tanggal pinjam
                </p>
              </div>
            </div>
            <div className='flex gap-2 border-t border-gray-100 px-5 py-4'>
              <button
                onClick={() => setEditingDate(null)}
                className='flex-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50'
              >
                Batal
              </button>
              <button
                onClick={updateTanggal}
                disabled={submitting}
                className='flex-1 rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60'
              >
                {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
