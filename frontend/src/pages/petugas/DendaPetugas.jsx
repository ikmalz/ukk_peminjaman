// DendaPetugas.jsx - Versi Modern Minimalis
import { useEffect, useMemo, useState } from 'react'
import api from '../../lib/api'

const fmt = n => 'Rp ' + Number(n).toLocaleString('id-ID')

export default function DendaPetugas () {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('belum')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [confirmId, setConfirmId] = useState(null)
  const limit = 8

  const fetchDenda = async () => {
    setLoading(true)
    try {
      const res = await api.get('/denda')
      setData(res.data.data)
    } catch {
      alert('Gagal mengambil data denda')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDenda()
  }, [])

  const bayarDenda = async () => {
    try {
      await api.put(`/denda/${confirmId}/bayar`)
      setConfirmId(null)
      fetchDenda()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membayar denda')
    }
  }

  const filteredData = useMemo(() => {
    const byTab =
      tab === 'belum'
        ? data.filter(d => d.status_bayar === 'belum_bayar')
        : data.filter(d => d.status_bayar !== 'belum_bayar')
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

  const belumCount = data.filter(d => d.status_bayar === 'belum_bayar').length
  const totalDendaBelum = data
    .filter(d => d.status_bayar === 'belum_bayar')
    .reduce((sum, d) => sum + (d.total_denda || 0), 0)

  return (
    <div>
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes backdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-animate { animation: modalFadeIn 0.2s ease-out; }
        .backdrop-animate { animation: backdropFade 0.15s ease-out; }
      `}</style>

      {/* Header */}
      <div className='mb-5'>
        <h1 className='text-lg font-semibold tracking-tight text-gray-900'>
          Kelola Denda
        </h1>
        <p className='text-sm text-gray-400 mt-0.5'>
          Kelola pembayaran denda keterlambatan pengembalian alat
        </p>
      </div>

      {/* Stats Cards */}
      <div className='mb-5 grid grid-cols-2 md:grid-cols-4 gap-3'>
        <div className='rounded-lg border border-gray-100 bg-white p-3 shadow-sm'>
          <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider'>
            Total Denda
          </p>
          <p className='text-xl font-bold text-gray-900 mt-1'>{data.length}</p>
        </div>
        <div className='rounded-lg border border-gray-100 bg-white p-3 shadow-sm'>
          <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider'>
            Belum Lunas
          </p>
          <p className='text-xl font-bold text-red-500 mt-1'>{belumCount}</p>
        </div>
        <div className='rounded-lg border border-gray-100 bg-white p-3 shadow-sm'>
          <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider'>
            Lunas
          </p>
          <p className='text-xl font-bold text-green-600 mt-1'>
            {data.filter(d => d.status_bayar !== 'belum_bayar').length}
          </p>
        </div>
        <div className='rounded-lg border border-gray-100 bg-white p-3 shadow-sm'>
          <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider'>
            Total Nominal
          </p>
          <p className='text-lg font-bold text-amber-600 mt-1 truncate'>
            {fmt(totalDendaBelum)}
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className='rounded-lg border border-gray-100 bg-white overflow-hidden shadow-sm'>
        {/* Tabs & Search */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 px-4 py-2.5'>
          <div className='flex gap-1'>
            <button
              onClick={() => setTab('belum')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                tab === 'belum'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              Belum Lunas
              {belumCount > 0 && (
                <span className='ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-400 text-[9px] font-bold text-white'>
                  {belumCount}
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
              Histori Lunas
            </button>
          </div>
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
              className='w-full sm:w-56 rounded-md border border-gray-200 bg-white py-1.5 pl-8 pr-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-100'
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className='hidden md:block overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-100 bg-gray-50/50'>
                <th className='px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400'>
                  Peminjam
                </th>
                <th className='px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400'>
                  Alat
                </th>
                <th className='px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400'>
                  Terlambat
                </th>
                <th className='px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400'>
                  Total Denda
                </th>
                <th className='px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400'>
                  Status
                </th>
                <th className='px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 w-24'>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className='border-b border-gray-50'>
                    {[100, 120, 60, 90, 80, 70].map((w, j) => (
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
                        <circle cx='12' cy='12' r='10' />
                        <line x1='12' y1='8' x2='12' y2='12' />
                        <line x1='12' y1='16' x2='12.01' y2='16' />
                      </svg>
                      <p className='text-sm text-gray-400'>
                        {tab === 'belum'
                          ? 'Tidak ada denda yang belum lunas'
                          : 'Belum ada histori pembayaran denda'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map(d => (
                  <tr
                    key={d.id_denda}
                    className='border-b border-gray-50 hover:bg-gray-50/50 transition-colors'
                  >
                    <td className='px-4 py-2.5'>
                      <div>
                        <p className='font-medium text-gray-900 text-sm'>
                          {d.peminjam}
                        </p>
                        {d.tgl_jatuh_tempo && (
                          <p className='text-[10px] text-gray-400 mt-0.5'>
                            Jatuh tempo:{' '}
                            {new Date(d.tgl_jatuh_tempo).toLocaleDateString(
                              'id-ID'
                            )}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className='px-4 py-2.5 text-sm text-gray-600'>
                      {d.alat}
                    </td>
                    <td className='px-4 py-2.5'>
                      <span className='inline-flex items-center gap-1 font-semibold text-red-500'>
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
                        {d.hari_terlambat} hari
                      </span>
                    </td>
                    <td className='px-4 py-2.5'>
                      <span className='font-semibold text-gray-900 text-sm'>
                        {fmt(d.total_denda)}
                      </span>
                    </td>
                    <td className='px-4 py-2.5'>
                      {d.status_bayar === 'belum_bayar' ? (
                        <span className='inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-medium text-red-600 border border-red-100'>
                          <span className='h-1.5 w-1.5 rounded-full bg-red-500' />
                          Belum Lunas
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-medium text-green-600 border border-green-100'>
                          <span className='h-1.5 w-1.5 rounded-full bg-green-500' />
                          Lunas
                        </span>
                      )}
                    </td>
                    <td className='px-4 py-2.5 text-center'>
                      {d.status_bayar === 'belum_bayar' ? (
                        <button
                          onClick={() => setConfirmId(d.id_denda)}
                          className='px-3 py-1 rounded-md bg-green-50 text-green-600 text-[10px] font-medium hover:bg-green-100 transition-colors'
                        >
                          Tandai Lunas
                        </button>
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

        {/* Mobile Cards */}
        <div className='space-y-2 p-3 md:hidden'>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className='rounded-lg border border-gray-100 bg-white p-3'
              >
                <div className='h-4 w-32 bg-gray-100 rounded animate-pulse mb-2' />
                <div className='h-3 w-48 bg-gray-50 rounded animate-pulse mb-2' />
                <div className='h-3 w-24 bg-gray-50 rounded animate-pulse' />
              </div>
            ))
          ) : paginatedData.length === 0 ? (
            <div className='py-8 text-center'>
              <p className='text-sm text-gray-400'>
                {tab === 'belum' ? 'Tidak ada denda' : 'Belum ada histori'}
              </p>
            </div>
          ) : (
            paginatedData.map(d => (
              <div
                key={d.id_denda}
                className='rounded-lg border border-gray-100 bg-white p-3'
              >
                <div className='flex items-start justify-between mb-2'>
                  <div>
                    <p className='font-semibold text-gray-900 text-sm'>
                      {d.alat}
                    </p>
                    <p className='text-xs text-gray-500'>{d.peminjam}</p>
                  </div>
                  {d.status_bayar === 'belum_bayar' ? (
                    <span className='inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-medium text-red-600'>
                      <span className='h-1 w-1 rounded-full bg-red-500' />
                      Belum Lunas
                    </span>
                  ) : (
                    <span className='inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-medium text-green-600'>
                      <span className='h-1 w-1 rounded-full bg-green-500' />
                      Lunas
                    </span>
                  )}
                </div>
                <div className='flex justify-between items-center mt-2'>
                  <div>
                    <p className='text-xs text-gray-500'>Terlambat</p>
                    <p className='text-sm font-semibold text-red-500'>
                      {d.hari_terlambat} hari
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-xs text-gray-500'>Total Denda</p>
                    <p className='text-sm font-bold text-gray-900'>
                      {fmt(d.total_denda)}
                    </p>
                  </div>
                </div>
                {d.status_bayar === 'belum_bayar' && (
                  <button
                    onClick={() => setConfirmId(d.id_denda)}
                    className='mt-3 w-full rounded-md bg-green-50 py-1.5 text-xs font-medium text-green-600 hover:bg-green-100 transition-colors'
                  >
                    Tandai Lunas
                  </button>
                )}
              </div>
            ))
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
      {confirmId && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-animate'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => setConfirmId(null)}
          />
          <div className='relative w-full max-w-sm rounded-xl bg-white shadow-xl modal-animate'>
            <div className='p-5 text-center'>
              <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50'>
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
              </div>
              <h3 className='text-base font-semibold text-gray-900 mb-1'>
                Tandai Lunas?
              </h3>
              <p className='text-xs text-gray-500 mb-5'>
                Denda ini akan ditandai sebagai{' '}
                <span className='font-semibold text-green-600'>LUNAS</span> dan
                tidak dapat diubah kembali.
              </p>
              <div className='flex gap-2'>
                <button
                  onClick={() => setConfirmId(null)}
                  className='flex-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors'
                >
                  Batal
                </button>
                <button
                  onClick={bayarDenda}
                  className='flex-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors'
                >
                  Ya, Lunas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
