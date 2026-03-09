import { useEffect, useState } from 'react'
import api from '../../lib/api'

export default function PengembalianPeminjam () {
  const [data, setData] = useState([])
  const [form, setForm] = useState({})
  const [denda, setDenda] = useState([])
  const [modal, setModal] = useState({ show: false, type: '', message: '' })

  const fetchData = async () => {
    const res = await api.get('/peminjaman/saya')
    const aktif = res.data.data.filter(
      p => p.status === 'disetujui' || p.status === 'menunggu_pengembalian'
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

  const handleChange = (id, field, value) => {
    setForm(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

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

  const formatDate = d =>
    new Date(d).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })

  const getStatusInfo = p => {
    if (p.status === 'menunggu_pengembalian')
      return { label: 'Menunggu Verifikasi', color: 'blue' }
    const now = new Date()
    const due = new Date(p.tgl_jatuh_tempo)
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
    if (diff < 0)
      return { label: `Terlambat ${Math.abs(diff)} hari`, color: 'red' }
    if (diff <= 1) return { label: 'Hampir Jatuh Tempo', color: 'yellow' }
    return { label: 'Aman', color: 'green' }
  }

  return (
    <div className='space-y-8 max-w-6xl mx-auto'>
      {/* HEADER */}
      <div className='flex flex-col gap-1'>
        <h1 className='text-2xl font-semibold text-slate-800'>
          Pengembalian Alat
        </h1>
        <p className='text-sm text-slate-500'>
          Ajukan pengembalian alat yang sedang kamu pinjam
        </p>
      </div>

      {/* INFO */}
      <div className='flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4'>
        <div className='text-amber-600 text-lg'>⚠️</div>
        <p className='text-sm text-amber-700'>
          Jika pengembalian melewati tanggal jatuh tempo, sistem dapat
          memberikan denda sesuai kebijakan yang berlaku.
        </p>
      </div>

      {/* DENDA */}
      {denda.length > 0 && (
        <div className='bg-white border border-red-200 rounded-2xl p-5 shadow-sm'>
          <h2 className='text-sm font-semibold text-red-600 mb-3'>
            Informasi Denda
          </h2>

          <div className='space-y-3'>
            {denda.map(d => (
              <div
                key={d.id_denda}
                className='flex justify-between items-center border rounded-lg px-4 py-3'
              >
                <div className='text-sm text-slate-600 space-y-1'>
                  <p>
                    Denda :
                    <span className='font-semibold text-red-600 ml-1'>
                      Rp {d.total_denda.toLocaleString('id-ID')}
                    </span>
                  </p>
                  <p className='text-xs text-slate-500'>
                    Terlambat {d.hari_terlambat} hari
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    d.status_bayar === 'belum_bayar'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {d.status_bayar === 'belum_bayar' ? 'Belum Lunas' : 'Lunas'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIST */}
      {data.length === 0 ? (
        <div className='bg-white border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-500'>
          Tidak ada alat yang sedang dipinjam
        </div>
      ) : (
        <div className='grid gap-6'>
          {data.map(p => {
            const status = getStatusInfo(p)

            return (
              <div
                key={p.id_peminjaman}
                className='bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition'
              >
                {/* HEADER CARD */}
                <div className='flex justify-between items-start gap-4'>
                  <div className='space-y-1'>
                    <h2 className='text-lg font-semibold text-slate-800'>
                      {p.alat}
                    </h2>

                    <p className='text-sm text-slate-500'>
                      Dipinjam : {formatDate(p.tgl_pinjam)}
                    </p>

                    <p className='text-sm text-slate-500'>
                      Jatuh Tempo :
                      <span className='ml-1 font-medium text-slate-700'>
                        {formatDate(p.tgl_jatuh_tempo)}
                      </span>
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      status.color === 'red'
                        ? 'bg-red-100 text-red-700'
                        : status.color === 'yellow'
                        ? 'bg-yellow-100 text-yellow-700'
                        : status.color === 'blue'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {status.label}
                  </span>
                </div>

                {status.color === 'red' && (
                  <div className='mt-3 text-sm text-red-600 font-medium'>
                    Terlambat. Denda akan dihitung saat verifikasi.
                  </div>
                )}

                {/* FORM */}
                {p.status === 'disetujui' && (
                  <div className='mt-5 space-y-3'>
                    <select
                      onChange={e =>
                        handleChange(p.id_peminjaman, 'kondisi', e.target.value)
                      }
                      className='w-full md:w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none'
                    >
                      <option value='normal'>Kondisi Normal</option>
                      <option value='rusak_ringan'>Rusak Ringan</option>
                      <option value='rusak_berat'>Rusak Berat</option>
                      <option value='hilang'>Hilang</option>
                    </select>

                    <textarea
                      placeholder='Catatan tambahan (opsional)'
                      onChange={e =>
                        handleChange(
                          p.id_peminjaman,
                          'keterangan',
                          e.target.value
                        )
                      }
                      className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none'
                    />

                    <button
                      onClick={() => ajukanPengembalian(p.id_peminjaman)}
                      className='inline-flex items-center justify-center rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900 transition'
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

      {/* MODAL */}
      {modal.show && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
          <div className='bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-lg'>
            <h3
              className={`text-base font-semibold mb-2 ${
                modal.type === 'success' ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {modal.type === 'success' ? 'Berhasil' : 'Gagal'}
            </h3>

            <p className='text-sm text-slate-600 mb-4'>{modal.message}</p>

            <button
              onClick={() => setModal({ ...modal, show: false })}
              className='rounded-lg bg-slate-800 text-white px-4 py-2 text-sm hover:bg-slate-700 transition'
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
