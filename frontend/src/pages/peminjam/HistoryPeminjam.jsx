// HistoryPeminjam.jsx - Versi dengan Pagination
import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import Toast from '../../components/Toast'

const ITEMS_PER_PAGE = 10

export default function HistoryPeminjam () {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [filter, setFilter] = useState('semua')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await api.get('/peminjaman/history')
      setHistory(res.data.data || res.data || [])
    } catch (err) {
      console.error(err)
      setToast({ message: 'Gagal memuat riwayat', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  // Reset ke halaman 1 saat filter atau search berubah
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, search])

  const viewStruk = id => {
    navigate(`/peminjam/struk/${id}`)
  }

  const getStatusConfig = (status, statusPengambilan) => {
    if (status === 'batal') {
      return {
        label: 'Dibatalkan',
        cls: 'bg-red-50 text-red-600 border-red-100',
        dot: 'bg-red-500'
      }
    }
    if (status === 'dipinjam' && statusPengambilan === 'sudah_diambil') {
      return {
        label: 'Sedang Dipinjam',
        cls: 'bg-green-50 text-green-600 border-green-100',
        dot: 'bg-green-500'
      }
    }
    if (status === 'disetujui') {
      return {
        label: 'Disetujui',
        cls: 'bg-blue-50 text-blue-600 border-blue-100',
        dot: 'bg-blue-500'
      }
    }
    if (status === 'menunggu') {
      return {
        label: 'Menunggu',
        cls: 'bg-amber-50 text-amber-600 border-amber-100',
        dot: 'bg-amber-500'
      }
    }
    if (status === 'ditolak') {
      return {
        label: 'Ditolak',
        cls: 'bg-red-50 text-red-600 border-red-100',
        dot: 'bg-red-500'
      }
    }
    if (status === 'dikembalikan') {
      return {
        label: 'Dikembalikan',
        cls: 'bg-gray-50 text-gray-600 border-gray-100',
        dot: 'bg-gray-500'
      }
    }
    return {
      label: status,
      cls: 'bg-gray-50 text-gray-500 border-gray-100',
      dot: 'bg-gray-400'
    }
  }

  // Filter berdasarkan status
  const filteredByStatus = useMemo(() => {
    if (filter === 'semua') return history
    if (filter === 'aktif') {
      return history.filter(
        item => item.status === 'dipinjam' || item.status === 'disetujui'
      )
    }
    if (filter === 'selesai') {
      return history.filter(
        item =>
          item.status === 'dikembalikan' ||
          item.status === 'ditolak' ||
          item.status === 'batal'
      )
    }
    return history
  }, [history, filter])

  // Filter berdasarkan search
  const filteredData = useMemo(() => {
    if (!search.trim()) return filteredByStatus
    return filteredByStatus.filter(item =>
      item.alat?.toLowerCase().includes(search.toLowerCase())
    )
  }, [filteredByStatus, search])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const stats = {
    total: history.length,
    aktif: history.filter(
      i => i.status === 'dipinjam' || i.status === 'disetujui'
    ).length,
    selesai: history.filter(
      i =>
        i.status === 'dikembalikan' ||
        i.status === 'ditolak' ||
        i.status === 'batal'
    ).length
  }

  const formatDate = date => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const resetFilter = () => {
    setFilter('semua')
    setSearch('')
    setCurrentPage(1)
  }

  const goToPage = page => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className='space-y-5'>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={4000}
        />
      )}

      {/* Header */}
      <div>
        <h1 className='text-lg font-semibold tracking-tight text-gray-900'>
          Riwayat Peminjaman
        </h1>
        <p className='text-sm text-gray-400 mt-0.5'>
          Semua riwayat peminjaman dan pengembalian Anda
        </p>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-3 gap-3'>
        <div
          onClick={() => setFilter('semua')}
          className={`rounded-lg border p-3 shadow-sm transition-all cursor-pointer ${
            filter === 'semua'
              ? 'border-gray-300 bg-gray-50'
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <p className='text-[9px] font-medium text-gray-400 uppercase tracking-wider'>
            Total
          </p>
          <p className='text-xl font-bold text-gray-900 mt-0.5'>
            {stats.total}
          </p>
        </div>
        <div
          onClick={() => setFilter('aktif')}
          className={`rounded-lg border p-3 shadow-sm transition-all cursor-pointer ${
            filter === 'aktif'
              ? 'border-blue-300 bg-blue-50'
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <p className='text-[9px] font-medium text-gray-400 uppercase tracking-wider'>
            Aktif
          </p>
          <p className='text-xl font-bold text-blue-600 mt-0.5'>
            {stats.aktif}
          </p>
        </div>
        <div
          onClick={() => setFilter('selesai')}
          className={`rounded-lg border p-3 shadow-sm transition-all cursor-pointer ${
            filter === 'selesai'
              ? 'border-green-300 bg-green-50'
              : 'border-gray-100 bg-white hover:border-gray-200'
          }`}
        >
          <p className='text-[9px] font-medium text-gray-400 uppercase tracking-wider'>
            Selesai
          </p>
          <p className='text-xl font-bold text-green-600 mt-0.5'>
            {stats.selesai}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className='relative'>
        <svg
          className='absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.5'
          viewBox='0 0 24 24'
        >
          <circle cx='11' cy='11' r='8' />
          <line x1='21' y1='21' x2='16.65' y2='16.65' />
        </svg>
        <input
          type='text'
          placeholder='Cari berdasarkan nama alat...'
          value={search}
          onChange={e => setSearch(e.target.value)}
          className='w-full rounded-md border border-gray-200 bg-white py-1.5 pl-8 pr-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-100'
        />
        {(search || filter !== 'semua') && (
          <button
            onClick={resetFilter}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600'
          >
            Reset
          </button>
        )}
      </div>

      {/* Result Info */}
      {!loading && filteredData.length > 0 && (
        <div className='flex justify-between items-center'>
          <p className='text-[10px] text-gray-400'>
            Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} dari{' '}
            {filteredData.length} riwayat
            {search && ` untuk pencarian "${search}"`}
          </p>
          {totalPages > 1 && (
            <p className='text-[10px] text-gray-400'>
              Halaman {currentPage} dari {totalPages}
            </p>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className='flex justify-center py-12'>
          <div className='flex flex-col items-center gap-2'>
            <div className='h-8 w-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin' />
            <p className='text-xs text-gray-400'>Memuat riwayat...</p>
          </div>
        </div>
      ) : filteredData.length === 0 ? (
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
              <path d='M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2' />
              <rect x='9' y='3' width='6' height='4' rx='1' />
              <line x1='9' y1='12' x2='15' y2='12' />
              <line x1='9' y1='16' x2='13' y2='16' />
            </svg>
            <p className='text-sm text-gray-400'>
              {search
                ? `Tidak ada riwayat dengan alat "${search}"`
                : filter === 'semua'
                ? 'Belum ada riwayat peminjaman'
                : filter === 'aktif'
                ? 'Tidak ada peminjaman aktif'
                : 'Tidak ada riwayat selesai'}
            </p>
            {(search || filter !== 'semua') && (
              <button
                onClick={resetFilter}
                className='text-xs text-blue-500 hover:text-blue-600'
              >
                Lihat semua riwayat
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className='space-y-3'>
            {paginatedData.map(item => {
              const statusConfig = getStatusConfig(
                item.status,
                item.status_pengambilan
              )
              const isActive =
                item.status === 'dipinjam' || item.status === 'disetujui'

              return (
                <div
                  key={item.id_peminjaman}
                  className='rounded-lg border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-200'
                >
                  <div className='p-4'>
                    <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2'>
                      <div>
                        <h3 className='text-sm font-semibold text-gray-900'>
                          {item.alat}
                        </h3>
                        <div className='flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-500'>
                          <span>
                            📅 {formatDate(item.tgl_pinjam)} —{' '}
                            {formatDate(item.tgl_rencana_kembali)}
                          </span>
                          <span>📦 {item.jumlah} unit</span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusConfig.cls}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`}
                        />
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Status Pengambilan */}
                    {item.status === 'disetujui' && (
                      <div className='mt-3 flex items-center gap-2'>
                        <span className='text-[10px] text-gray-400'>
                          Status Pengambilan:
                        </span>
                        <span
                          className={`text-[10px] font-medium ${
                            item.status_pengambilan === 'sudah_diambil'
                              ? 'text-green-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {item.status_pengambilan === 'sudah_diambil'
                            ? '✓ Sudah Diambil'
                            : '⏳ Belum Diambil'}
                        </span>
                      </div>
                    )}

                    {item.kode_unit && (
                      <div className='mt-2'>
                        <span className='text-[10px] text-gray-400'>
                          Kode Unit:
                        </span>
                        <span className='ml-1 text-[10px] font-mono text-gray-600'>
                          {item.kode_unit}
                        </span>
                      </div>
                    )}

                    {/* Keterangan Batal */}
                    {item.keterangan_batal && (
                      <div className='mt-3 rounded-md bg-red-50 border border-red-100 px-3 py-1.5'>
                        <p className='text-[10px] text-red-600'>
                          {item.keterangan_batal}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className='mt-4 flex gap-2'>
                      <button
                        onClick={() => viewStruk(item.id_peminjaman)}
                        className='flex-1 rounded-md bg-gray-900 py-3 text-xs font-medium text-white hover:bg-gray-800 transition-colors'
                      >
                        Lihat Struk
                      </button>
                      {isActive &&
                        item.status !== 'dikembalikan' &&
                        item.status_pengambilan !== 'sudah_diambil' && (
                          <button
                            onClick={() => navigate('/peminjam/kembali')}
                            className='flex-1 rounded-md border border-gray-200 bg-white py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors'
                          >
                            Ajukan Pengembalian
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination Component */}
          {totalPages > 1 && (
            <div className='flex items-center justify-center gap-1 pt-2 pb-4'>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                ← Sebelumnya
              </button>

              <div className='flex gap-1'>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-gray-900 text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Selanjutnya →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
