import { useEffect, useMemo, useState } from 'react'
import api from '../../lib/api'

export default function VerifikasiPengembalian () {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('verifikasi')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 5

  const [kondisi, setKondisi] = useState({})
  const [confirmData, setConfirmData] = useState(null)

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

  const verifikasi = async () => {
    try {
      await api.patch(`/pengembalian/${confirmData.id}/verifikasi`, {
        kondisi_final: kondisi[confirmData.id] || 'normal'
      })
      setConfirmData(null)
      fetchData()
    } catch {
      alert('Gagal verifikasi')
    }
  }

  const terlambatInfo = (jatuhTempo, kembali) => {
    const due = new Date(jatuhTempo)
    const back = new Date(kembali)
    const diff = Math.ceil((back - due) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }

  const formatDate = d =>
    new Date(d).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })

  /* TAB + SEARCH */
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
          Verifikasi Pengembalian
        </h1>
        <p className='text-sm text-slate-500'>
          Verifikasi kondisi alat setelah dikembalikan
        </p>
      </div>

      {/* TAB */}
      <div className='flex gap-2 border-b border-slate-200'>
        <button
          onClick={() => setTab('verifikasi')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            tab === 'verifikasi'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Menunggu Verifikasi
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

      {error && (
        <div className='rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700'>
          {error}
        </div>
      )}

      {/* LIST */}
      {loading ? (
        <p className='text-slate-500'>Memuat data...</p>
      ) : paginatedData.length === 0 ? (
        <p className='text-slate-500'>Data tidak ditemukan</p>
      ) : (
        <div className='grid gap-4'>
          {paginatedData.map(p => {
            const terlambat = terlambatInfo(p.tgl_jatuh_tempo, p.tgl_kembali)

            return (
              <div
                key={p.id_pengembalian}
                className='bg-white border border-slate-200 rounded-xl p-5'
              >
                <div className='flex justify-between items-start'>
                  <div>
                    <h2 className='text-base font-semibold text-slate-800'>
                      {p.alat}
                    </h2>
                    <p className='text-sm text-slate-500'>
                      Peminjam: {p.peminjam}
                    </p>
                    <p className='text-sm text-slate-500'>
                      Dikembalikan: {formatDate(p.tgl_kembali)}
                    </p>
                    {terlambat > 0 && (
                      <p className='mt-1 text-sm font-medium text-red-600'>
                        ⚠ Terlambat {terlambat} hari
                      </p>
                    )}
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      p.status_verifikasi === 'menunggu'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {p.status_verifikasi}
                  </span>
                </div>

                <div className='mt-4 space-y-2'>
                  <p className='text-sm'>
                    <span className='font-medium'>Kondisi dari Peminjam:</span>{' '}
                    {p.kondisi_laporan}
                  </p>

                  {p.status_verifikasi === 'menunggu' && (
                    <>
                      <select
                        onChange={e =>
                          setKondisi({
                            ...kondisi,
                            [p.id_pengembalian]: e.target.value
                          })
                        }
                        className='w-full md:w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm'
                      >
                        <option value='normal'>Normal</option>
                        <option value='rusak_ringan'>Rusak Ringan</option>
                        <option value='rusak_berat'>Rusak Berat</option>
                        <option value='hilang'>Hilang</option>
                      </select>

                      <button
                        onClick={() =>
                          setConfirmData({ id: p.id_pengembalian })
                        }
                        className='inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
                      >
                        Verifikasi Pengembalian
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

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
      {confirmData && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
          <div className='bg-white rounded-xl p-6 w-full max-w-sm'>
            <h3 className='text-sm font-semibold text-slate-800 mb-2'>
              Konfirmasi Verifikasi
            </h3>
            <p className='text-sm text-slate-600 mb-4'>
              Verifikasi pengembalian alat ini?
            </p>
            <div className='flex justify-end gap-2'>
              <button
                onClick={() => setConfirmData(null)}
                className='rounded-lg bg-slate-200 px-4 py-2 text-sm'
              >
                Batal
              </button>
              <button
                onClick={verifikasi}
                className='rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700'
              >
                Ya, Verifikasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
