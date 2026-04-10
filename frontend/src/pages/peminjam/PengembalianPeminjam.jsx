import { useEffect, useState } from 'react'
import api from '../../lib/api'

const formatDate = d =>
  new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

const fmt = n => 'Rp ' + Number(n).toLocaleString('id-ID')

const getStatusInfo = p => {
  if (p.status === 'menunggu_pengembalian')
    return {
      label: 'Menunggu Verifikasi',
      cls: 'border-blue-100 bg-blue-50 text-blue-600',
      dot: 'bg-blue-400'
    }
  const diff = Math.ceil((new Date(p.tgl_jatuh_tempo) - new Date()) / 86400000)
  if (diff < 0)
    return {
      label: `Terlambat ${Math.abs(diff)} hari`,
      cls: 'border-red-100 bg-red-50 text-red-500',
      dot: 'bg-red-400'
    }
  if (diff <= 1)
    return {
      label: 'Hampir Jatuh Tempo',
      cls: 'border-amber-100 bg-amber-50 text-amber-600',
      dot: 'bg-amber-400'
    }
  return {
    label: 'Aktif',
    cls: 'border-green-100 bg-green-50 text-green-600',
    dot: 'bg-green-500'
  }
}

const kondisiOpts = [
  { value: 'normal', label: 'Normal' },
  { value: 'rusak_ringan', label: 'Rusak Ringan' },
  { value: 'rusak_berat', label: 'Rusak Berat' },
  { value: 'hilang', label: 'Hilang' }
]

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

