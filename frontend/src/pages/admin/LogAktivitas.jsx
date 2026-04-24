import { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'

const LogAktivitas = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('token')

      if (!token) {
        setError('Token tidak ditemukan. Silakan login kembali.')
        return
      }

      const res = await axios.get('/api/log', {
        headers: { Authorization: `Bearer ${token}` }
      })

      setLogs(res.data)
    } catch (err) {
      console.error('Error fetching logs:', err.response?.data || err.message)
      if (err.response?.status === 401) {
        setError('Sesi login telah berakhir. Silakan login kembali.')
      } else {
        setError(err.response?.data?.message || 'Gagal memuat log aktivitas')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter(
    log =>
      log.user?.toLowerCase().includes(search.toLowerCase()) ||
      log.aktivitas?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPage = Math.ceil(filteredLogs.length / limit)
  const paginatedLogs = filteredLogs.slice((page - 1) * limit, page * limit)

  useEffect(() => {
    setPage(1)
  }, [search])

  const resetFilter = () => {
    setSearch('')
    setPage(1)
  }

  const formatWaktu = waktu => {
    return format(new Date(waktu), 'dd MMM yyyy • HH:mm')
  }

  const getActivityIcon = aktivitas => {
    if (aktivitas?.includes('login')) return '🔐'
    if (aktivitas?.includes('logout')) return '🚪'
    if (aktivitas?.includes('tambah') || aktivitas?.includes('create'))
      return '➕'
    if (aktivitas?.includes('edit') || aktivitas?.includes('update'))
      return '✏️'
    if (aktivitas?.includes('hapus') || aktivitas?.includes('delete'))
      return '🗑️'
    if (aktivitas?.includes('verifikasi')) return '✅'
    if (aktivitas?.includes('denda')) return '💰'
    if (aktivitas?.includes('peminjaman')) return '📋'
    if (aktivitas?.includes('pengembalian')) return '🔄'
    return '📌'
  }

  const getActivityBadgeClass = aktivitas => {
    if (aktivitas?.includes('login'))
      return 'bg-blue-50 text-blue-600 border-blue-100'
    if (aktivitas?.includes('logout'))
      return 'bg-gray-50 text-gray-500 border-gray-100'
    if (aktivitas?.includes('tambah') || aktivitas?.includes('create'))
      return 'bg-green-50 text-green-600 border-green-100'
    if (aktivitas?.includes('edit') || aktivitas?.includes('update'))
      return 'bg-amber-50 text-amber-600 border-amber-100'
    if (aktivitas?.includes('hapus') || aktivitas?.includes('delete'))
      return 'bg-red-50 text-red-600 border-red-100'
    if (aktivitas?.includes('verifikasi'))
      return 'bg-purple-50 text-purple-600 border-purple-100'
    if (aktivitas?.includes('denda'))
      return 'bg-orange-50 text-orange-600 border-orange-100'
    return 'bg-gray-50 text-gray-500 border-gray-100'
  }

  return (
    <div>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-animate {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>

      {/* Header */}
      <div className='mb-5'>
        <h1 className='text-lg font-semibold tracking-tight text-gray-900'>
          Log Aktivitas
        </h1>
        <p className='text-sm text-gray-400 mt-0.5'>
          Riwayat seluruh aktivitas yang terjadi dalam sistem
        </p>
      </div>

      {/* Stats Cards */}
      <div className='mb-5 grid grid-cols-2 md:grid-cols-4 gap-3'>
        <div className='rounded-lg border border-gray-100 bg-white p-3 shadow-sm'>
          <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider'>
            Total Aktivitas
          </p>
          <p className='text-xl font-bold text-gray-900 mt-1'>{logs.length}</p>
        </div>
        <div className='rounded-lg border border-gray-100 bg-white p-3 shadow-sm'>
          <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider'>
            Hari Ini
          </p>
          <p className='text-xl font-bold text-blue-600 mt-1'>
            {
              logs.filter(
                log =>
                  new Date(log.waktu).toDateString() ===
                  new Date().toDateString()
              ).length
            }
          </p>
        </div>
        <div className='rounded-lg border border-gray-100 bg-white p-3 shadow-sm'>
          <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider'>
            Minggu Ini
          </p>
          <p className='text-xl font-bold text-green-600 mt-1'>
            {
              logs.filter(log => {
                const now = new Date()
                const logDate = new Date(log.waktu)
                const weekAgo = new Date(now.setDate(now.getDate() - 7))
                return logDate >= weekAgo
              }).length
            }
          </p>
        </div>
        <div className='rounded-lg border border-gray-100 bg-white p-3 shadow-sm'>
          <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider'>
            Bulan Ini
          </p>
          <p className='text-xl font-bold text-amber-600 mt-1'>
            {
              logs.filter(log => {
                const now = new Date()
                const logDate = new Date(log.waktu)
                return (
                  logDate.getMonth() === now.getMonth() &&
                  logDate.getFullYear() === now.getFullYear()
                )
              }).length
            }
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className='rounded-lg border border-gray-100 bg-white overflow-hidden shadow-sm'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 px-4 py-2.5'>
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
              placeholder='Cari user atau aktivitas...'
              value={search}
              onChange={e => setSearch(e.target.value)}
              className='w-full rounded-md border border-gray-200 bg-white py-1.5 pl-8 pr-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-100'
            />
          </div>
          <div className='flex gap-2'>
            {search && (
              <button
                onClick={resetFilter}
                className='px-2.5 py-1.5 rounded-md border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors'
              >
                Reset
              </button>
            )}
            <button
              onClick={fetchLogs}
              className='flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors'
            >
              <svg
                width='12'
                height='12'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                viewBox='0 0 24 24'
              >
                <path d='M23 4v6h-6' />
                <path d='M1 20v-6h6' />
                <path d='M3.51 9a9 9 0 0 1 14.85-3.36L23 10' />
                <path d='M20.49 15a9 9 0 0 1-14.85 3.36L1 14' />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className='p-8 text-center'>
            <div className='inline-flex items-center gap-2 text-gray-400'>
              <svg
                className='animate-spin h-5 w-5'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                />
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                />
              </svg>
              <span className='text-sm'>Memuat log aktivitas...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className='mx-4 mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600 border border-red-100'>
            {error}
          </div>
        )}

        {/* Table Desktop */}
        {!loading && !error && (
          <>
            <div className='hidden md:block overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-gray-100 bg-gray-50/50'>
                    <th className='px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 w-36'>
                      Waktu
                    </th>
                    <th className='px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 w-36'>
                      User
                    </th>
                    <th className='px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400'>
                      Aktivitas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.length === 0 ? (
                    <tr>
                      <td colSpan='3' className='px-5 py-12 text-center'>
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
                            {search
                              ? 'Tidak ada log yang sesuai pencarian'
                              : 'Belum ada aktivitas yang tercatat'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((log, index) => (
                      <tr
                        key={log.id_log}
                        className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${
                          index < paginatedLogs.length - 1
                            ? 'border-b border-gray-50'
                            : ''
                        }`}
                      >
                        <td className='px-4 py-2.5'>
                          <div className='flex items-center gap-1.5'>
                            <svg
                              width='10'
                              height='10'
                              fill='none'
                              stroke='#9ca3af'
                              strokeWidth='2'
                              viewBox='0 0 24 24'
                            >
                              <circle cx='12' cy='12' r='10' />
                              <polyline points='12 6 12 12 16 14' />
                            </svg>
                            <span className='text-xs text-gray-500 font-mono'>
                              {formatWaktu(log.waktu)}
                            </span>
                          </div>
                        </td>
                        <td className='px-4 py-2.5'>
                          <div className='flex items-center gap-2'>
                            <div className='flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-600'>
                              {log.user?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className='text-sm font-medium text-gray-700'>
                              {log.user}
                            </span>
                          </div>
                        </td>
                        <td className='px-4 py-2.5'>
                          <div className='flex items-center gap-2'>
                            <span className='text-base'>
                              {getActivityIcon(log.aktivitas)}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${getActivityBadgeClass(
                                log.aktivitas
                              )}`}
                            >
                              {log.aktivitas}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className='space-y-2 p-3 md:hidden'>
              {paginatedLogs.length === 0 ? (
                <div className='py-8 text-center'>
                  <p className='text-sm text-gray-400'>
                    {search
                      ? 'Tidak ada log yang sesuai'
                      : 'Belum ada aktivitas'}
                  </p>
                </div>
              ) : (
                paginatedLogs.map(log => (
                  <div
                    key={log.id_log}
                    className='rounded-lg border border-gray-100 bg-white p-3 slide-animate'
                  >
                    <div className='flex items-start justify-between mb-2'>
                      <div className='flex items-center gap-2'>
                        <div className='flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-600'>
                          {log.user?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className='font-medium text-gray-900 text-sm'>
                            {log.user}
                          </p>
                          <p className='text-[10px] text-gray-400 flex items-center gap-1'>
                            <svg
                              width='8'
                              height='8'
                              fill='none'
                              stroke='currentColor'
                              strokeWidth='2'
                              viewBox='0 0 24 24'
                            >
                              <circle cx='12' cy='12' r='10' />
                              <polyline points='12 6 12 12 16 14' />
                            </svg>
                            {formatWaktu(log.waktu)}
                          </p>
                        </div>
                      </div>
                      <span className='text-base'>
                        {getActivityIcon(log.aktivitas)}
                      </span>
                    </div>
                    <div className='mt-2'>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-medium ${getActivityBadgeClass(
                          log.aktivitas
                        )}`}
                      >
                        {log.aktivitas}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPage > 1 && (
              <div className='flex items-center justify-between border-t border-gray-100 px-4 py-2.5'>
                <span className='text-[10px] text-gray-400'>
                  {(page - 1) * limit + 1}–
                  {Math.min(page * limit, filteredLogs.length)} dari{' '}
                  {filteredLogs.length}
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
          </>
        )}
      </div>
    </div>
  )
}

export default LogAktivitas
