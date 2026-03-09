import { useEffect, useMemo, useState } from 'react'
import api from '../../lib/api'

export default function DendaPetugas () {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('belum')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  const [confirmId, setConfirmId] = useState(null)

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

  /* TAB + SEARCH */
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

  /* PAGINATION */
  const totalPage = Math.ceil(filteredData.length / limit)
  const paginatedData = filteredData.slice((page - 1) * limit, page * limit)

  useEffect(() => {
    setPage(1)
  }, [tab, search])

  return (
    <div className='space-y-6'>
      {/* HEADER */}
      <div>
        <h1 className='text-xl md:text-2xl font-semibold text-slate-800'>
          Data Denda
        </h1>
        <p className='text-sm text-slate-500'>
          Kelola pembayaran denda keterlambatan peminjaman
        </p>
      </div>

      {/* TAB */}
      <div className='flex gap-2 border-b border-slate-200'>
        <button
          onClick={() => setTab('belum')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            tab === 'belum'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Belum Lunas
        </button>
        <button
          onClick={() => setTab('histori')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            tab === 'histori'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Histori
        </button>
      </div>

      {/* SEARCH */}
      <input
        placeholder='Cari peminjam / alat...'
        value={search}
        onChange={e => setSearch(e.target.value)}
        className='w-full md:w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500'
      />

      {/* TABLE */}
      <div className='bg-white rounded-xl border border-slate-200 overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead className='bg-slate-100 text-slate-600'>
            <tr>
              <th className='px-4 py-3 text-left font-medium'>Peminjam</th>
              <th className='px-4 py-3 text-left font-medium'>Alat</th>
              <th className='px-4 py-3 text-left font-medium'>Total Denda</th>
              <th className='px-4 py-3 text-left font-medium'>Terlambat</th>
              <th className='px-4 py-3 text-left font-medium'>Status</th>
              <th className='px-4 py-3 text-left font-medium'>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan='6'
                  className='px-4 py-6 text-center text-slate-500'
                >
                  Memuat data...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan='6'
                  className='px-4 py-6 text-center text-slate-500'
                >
                  Data tidak ditemukan
                </td>
              </tr>
            ) : (
              paginatedData.map(d => (
                <tr key={d.id_denda} className='border-t hover:bg-slate-50'>
                  <td className='px-4 py-3'>{d.peminjam}</td>
                  <td className='px-4 py-3'>{d.alat}</td>
                  <td className='px-4 py-3 font-medium'>
                    Rp {d.total_denda.toLocaleString('id-ID')}
                  </td>
                  <td className='px-4 py-3'>{d.hari_terlambat} hari</td>
                  <td className='px-4 py-3'>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        d.status_bayar === 'belum_bayar'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {d.status_bayar === 'belum_bayar'
                        ? 'Belum Lunas'
                        : 'Lunas'}
                    </span>
                  </td>
                  <td className='px-4 py-3'>
                    {d.status_bayar === 'belum_bayar' ? (
                      <button
                        onClick={() => setConfirmId(d.id_denda)}
                        className='text-blue-600 hover:underline text-xs font-medium'
                      >
                        Tandai Lunas
                      </button>
                    ) : (
                      <span className='text-xs text-slate-400'>Selesai</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPage > 1 && (
        <div className='flex justify-end items-center gap-2'>
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className='px-3 py-1 rounded border text-sm disabled:opacity-50'
          >
            Prev
          </button>
          <span className='text-sm text-slate-600'>
            Page {page} of {totalPage}
          </span>
          <button
            disabled={page === totalPage}
            onClick={() => setPage(p => p + 1)}
            className='px-3 py-1 rounded border text-sm disabled:opacity-50'
          >
            Next
          </button>
        </div>
      )}

      {/* MODAL */}
      {confirmId && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
          <div className='bg-white rounded-xl p-6 w-full max-w-sm'>
            <h3 className='text-sm font-semibold text-slate-800 mb-2'>
              Konfirmasi Pembayaran
            </h3>
            <p className='text-sm text-slate-600 mb-4'>
              Tandai denda ini sebagai{' '}
              <span className='font-medium'>LUNAS</span>?
            </p>
            <div className='flex justify-end gap-2'>
              <button
                onClick={() => setConfirmId(null)}
                className='rounded-lg bg-slate-200 px-4 py-2 text-sm'
              >
                Batal
              </button>
              <button
                onClick={bayarDenda}
                className='rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700'
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
