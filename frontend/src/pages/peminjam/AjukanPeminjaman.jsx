import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import api from '../../lib/api'

export default function AjukanPeminjaman () {
  const { state } = useLocation()
  const navigate = useNavigate()

  const [jumlah, setJumlah] = useState(1)
  const [tglPinjam, setTglPinjam] = useState('')
  const [tglKembali, setTglKembali] = useState('')
  const [modal, setModal] = useState({ show: false, type: '', message: '' })

  if (!state) {
    return (
      <div className='bg-white rounded-xl border border-slate-200 p-4 text-sm text-red-600'>
        Silakan pilih alat terlebih dahulu dari menu Daftar Alat.
      </div>
    )
  }

  const submit = async e => {
    e.preventDefault()

    try {
      await api.post('/peminjaman', {
        id_alat: state.id_alat,
        tgl_pinjam: tglPinjam,
        tgl_rencana_kembali: tglKembali,
        jumlah
      })

      setModal({
        show: true,
        type: 'success',
        message: 'Peminjaman berhasil diajukan dan menunggu verifikasi petugas.'
      })

      setTimeout(() => {
        navigate('/peminjam')
      }, 1500)
    } catch (err) {
      setModal({
        show: true,
        type: 'error',
        message:
          err.response?.data?.message ||
          'Terjadi kesalahan saat mengajukan peminjaman'
      })
    }
  }

  return (
    <div className='max-w-md mx-auto space-y-6'>
      {/* HEADER */}
      <div>
        <h1 className='text-xl font-semibold text-slate-800'>
          Ajukan Peminjaman
        </h1>
        <p className='text-sm text-slate-500'>
          Alat: <span className='font-medium text-slate-700'>{state.name}</span>
        </p>
      </div>

      {/* FORM */}
      <form
        onSubmit={submit}
        className='bg-white rounded-xl border border-slate-200 p-5 space-y-4'
      >
        <div>
          <label className='text-sm font-medium text-slate-600'>
            Tanggal Pinjam
          </label>
          <input
            type='datetime-local'
            className='mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500'
            value={tglPinjam}
            onChange={e => setTglPinjam(e.target.value)}
            required
          />
        </div>

        <div>
          <label className='text-sm font-medium text-slate-600'>Jumlah</label>
          <input
            type='number'
            min='1'
            className='mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500'
            value={jumlah}
            onChange={e => setJumlah(e.target.value)}
            required
          />
        </div>

        <div>
          <label className='text-sm font-medium text-slate-600'>
            Rencana Pengembalian
          </label>
          <input
            type='datetime-local'
            className='mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500'
            value={tglKembali}
            onChange={e => setTglKembali(e.target.value)}
            required
          />
        </div>

        <button className='w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition'>
          Ajukan Peminjaman
        </button>
      </form>

      {/* MODAL */}
      {modal.show && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
          <div className='bg-white rounded-xl p-6 w-full max-w-sm text-center'>
            <h3
              className={`text-sm font-semibold mb-2 ${
                modal.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {modal.type === 'success' ? 'Berhasil' : 'Gagal'}
            </h3>
            <p className='text-sm text-slate-600 mb-4'>{modal.message}</p>
            <button
              onClick={() => setModal({ ...modal, show: false })}
              className='rounded-lg bg-slate-200 px-4 py-2 text-sm'
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
