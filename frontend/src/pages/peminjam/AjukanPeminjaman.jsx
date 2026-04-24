import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import api from '../../lib/api'
import Toast from '../../components/Toast'

const inputCls =
  'w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-gray-100 placeholder:text-gray-400'

function Field ({ label, hint, children, required = false }) {
  return (
    <div className='flex flex-col gap-1'>
      <label className='text-[11px] font-medium text-gray-500'>
        {label} {required && <span className='text-red-400'>*</span>}
      </label>
      {children}
      {hint && <p className='text-[10px] text-gray-400'>{hint}</p>}
    </div>
  )
}

export default function AjukanPeminjaman () {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const socketRef = useRef(null)

  const [jumlah, setJumlah] = useState('')
  const [tglPinjam, setTglPinjam] = useState('')
  const [tglKembali, setTglKembali] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [errorJumlah, setErrorJumlah] = useState('')
  const [toast, setToast] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [isBlocked, setIsBlocked] = useState(false)
  const [jumlahAktif, setJumlahAktif] = useState(0)
  const [statusAktif, setStatusAktif] = useState(null)
  const [newPeminjamanId, setNewPeminjamanId] = useState(null)

  const [alatDetail, setAlatDetail] = useState(null)
  const [loadingAlat, setLoadingAlat] = useState(true)

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
  }

  const closeToast = () => {
    setToast({ show: false, message: '', type: 'success' })
  }

  useEffect(() => {
    const init = async () => {
      try {
        if (location.state?.alat) {
          setAlatDetail(location.state.alat)
        } else if (id) {
          const res = await api.get(`/alat/${id}`)
          setAlatDetail(res.data.data)
        }
      } catch (err) {
        console.error('Gagal ambil detail alat')
        showToast('Gagal memuat detail alat', 'error')
      } finally {
        setLoadingAlat(false)
      }
    }
    init()
  }, [id, location.state])

  const checkPeminjaman = async () => {
    try {
      const res = await api.get('/peminjaman/aktif')
      const { data, total_aktif, is_blocked } = res.data

      setJumlahAktif(total_aktif)
      setIsBlocked(is_blocked)

      const aktifAlat = data.find(
        p =>
          String(p.id_alat) === String(id) &&
          ['menunggu', 'disetujui', 'dipinjam'].includes(p.status)
      )

      if (aktifAlat) {
        setStatusAktif(aktifAlat.status)
      } else {
        setStatusAktif(null)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    checkPeminjaman()
  }, [id])

  useEffect(() => {
    const interval = setInterval(checkPeminjaman, 5000)
    return () => clearInterval(interval)
  }, [id])

  useEffect(() => {
    socketRef.current = io('http://localhost:3000')
    socketRef.current.on('peminjaman_disetujui', data => {
      if (
        newPeminjamanId &&
        String(data.id_peminjaman) === String(newPeminjamanId)
      ) {
        showToast('Peminjaman Anda telah disetujui!', 'success')
        setTimeout(() => {
          navigate(`/peminjam/struk/${newPeminjamanId}`)
        }, 1500)
      }
    })
    return () => socketRef.current.disconnect()
  }, [newPeminjamanId, navigate])

  useEffect(() => {
    if (tglPinjam && tglKembali && tglKembali <= tglPinjam) {
      setTglKembali('')
    }
  }, [tglPinjam])

  const tambahSatuHari = dateStr => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }

  const diffDays =
    tglPinjam && tglKembali
      ? Math.ceil(
          Math.abs(new Date(tglKembali) - new Date(tglPinjam)) /
            (1000 * 60 * 60 * 24)
        )
      : 0

  // const perluDeskripsi = diffDays > 7
  const tambahHari = (dateStr, hari) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    d.setDate(d.getDate() + hari)
    return d.toISOString().split('T')[0]
  }

  const submit = async e => {
    e.preventDefault()
    const jumlahNum = Number(jumlah)

    if (jumlahNum > 5 || jumlahNum <= 0) {
      showToast('Jumlah harus antara 1-5 alat', 'error')
      return
    }
    if (jumlahNum > alatDetail?.stok) {
      showToast(`Stok hanya tersedia ${alatDetail?.stok} unit`, 'error')
      return
    }
    if (!tglPinjam || !tglKembali) {
      showToast('Tanggal pinjam dan kembali harus diisi', 'error')
      return
    }
    if (new Date(tglKembali) <= new Date(tglPinjam)) {
      showToast('Tanggal kembali harus setelah tanggal pinjam', 'error')
      return
    }
    // if (perluDeskripsi && !deskripsi.trim()) {
    //   showToast(
    //     'Durasi lebih dari 7 hari. Wajib isi alasan pengajuan.',
    //     'error'
    //   )
    //   return
    // }
    if (diffDays > 7) {
      showToast('Durasi peminjaman maksimal 7 hari', 'error')
      return
    }

    setSubmitting(true)
    try {
      const res = await api.post('/peminjaman', {
        id_alat: id,
        tgl_pinjam: tglPinjam,
        tgl_rencana_kembali: tglKembali,
        jumlah: jumlahNum,
        deskripsi: deskripsi.trim() || null
      })

      setNewPeminjamanId(res.data.id_peminjaman)
      showToast(
        res.data.perlu_persetujuan_khusus
          ? `Pengajuan ${diffDays} hari berhasil dikirim dan menunggu persetujuan khusus admin.`
          : 'Peminjaman berhasil diajukan dan menunggu verifikasi petugas.',
        'success'
      )

      setTimeout(() => {
        navigate('/peminjam')
      }, 2000)
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Gagal mengajukan peminjaman',
        'error'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingAlat) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='flex flex-col items-center gap-2'>
          <div className='h-8 w-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin' />
          <p className='text-sm text-gray-400'>Memuat data alat...</p>
        </div>
      </div>
    )
  }

  if (!alatDetail) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
          <svg
            width='28'
            height='28'
            fill='none'
            stroke='#9ca3af'
            strokeWidth='1.5'
            viewBox='0 0 24 24'
          >
            <rect x='3' y='3' width='18' height='18' rx='2' />
            <circle cx='8.5' cy='8.5' r='1.5' />
            <polyline points='21,15 16,10 5,21' />
          </svg>
        </div>
        <h2 className='text-base font-semibold text-gray-700'>
          Belum Memilih Alat
        </h2>
        <p className='text-sm text-gray-400 mt-1'>
          Silakan pilih alat terlebih dahulu
        </p>
        <button
          onClick={() => navigate('/peminjam/alat')}
          className='mt-4 rounded-md bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 transition'
        >
          Pilih Alat
        </button>
      </div>
    )
  }

  if (statusAktif === 'menunggu') {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100'>
          <svg
            width='28'
            height='28'
            fill='none'
            stroke='#d97706'
            strokeWidth='1.5'
            viewBox='0 0 24 24'
          >
            <circle cx='12' cy='12' r='10' />
            <polyline points='12 6 12 12 16 14' />
          </svg>
        </div>
        <h2 className='text-base font-semibold text-gray-700'>
          Menunggu Persetujuan
        </h2>
        <p className='text-sm text-gray-400 mt-1'>
          Peminjaman alat ini sedang diproses oleh petugas
        </p>
        <button
          onClick={() => navigate('/peminjam/alat')}
          className='mt-4 rounded-md bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 transition'
        >
          Kembali ke Daftar Alat
        </button>
      </div>
    )
  }

  if (statusAktif === 'disetujui' || statusAktif === 'dipinjam') {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
          <svg
            width='28'
            height='28'
            fill='none'
            stroke='#10b981'
            strokeWidth='1.5'
            viewBox='0 0 24 24'
          >
            <polyline points='20,6 9,17 4,12' />
          </svg>
        </div>
        <h2 className='text-base font-semibold text-gray-700'>
          Peminjaman Aktif
        </h2>
        <p className='text-sm text-gray-400 mt-1'>
          Alat ini sedang dalam peminjaman aktif
        </p>
        <button
          onClick={() => navigate('/peminjam')}
          className='mt-4 rounded-md bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 transition'
        >
          Kembali ke Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className='max-w-md mx-auto'>
      {toast && toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      )}

      {/* Header */}
      <div className='mb-5'>
        <h1 className='text-lg font-semibold tracking-tight text-gray-900'>
          Ajukan Peminjaman
        </h1>
        <p className='text-sm text-gray-400 mt-0.5'>
          Alat:{' '}
          <span className='font-medium text-gray-700'>{alatDetail?.name}</span>
        </p>
      </div>

      {/* Info Alat */}
      <div className='mb-4 rounded-lg border border-gray-100 bg-white p-3 shadow-sm'>
        <div className='flex items-start gap-2'>
          <div className='p-1 rounded-md bg-gray-100 text-gray-500'>
            <svg
              width='14'
              height='14'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
              viewBox='0 0 24 24'
            >
              <path d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' />
            </svg>
          </div>
          <div className='flex-1'>
            <p className='text-xs text-gray-500'>
              <span className='font-medium text-gray-700'>Merk:</span>{' '}
              {alatDetail?.merk || '-'}
            </p>
            <p className='text-xs text-gray-500 mt-0.5'>
              <span className='font-medium text-gray-700'>Model:</span>{' '}
              {alatDetail?.tipe_model || '-'}
            </p>
            <p className='text-xs text-gray-400 mt-1'>
              {alatDetail?.spesifikasi || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Blocked Warning */}
      {isBlocked && (
        <div className='mb-4 rounded-md bg-red-50 border border-red-100 p-3'>
          <div className='flex items-center gap-2'>
            <svg
              width='14'
              height='14'
              fill='none'
              stroke='#ef4444'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <circle cx='12' cy='12' r='10' />
              <line x1='12' y1='8' x2='12' y2='12' />
              <line x1='12' y1='16' x2='12.01' y2='16' />
            </svg>
            <p className='text-xs text-red-600'>
              Kamu sudah mencapai batas 5 peminjaman aktif. Selesaikan salah
              satu terlebih dahulu.
            </p>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className='rounded-lg border border-gray-100 bg-white overflow-hidden shadow-sm'>
        <div className='border-b border-gray-100 px-4 py-3 bg-gray-50/50'>
          <h2 className='text-sm font-semibold text-gray-900'>
            Detail Peminjaman
          </h2>
        </div>

        <form onSubmit={submit} className='p-4 space-y-4'>
          <Field label='Tanggal Pinjam' required>
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

          <Field
            label='Jumlah'
            hint={`Maksimal 5 unit • Stok tersedia: ${alatDetail?.stok}`}
            required
          >
            <input
              type='number'
              min='1'
              max='5'
              required
              className={`${inputCls} ${
                errorJumlah ? 'border-red-300 focus:ring-red-100' : ''
              }`}
              value={jumlah}
              onChange={e => {
                const value = e.target.value
                setJumlah(value)
                const numberValue = Number(value)
                if (!value) {
                  setErrorJumlah('')
                  return
                }
                if (numberValue > alatDetail?.stok) {
                  setErrorJumlah(`Stok hanya tersedia ${alatDetail?.stok} unit`)
                } else if (numberValue <= 0) {
                  setErrorJumlah('Jumlah minimal 1')
                } else {
                  setErrorJumlah('')
                }
              }}
              disabled={isBlocked}
            />
            {errorJumlah && (
              <p className='text-[10px] text-red-500 mt-1'>{errorJumlah}</p>
            )}
          </Field>

          <Field label='Rencana Pengembalian' required>
            <input
              type='date'
              min={
                tglPinjam
                  ? tambahHari(tglPinjam, 1)
                  : new Date().toISOString().split('T')[0]
              }
              max={tglPinjam ? tambahHari(tglPinjam, 7) : ''}
              required
              className={inputCls}
              value={tglKembali}
              onChange={e => setTglKembali(e.target.value)}
              disabled={isBlocked}
            />
          </Field>

          {/* Durasi Info */}
          {diffDays > 0 && (
            <div
              className={`rounded-md p-2 text-[10px] font-medium border ${
                diffDays === 7
                  ? 'bg-orange-50 text-orange-600 border-orange-100'
                  : 'bg-blue-50 text-blue-600 border-blue-100'
              }`}
            >
              {diffDays === 7
                ? `⚠️ Durasi ${diffDays} hari (maksimal)`
                : `✅ Durasi peminjaman: ${diffDays} hari (sisa ${
                    7 - diffDays
                  } hari)`}
            </div>
          )}

          <Field label='Catatan (Opsional)'>
            <textarea
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder='Tambahkan catatan jika ada...'
              value={deskripsi}
              onChange={e => setDeskripsi(e.target.value)}
              disabled={isBlocked}
            />
          </Field>

          {/* Kuota Info */}
          <div className='rounded-md bg-gray-50 p-2 text-center'>
            <p className='text-[10px] text-gray-500'>
              Kuota peminjaman aktif:{' '}
              <span className='font-semibold text-gray-700'>
                {jumlahAktif}/5
              </span>
            </p>
          </div>

          {/* Info Note */}
          <div className='rounded-md bg-amber-50 border border-amber-100 p-2'>
            <div className='flex items-start gap-1.5'>
              <svg
                width='12'
                height='12'
                fill='none'
                stroke='#d97706'
                strokeWidth='2'
                viewBox='0 0 24 24'
                className='mt-0.5'
              >
                <circle cx='12' cy='12' r='10' />
                <line x1='12' y1='8' x2='12' y2='12' />
                <line x1='12' y1='16' x2='12.01' y2='16' />
              </svg>
              <p className='text-[10px] text-amber-700'>
                Pengajuan akan menunggu persetujuan petugas sebelum alat dapat
                diambil.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type='submit'
            disabled={isBlocked || submitting}
            className={`w-full rounded-md py-2 text-sm font-medium text-white transition ${
              isBlocked || submitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gray-900 hover:bg-gray-800'
            }`}
          >
            {submitting
              ? 'Memproses...'
              : isBlocked
              ? 'Tidak bisa meminjam'
              : 'Ajukan Peminjaman'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-animate { animation: modalFadeIn 0.2s ease-out; }
      `}</style>
    </div>
  )
}