export default function PengembalianPeminjam () {
  const [data, setData] = useState([])
  const [denda, setDenda] = useState([])
  const [form, setForm] = useState({})
  const [modal, setModal] = useState({ show: false, type: '', message: '' })
  const [showAll, setShowAll] = useState(false)
  const displayedDenda = showAll ? denda : denda.slice(0, 3)

  const fetchData = async () => {
    const res = await api.get('/peminjaman/saya')
    const aktif = res.data.data.filter(
      p => p.status === 'dipinjam' || p.status === 'menunggu_pengembalian'
    )
    setData(aktif)
  }

  const fetchDenda = async () => {
    try {
      const res = await api.get('/denda/saya')
      setDenda(res.data)
    } catch {}
  }

  useEffect(() => {
    fetchData()
    fetchDenda()
  }, [])

  const handleChange = (id, field, value) =>
    setForm(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))

  const ajukanPengembalian = async id => {
    try {
      await api.post('/pengembalian', {
        id_peminjaman: id,
        tgl_kembali: new Date().toISOString(),
        kondisi_laporan: form[id]?.kondisi || 'normal',
        keterangan_user: form[id]?.keterangan || ''
      })
      setModal({
        show: true,
        type: 'success',
        message:
          'Pengembalian berhasil diajukan dan menunggu verifikasi petugas.'
      })
      fetchData()
    } catch (err) {
      setModal({
        show: true,
        type: 'error',
        message: err.response?.data?.message || 'Gagal mengajukan pengembalian'
      })
    }
  }

  return (
    <div>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-[20px] font-bold tracking-tight text-gray-900'>
          Pengembalian Alat
        </h1>
        <p className='mt-0.5 text-sm text-gray-400'>
          Ajukan pengembalian alat yang sedang kamu pinjam
        </p>
      </div>

      {/* Warning notice */}
      <div className='mb-4 flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 p-4'>
        <svg
          className='mt-0.5 shrink-0 text-amber-500'
          width='14'
          height='14'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          viewBox='0 0 24 24'
        >
          <circle cx='12' cy='12' r='10' />
          <line x1='12' y1='8' x2='12' y2='12' />
          <line x1='12' y1='16' x2='12.01' y2='16' />
        </svg>
        <p className='text-[13px] text-amber-700 leading-relaxed'>
          Pengembalian melewati tanggal jatuh tempo akan dikenakan denda sesuai
          kebijakan yang berlaku.
        </p>
      </div>

      {/* Denda section */}
      {denda.length > 0 && (
        <div className='mb-4 rounded-xl border border-red-100 bg-white overflow-hidden'>
          <div className='border-b border-red-50 bg-red-50 px-5 py-3'>
            <span className='text-[13px] font-semibold text-red-600'>
              Informasi Denda
            </span>
          </div>
          <div className='divide-y divide-gray-50 px-5 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300'>
            {' '}
            {displayedDenda.map(d => (
              <div
                key={d.id_denda}
                className='flex items-center justify-between py-3.5'
              >
                <div className='px-5 py-3 bg-red-50 border-b border-red-100'>
                  <p className='text-sm font-semibold text-red-600'>
                    Total Denda: {fmt(d.total_denda)}
                  </p>
                  <p className='text-[12px] text-gray-400'>
                    Terlambat {d.hari_terlambat} hari
                  </p>
                </div>
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
              </div>
            ))}
            {denda.length > 3 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className='text-xs text-blue-500 px-5 py-2'
              >
                {showAll ? 'Tutup' : 'Lihat Semua'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Peminjaman list */}
      {data.length === 0 ? (
        <div className='rounded-xl border border-gray-200 bg-white py-14 text-center'>
          <p className='text-sm text-gray-300'>
            Tidak ada alat yang sedang dipinjam
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {data.map(p => {
            const status = getStatusInfo(p)
            const isLate = status.label.startsWith('Terlambat')

            return (
              <div
                key={p.id_peminjaman}
                className='rounded-xl border border-gray-200 bg-white overflow-hidden'
              >
                {/* Card header */}
                <div className='flex items-start justify-between gap-3 p-5 pb-4'>
                  <div>
                    <p className='font-semibold text-gray-900'>{p.alat}</p>
                    <div className='mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[12px] text-gray-400'>
                      <span>
                        Dipinjam:{' '}
                        <span className='font-medium text-gray-600'>
                          {formatDate(p.tgl_pinjam)}
                        </span>
                      </span>
                      <span>
                        Jatuh tempo:{' '}
                        <span
                          className={`font-medium ${
                            isLate ? 'text-red-500' : 'text-gray-600'
                          }`}
                        >
                          {formatDate(p.tgl_jatuh_tempo)}
                        </span>
                      </span>
                    </div>
                    {isLate && (
                      <p className='mt-1 text-[12px] font-semibold text-red-500'>
                        Denda akan dihitung saat verifikasi petugas.
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${status.cls}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                    />
                    {status.label}
                  </span>
                </div>

                {/* Return form */}
                {p.status === 'dipinjam' && (
                  <div className='space-y-3 border-t border-gray-100 bg-gray-50/50 px-5 py-4'>
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                      <div className='flex flex-col gap-1'>
                        <label className='text-[11px] font-semibold uppercase tracking-wider text-gray-400'>
                          Kondisi Alat
                        </label>
                        <select
                          className={inputCls}
                          value={form[p.id_peminjaman]?.kondisi || 'normal'}
                          onChange={e =>
                            handleChange(
                              p.id_peminjaman,
                              'kondisi',
                              e.target.value
                            )
                          }
                        >
                          {kondisiOpts.map(o => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className='flex flex-col gap-1'>
                        <label className='text-[11px] font-semibold uppercase tracking-wider text-gray-400'>
                          Catatan
                        </label>
                        <input
                          className={inputCls}
                          placeholder='Catatan tambahan (opsional)'
                          value={form[p.id_peminjaman]?.keterangan || ''}
                          onChange={e =>
                            handleChange(
                              p.id_peminjaman,
                              'keterangan',
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => ajukanPengembalian(p.id_peminjaman)}
                      className='rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-700 transition'
                    >
                      Ajukan Pengembalian
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal.show && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]'>
          <div className='w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl text-center'>
            <div
              className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
                modal.type === 'success' ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              {modal.type === 'success' ? (
                <svg
                  width='22'
                  height='22'
                  fill='none'
                  stroke='#16a34a'
                  strokeWidth='2.5'
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
                  strokeWidth='2.5'
                  viewBox='0 0 24 24'
                >
                  <line x1='18' y1='6' x2='6' y2='18' />
                  <line x1='6' y1='6' x2='18' y2='18' />
                </svg>
              )}
            </div>
            <h3 className='mb-1 text-[15px] font-bold text-gray-900'>
              {modal.type === 'success' ? 'Berhasil' : 'Gagal'}
            </h3>
            <p className='mb-5 text-sm text-gray-400'>{modal.message}</p>
            <button
              onClick={() => setModal({ ...modal, show: false })}
              className='rounded-lg border border-gray-200 px-5 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 transition'
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
