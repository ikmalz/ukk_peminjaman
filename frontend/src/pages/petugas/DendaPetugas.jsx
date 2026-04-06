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
  const limit = 10

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
        d.peminjam.toLowerCase().includes(search.toLowerCase()) ||
        d.alat.toLowerCase().includes(search.toLowerCase())
    )
  }, [data, tab, search])

  const totalPage = Math.ceil(filteredData.length / limit)
  const paginatedData = filteredData.slice((page - 1) * limit, page * limit)
  useEffect(() => {
    setPage(1)
  }, [tab, search])

  const belumCount = data.filter(d => d.status_bayar === 'belum_bayar').length

  return (
    <div>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-[20px] font-bold tracking-tight text-gray-900'>
          Denda
        </h1>
        <p className='mt-0.5 text-sm text-gray-400'>
          Kelola pembayaran denda keterlambatan peminjaman
        </p>
      </div>

      <div className='rounded-xl border border-gray-200 bg-white overflow-hidden'>
        {/* Toolbar */}
        <div className='flex flex-col gap-3 border-b border-gray-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex gap-1'>
            {[
              { key: 'belum', label: 'Belum Lunas' },
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
                {t.key === 'belum' && belumCount > 0 && (
                  <span className='ml-1.5 rounded-full bg-red-400 px-1.5 py-0.5 text-[10px] font-bold text-white'>
                    {belumCount}
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

        {/* Table */}
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-gray-100 bg-gray-50'>
                {[
                  'Peminjam',
                  'Alat',
                  'Terlambat',
                  'Total Denda',
                  'Status',
                  'Aksi'
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
                    {[130, 120, 70, 100, 70, 90].map((w, j) => (
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
                    {tab === 'belum'
                      ? 'Tidak ada denda yang belum lunas'
                      : 'Belum ada histori'}
                  </td>
                </tr>
              ) : (
                paginatedData.map(d => (
                  <tr
                    key={d.id_denda}
                    className='border-b border-gray-50 last:border-0 hover:bg-gray-50 transition'
                  >
                    <td className='px-5 py-3.5 font-medium text-gray-900'>
                      {d.peminjam}
                    </td>
                    <td className='px-5 py-3.5 text-gray-600'>{d.alat}</td>
                    <td className='px-5 py-3.5'>
                      <span className='font-semibold text-red-500'>
                        {d.hari_terlambat}
                      </span>
                      <span className='text-gray-400'> hari</span>
                    </td>
                    <td className='px-5 py-3.5 font-semibold tabular-nums text-gray-900'>
                      {fmt(d.total_denda)}
                    </td>
                    <td className='px-5 py-3.5'>
                      {d.status_bayar === 'belum_bayar' ? (
                        <span className='inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-500'>
                          <span className='h-1.5 w-1.5 rounded-full bg-red-400' />{' '}
                          Belum Lunas
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-600'>
                          <span className='h-1.5 w-1.5 rounded-full bg-green-500' />{' '}
                          Lunas
                        </span>
                      )}
                    </td>
                    <td className='px-5 py-3.5'>
                      {d.status_bayar === 'belum_bayar' ? (
                        <button
                          onClick={() => setConfirmId(d.id_denda)}
                          className='text-xs font-semibold text-blue-600 hover:text-blue-800 transition'
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
      {confirmId && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]'>
          <div className='w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl'>
            <div className='mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-green-50'>
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
            </div>
            <h3 className='mb-1 text-[15px] font-bold text-gray-900'>
              Tandai Lunas?
            </h3>
            <p className='mb-5 text-sm text-gray-400'>
              Denda ini akan ditandai sebagai{' '}
              <span className='font-semibold text-gray-700'>LUNAS</span> dan
              tidak bisa diubah kembali.
            </p>
            <div className='flex justify-end gap-2'>
              <button
                onClick={() => setConfirmId(null)}
                className='rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition'
              >
                Batal
              </button>
              <button
                onClick={bayarDenda}
                className='rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 transition'
              >
                Ya, Lunas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
