import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { useEffect } from 'react'

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300'

function Field ({ label, hint, children }) {
  return (
    <div className='flex flex-col gap-1'>
      <label className='text-[11px] font-semibold uppercase tracking-wider text-gray-400'>
        {label}
      </label>
      {children}
      {hint && <p className='text-[11px] text-gray-400'>{hint}</p>}
    </div>
  )
}

export default function AjukanPeminjaman () {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [jumlah, setJumlah] = useState(1)
  const [tglPinjam, setTglPinjam] = useState('')
  const [tglKembali, setTglKembali] = useState('')
  const [modal, setModal] = useState({ show: false, type: '', message: '' })
  const [isBlocked, setIsBlocked] = useState(false)
  const [statusPinjam, setStatusPinjam] = useState('')
  const [alatDetail, setAlatDetail] = useState(null)
  const [peminjamanId, setPeminjamanId] = useState(null)
  const [unitList, setUnitList] = useState([])

  useEffect(() => {
    if (state?.id_alat) {
      api.get(`/alat/${state.id_alat}`).then(res => {
        setAlatDetail(res.data.data)
        console.log(res.data)
      })
    }
  }, [state])

  useEffect(() => {
    const checkPeminjaman = async () => {
      try {
        const res = await api.get('/peminjaman/aktif')

        if (res.data.data.length > 0) {
          setIsBlocked(true)
          setStatusPinjam('Masih ada peminjaman yang belum selesai')
        }
      } catch (err) {
        console.log(err)
      }
    }

    checkPeminjaman()
  }, [])

  if (!state) {
    return (
      <div className='rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600'>
        Silakan pilih alat terlebih dahulu dari menu Daftar Alat.
      </div>
    )
  }

  const submit = async e => {
    e.preventDefault()

    if (tglKembali < tglPinjam) {
      setModal({
        show: true,
        type: 'error',
        message: 'Tanggal kembali tidak boleh sebelum tanggal pinjam'
      })
      return
    }

    try {
      const res = await api.post('/peminjaman', {
        id_alat: state.id_alat,
        tgl_pinjam: tglPinjam,
        tgl_rencana_kembali: tglKembali,
        jumlah
      })

      setPeminjamanId(res.data.id_peminjaman)
      setModal({
        show: true,
        type: 'success',
        message: 'Peminjaman berhasil diajukan dan menunggu verifikasi petugas.'
      })
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

  useEffect(() => {
    const saved = localStorage.getItem('struk_peminjaman')

    if (saved) {
      const parsed = JSON.parse(saved)
      setUnitList(parsed.unit)
    }
  }, [])

  useEffect(() => {
    if (!peminjamanId) return

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/peminjaman/${peminjamanId}/unit`)
        if (res.data.data.length > 0) {
          setUnitList(res.data.data)

          localStorage.setItem(
            'struk_peminjaman',
            JSON.stringify({
              id: peminjamanId,
              unit: res.data.data,
              alat: state.name
            })
          )

          clearInterval(interval)
        }
      } catch (err) {
        console.log(err)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [peminjamanId])

  return (
    <div className='mx-auto max-w-md'>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-[20px] font-bold tracking-tight text-gray-900'>
          Ajukan Peminjaman
        </h1>
        <p className='mt-0.5 text-sm text-gray-400'>
          Alat:{' '}
          <span className='font-semibold text-gray-700'>{state.name}</span>
        </p>
      </div>

      {alatDetail && (
        <div className='mb-4 text-xs text-gray-500 space-y-1'>
          <p>Merk: {alatDetail?.merk || '-'}</p>
          <p>Model: {alatDetail?.tipe_model || '-'}</p>
          <p className='text-[11px] text-gray-400'>
            {alatDetail?.spesifikasi || '-'}
          </p>
        </div>
      )}

      {isBlocked && (
        <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600'>
          ⚠️ Kamu masih memiliki peminjaman aktif. Selesaikan terlebih dahulu
          sebelum meminjam lagi.
        </div>
      )}

      {/* Form card */}
      <div className='rounded-xl border border-gray-200 bg-white'>
        <div className='border-b border-gray-100 px-5 py-3.5'>
          <span className='text-sm font-semibold text-gray-800'>
            Detail Peminjaman
          </span>
        </div>

        <form onSubmit={submit} className='space-y-4 p-5'>
          <Field label='Tanggal Pinjam'>
            <input
              type='date'
              min={new Date().toISOString().split('T')[0]}
              required
              className={inputCls}
              value={tglPinjam}
              onChange={e => setTglPinjam(e.target.value)}
              disabled={isBlocked}
            />
          </Field>

          <Field label='Jumlah' hint='Sesuaikan dengan stok tersedia'>
            <input
              type='number'
              min='1'
              required
              className={inputCls}
              value={jumlah}
              onChange={e => setJumlah(Number(e.target.value))}
              disabled={isBlocked}
            />
          </Field>

          <Field label='Rencana Pengembalian'>
            <input
              type='date'
              min={new Date().toISOString().split('T')[0]}
              required
              className={inputCls}
              value={tglKembali}
              onChange={e => setTglKembali(e.target.value)}
              disabled={isBlocked}
            />
          </Field>

          {/* Info notice */}
          <div className='flex items-start gap-2.5 rounded-lg border border-amber-100 bg-amber-50 p-3'>
            <svg
              className='mt-0.5 shrink-0 text-amber-500'
              width='13'
              height='13'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <circle cx='12' cy='12' r='10' />
              <line x1='12' y1='8' x2='12' y2='12' />
              <line x1='12' y1='16' x2='12.01' y2='16' />
            </svg>
            <p className='text-[12px] text-amber-700'>
              Pengajuan akan menunggu persetujuan petugas sebelum alat dapat
              diambil.
            </p>
          </div>

          <button
            type='submit'
            disabled={isBlocked}
            className={`w-full rounded-lg py-2.5 text-sm font-semibold text-white transition ${
              isBlocked
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gray-900 hover:bg-gray-700'
            }`}
          >
            {isBlocked ? 'Tidak bisa meminjam' : 'Ajukan Peminjaman'}
          </button>
        </form>
      </div>

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
              {modal.type === 'success' ? 'Berhasil Diajukan' : 'Gagal'}
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

      {unitList.length > 0 && (
        <div className='mt-4 rounded-xl border border-green-200 bg-green-50 p-4'>
          <p className='text-sm font-semibold text-green-700 mb-2'>
            ✅ Peminjaman Disetujui
          </p>

          <p className='text-xs text-gray-600 mb-2'>
            Tunjukkan kode ini ke petugas:
          </p>

          <div className='flex flex-wrap gap-2'>
            {unitList.map(u => (
              <span
                key={u.kode_unit}
                className='px-3 py-1 bg-white border rounded font-mono text-xs shadow'
              >
                {u.kode_unit}
              </span>
            ))}
          </div>

          <button
            onClick={() => localStorage.removeItem('struk_peminjaman')}
            className='mt-3 text-xs text-red-500'
          >
            Hapus Struk
          </button>
        </div>
      )}
    </div>
  )
}
