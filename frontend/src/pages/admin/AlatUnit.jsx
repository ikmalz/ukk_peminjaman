import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import Toast from '../../components/Toast'

const statusConfig = {
  tersedia: {
    label: 'Tersedia',
    cls: 'bg-green-50 text-green-600 border-green-100',
    dot: 'bg-green-500'
  },
  dipinjam: {
    label: 'Dipinjam',
    cls: 'bg-amber-50 text-amber-600 border-amber-100',
    dot: 'bg-amber-500'
  },
  rusak: {
    label: 'Rusak',
    cls: 'bg-red-50 text-red-600 border-red-100',
    dot: 'bg-red-500'
  },
  hilang: {
    label: 'Hilang',
    cls: 'bg-rose-50 text-rose-600 border-rose-100',
    dot: 'bg-rose-500'
  },
  maintenance: {
    label: 'Maintenance',
    cls: 'bg-orange-50 text-orange-600 border-orange-100',
    dot: 'bg-orange-500'
  }
}

function StatusBadge ({ status }) {
  const cfg = statusConfig[status] ?? {
    label: status,
    cls: 'bg-gray-50 text-gray-500 border-gray-100',
    dot: 'bg-gray-400'
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${cfg.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

export default function AlatUnit () {
  const { id } = useParams()
  const navigate = useNavigate()

  const [data, setData] = useState([])
  const [alat, setAlat] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [selectedKodeUnit, setSelectedKodeUnit] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [toast, setToast] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
  }

  const closeToast = () => {
    setToast(null)
  }

  const handleCardClick = unit => {
    if (unit.status === 'dipinjam') {
      showToast('Unit sedang dipinjam, tidak dapat diubah statusnya', 'warning')
      return
    }
    setSelectedUnit(unit.id_unit)
    setSelectedKodeUnit(unit.kode_unit)
    setSelectedStatus(unit.status)
    setShowModal(true)
  }

  const changeStatus = async newStatus => {
    if (!selectedUnit) return
    setSubmitting(true)

    try {
      await api.put(`/alat/unit/${selectedUnit}/status`, { status: newStatus })

      const statusLabel = statusConfig[newStatus]?.label || newStatus
      showToast(
        `Unit ${selectedKodeUnit} berhasil diubah menjadi "${statusLabel}"`,
        'success'
      )

      setShowModal(false)
      setSelectedUnit(null)
      setSelectedKodeUnit('')
      setSelectedStatus('')

      // Refresh data
      setTimeout(() => {
        fetchData()
      }, 500)
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Gagal mengubah status unit',
        'error'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedUnit(null)
    setSelectedKodeUnit('')
    setSelectedStatus('')
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [unitRes, alatRes] = await Promise.all([
        api.get(`/alat/${id}/unit`),
        api.get(`/alat/${id}`)
      ])
      setData(unitRes.data)
      setAlat(alatRes.data?.data ?? null)
    } catch (err) {
      console.error('Gagal ambil data:', err)
      showToast('Gagal memuat data unit', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const counts = data.reduce((acc, u) => {
    acc[u.status] = (acc[u.status] || 0) + 1
    return acc
  }, {})

  const statusOptions = [
    { value: 'tersedia', label: 'Tersedia', color: 'green' },
    { value: 'rusak', label: 'Rusak', color: 'red' },
    { value: 'maintenance', label: 'Maintenance', color: 'orange' },
    { value: 'hilang', label: 'Hilang', color: 'rose' }
  ].filter(opt => opt.value !== selectedStatus)

  return (
    <div className='space-y-5'>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
          duration={4000}
        />
      )}

      {/* Header dengan Back Button */}
      <div className='flex items-center gap-3'>
        <button
          onClick={() => navigate(-1)}
          className='flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors'
        >
          <svg
            width='16'
            height='16'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <line x1='19' y1='12' x2='5' y2='12' />
            <polyline points='12 19 5 12 12 5' />
          </svg>
        </button>
        <div>
          <h1 className='text-lg font-semibold tracking-tight text-gray-900'>
            {loading ? 'Memuat...' : alat?.name ?? 'Detail Unit Alat'}
          </h1>
          <p className='text-sm text-gray-400 mt-0.5'>
            {loading
              ? ''
              : `${data.length} unit terdaftar • Klik unit untuk ubah status`}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {!loading && data.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {Object.entries(counts).map(([status, count]) => {
            const cfg = statusConfig[status] ?? {
              cls: 'bg-gray-50 text-gray-500 border-gray-100'
            }
            return (
              <div
                key={status}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${cfg.cls}`}
              >
                {count} {cfg.label || status}
              </div>
            )
          })}
        </div>
      )}

      {/* Grid Unit */}
      {loading ? (
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className='h-24 animate-pulse rounded-lg border border-gray-100 bg-gray-100'
            />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className='rounded-lg border border-gray-100 bg-white py-16 text-center'>
          <div className='flex flex-col items-center gap-2'>
            <svg
              width='48'
              height='48'
              fill='none'
              stroke='#d1d5db'
              strokeWidth='1'
              viewBox='0 0 24 24'
            >
              <rect x='3' y='3' width='18' height='18' rx='2' />
              <circle cx='8.5' cy='8.5' r='1.5' />
              <polyline points='21,15 16,10 5,21' />
            </svg>
            <p className='text-sm text-gray-400'>
              Belum ada unit untuk alat ini
            </p>
          </div>
        </div>
      ) : (
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
          {data.map(u => {
            const cfg = statusConfig[u.status] ?? {
              cls: 'bg-gray-50 border-gray-100',
              dot: 'bg-gray-400',
              label: u.status
            }
            const isDipinjam = u.status === 'dipinjam'

            return (
              <div
                key={u.id_unit}
                onClick={() => handleCardClick(u)}
                className={`group relative rounded-lg border p-3 transition-all duration-200 cursor-pointer hover:shadow-md
                  ${cfg.cls} ${
                  isDipinjam
                    ? 'cursor-not-allowed opacity-60'
                    : 'hover:border-gray-300'
                }`}
              >
                <div className='flex items-start justify-between mb-2'>
                  <span className='font-mono text-sm font-semibold text-gray-900'>
                    {u.kode_unit}
                  </span>
                  <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                </div>

                <StatusBadge status={u.status} />

                {!isDipinjam && (
                  <div className='mt-2 text-[9px] text-blue-500 opacity-0 group-hover:opacity-100 transition flex items-center gap-1'>
                    <svg
                      width='10'
                      height='10'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                    >
                      <line x1='12' y1='5' x2='12' y2='19' />
                      <line x1='5' y1='12' x2='19' y2='12' />
                    </svg>
                    Ubah status
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Ubah Status */}
      {showModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div
            className='absolute inset-0 bg-black/40 backdrop-animate'
            onClick={closeModal}
          />
          <div className='relative w-full max-w-sm rounded-lg bg-white shadow-xl modal-animate'>
            <div className='border-b border-gray-100 px-5 py-4'>
              <h3 className='text-base font-semibold text-gray-900'>
                Ubah Status Unit
              </h3>
              <p className='text-xs text-gray-400 mt-0.5'>
                Unit:{' '}
                <span className='font-mono font-medium text-gray-600'>
                  {selectedKodeUnit}
                </span>
              </p>
            </div>

            <div className='p-4 space-y-2'>
              {statusOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => changeStatus(option.value)}
                  disabled={submitting}
                  className='w-full text-left px-3 py-2.5 rounded-md border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition flex items-center justify-between group'
                >
                  <div className='flex items-center gap-2'>
                    <div
                      className={`h-2 w-2 rounded-full bg-${option.color}-500`}
                    />
                    <span className='text-sm font-medium text-gray-700'>
                      {option.label}
                    </span>
                  </div>
                  <svg
                    width='14'
                    height='14'
                    fill='none'
                    stroke='#9ca3af'
                    strokeWidth='1.5'
                    viewBox='0 0 24 24'
                    className='opacity-0 group-hover:opacity-100 transition'
                  >
                    <polyline points='9,18 15,12 9,6' />
                  </svg>
                </button>
              ))}
            </div>

            <div className='border-t border-gray-100 px-4 py-3'>
              <button
                onClick={closeModal}
                disabled={submitting}
                className='w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors'
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  )
}
