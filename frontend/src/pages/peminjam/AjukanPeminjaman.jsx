import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/api'
import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useRef } from 'react'

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
  const { id } = useParams()
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
  const hasStruk = unitList.length > 0
  const socketRef = useRef(null)
  const location = useLocation()
  const [loadingAlat, setLoadingAlat] = useState(true)
  const [statusAktif, setStatusAktif] = useState(null)

  useEffect(() => {
    socketRef.current = io('http://localhost:3000')

    return () => socketRef.current.disconnect()
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        if (location.state?.alat) {
          setAlatDetail(location.state.alat)
          return
        }

        if (id) {
          const res = await api.get(`/alat/${id}`)
          setAlatDetail(res.data.data)
        }
      } catch (err) {
        console.log('Gagal ambil alat')
      } finally {
        setLoadingAlat(false)
      }
    }

    init()
  }, [id, location.state])

  useEffect(() => {
    const checkPeminjaman = async () => {
      try {
        const res = await api.get('/peminjaman/aktif')

        if (res.data.data.length > 0) {
          const p = res.data.data[0]

          setIsBlocked(true)
          setStatusAktif(p.status)
          setPeminjamanId(p.id_peminjaman)
        }
      } catch (err) {
        console.log(err)
      }
    }

    checkPeminjaman()
  }, [])

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
        id_alat: id,
        tgl_pinjam: tglPinjam,
        tgl_rencana_kembali: tglKembali,
        jumlah
      })

      setPeminjamanId(res.data.id_peminjaman)

      localStorage.setItem('peminjaman_id', res.data.id_peminjaman)
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

  const fetchStruk = async () => {
    try {
      const res = await api.get(`/peminjaman/${peminjamanId}/unit`)
      console.log('STRUK:', res.data)

      if (res.data.data.length > 0) {
        setUnitList(res.data.data)
      }
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    if (!peminjamanId) return

    fetchStruk()
  }, [peminjamanId])

  useEffect(() => {
    if (!socketRef.current) return

    socketRef.current.on('peminjaman_disetujui', data => {
      if (data.id_peminjaman == peminjamanId) {
        console.log('REALTIME MASUK 🔥')
        fetchStruk()
      }
    })

    return () => {
      socketRef.current.off('peminjaman_disetujui')
    }
  }, [peminjamanId])

  useEffect(() => {
    if (hasStruk) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [hasStruk])

  useEffect(() => {
    setUnitList([])
    setPeminjamanId(null)
  }, [id])

  useEffect(() => {
    if (statusAktif === 'disetujui' || statusAktif === 'dipinjam') {
      fetchStruk()
    }
  }, [statusAktif])

  console.log('ID:', id)
  console.log('STATE:', location.state)
  console.log('ALAT:', alatDetail)

  if (hasStruk) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
        <div className='w-full max-w-md bg-white rounded-2xl shadow-xl border p-6'>
          <div className='text-center mb-5'>
            <h1 className='text-xl font-bold text-gray-900'>
              🧾 Struk Peminjaman
            </h1>
            <p className='text-xs text-gray-400'>
              Simpan atau screenshot sebagai bukti
            </p>
          </div>

          <div className='space-y-2 text-sm text-gray-700 mb-4'>
            <p>
              <b>ID:</b> {unitList[0]?.id_peminjaman}
            </p>
            <p>
              <b>Alat:</b> {alatDetail?.name}
            </p>
            <p>
              <b>Tanggal Pinjam:</b>{' '}
              {new Date(unitList[0]?.tgl_pinjam).toLocaleDateString('id-ID')}
            </p>
            <p>
              <b>Kembali:</b> {unitList[0]?.tgl_rencana_kembali}
            </p>
          </div>

          <div className='border-t pt-4'>
            <p className='text-xs text-gray-500 mb-2'>Kode Unit</p>

            <div className='grid grid-cols-2 gap-2'>
              {unitList.map(u => (
                <div
                  key={u.kode_unit}
                  className='border rounded-lg p-2 text-center font-mono text-xs bg-gray-100'
                >
                  {u.kode_unit}
                </div>
              ))}
            </div>
          </div>

          <div className='mt-6 space-y-2'>
            <button
              onClick={() => window.print()}
              className='w-full bg-black text-white py-2 rounded-lg text-xs'
            >
              Print / Simpan
            </button>

            <button
              onClick={() => navigate('/peminjam')}
              className='w-full border py-2 rounded-lg text-xs text-gray-600'
            >
              Kembali ke Daftar Alat
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!alatDetail) {
    return (
      <div className='flex flex-col items-center justify-center h-screen text-center px-4'>
        <h2 className='text-lg font-semibold text-gray-700'>
          ⚠️ Belum memilih alat
        </h2>
        <p className='text-sm text-gray-400 mt-1'>
          Silakan pilih alat terlebih dahulu sebelum mengajukan peminjaman
        </p>

        <button
          onClick={() => navigate('/peminjam/alat')}
          className='mt-4 px-4 py-2 text-xs bg-gray-900 text-white rounded-lg'
        >
          Pilih Alat
        </button>
      </div>
    )
  }

  if (loadingAlat) {
    return (
      <div className='flex justify-center items-center h-screen text-gray-400'>
        Memuat data alat...
      </div>
    )
  }

  if (statusAktif === 'menunggu') {
    return (
      <div className='min-h-screen flex items-center justify-center text-center px-4'>
        <div className='bg-white p-6 rounded-xl shadow border max-w-sm'>
          <h2 className='text-lg font-semibold text-gray-800'>
            ⏳ Menunggu Persetujuan
          </h2>
          <p className='text-sm text-gray-400 mt-2'>
            Peminjaman kamu sedang diproses oleh petugas.
          </p>

          <button
            onClick={() => navigate('/peminjam')}
            className='mt-4 px-4 py-2 text-xs bg-gray-900 text-white rounded-lg'
          >
            Kembali
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='mx-auto max-w-md'>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-[20px] font-bold tracking-tight text-gray-900'>
          Ajukan Peminjaman
        </h1>
        <p className='mt-0.5 text-sm text-gray-400'>
          Alat:{' '}
          <span className='font-semibold text-gray-700'>
            {alatDetail?.name}
          </span>
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
    </div>
  )
}
