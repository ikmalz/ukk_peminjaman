// KonfigurasiDenda.jsx - Versi dengan Toast Notification
import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import Toast from '../../components/Toast'

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-gray-100 placeholder:text-gray-400'

export default function KonfigurasiDenda () {
  const [config, setConfig] = useState({
    tarif_per_hari_terlambat: 10000,
    persen_rusak_ringan: 25,
    persen_rusak_berat: 70,
    persen_hilang: 100
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  })
  const { user } = useAuth()

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
  }

  const closeToast = () => {
    setToast({ show: false, message: '', type: 'success' })
  }

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const res = await api.get('/denda/konfigurasi')
      setConfig(res.data.data)
    } catch (err) {
      console.error(err)
      showToast('Gagal memuat konfigurasi denda', 'error')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'petugas') {
      console.warn('Akses ditolak')
    }
    fetchConfig()
  }, [])

  const handleChange = e => {
    const { name, value } = e.target
    setConfig(prev => ({ ...prev, [name]: parseFloat(value) || 0 }))
  }

  const saveConfig = async e => {
    e.preventDefault()
    setSaving(true)

    try {
      await api.put('/denda/konfigurasi', config)
      showToast('Konfigurasi denda berhasil disimpan', 'success')
      fetchConfig() // Refresh data
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Gagal menyimpan konfigurasi',
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  const formatRupiah = value => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  return (
    <div>
      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
          duration={4000}
        />
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-animate {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>

      {/* Header */}
      <div className='mb-5'>
        <h1 className='text-lg font-semibold tracking-tight text-gray-900'>
          Konfigurasi Denda
        </h1>
        <p className='text-sm text-gray-400 mt-0.5'>
          Atur tarif denda keterlambatan dan persentase denda kerusakan
        </p>
      </div>

      {/* Main Card */}
      <div className='rounded-lg border border-gray-100 bg-white overflow-hidden shadow-sm'>
        {/* Info Banner */}
        <div className='bg-gray-50/50 border-b border-gray-100 px-4 py-3'>
          <div className='flex items-center gap-2'>
            <svg
              width='16'
              height='16'
              fill='none'
              stroke='#6b7280'
              strokeWidth='1.5'
              viewBox='0 0 24 24'
            >
              <circle cx='12' cy='12' r='10' />
              <line x1='12' y1='8' x2='12' y2='12' />
              <line x1='12' y1='16' x2='12.01' y2='16' />
            </svg>
            <p className='text-xs text-gray-500'>
              Pengaturan ini akan mempengaruhi perhitungan denda secara otomatis
              pada semua peminjaman
            </p>
          </div>
        </div>

        <form onSubmit={saveConfig}>
          {/* Denda Keterlambatan */}
          <div className='p-4 border-b border-gray-100'>
            <div className='flex items-center gap-2 mb-3'>
              <div className='p-1.5 rounded-lg bg-red-50 text-red-500'>
                <svg
                  width='16'
                  height='16'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  viewBox='0 0 24 24'
                >
                  <circle cx='12' cy='12' r='10' />
                  <line x1='12' y1='8' x2='12' y2='12' />
                  <line x1='12' y1='16' x2='12.01' y2='16' />
                </svg>
              </div>
              <h2 className='text-sm font-semibold text-gray-900'>
                Denda Keterlambatan
              </h2>
            </div>
            <div className='ml-7'>
              <label className='mb-1.5 block text-xs font-medium text-gray-600'>
                Tarif per Hari
              </label>
              <div className='relative max-w-xs'>
                <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm'>
                  Rp
                </span>
                <input
                  type='number'
                  name='tarif_per_hari_terlambat'
                  value={config.tarif_per_hari_terlambat}
                  onChange={handleChange}
                  className={`${inputCls} pl-8`}
                  min='0'
                  step='1000'
                />
              </div>
              <p className='mt-1.5 text-[10px] text-gray-400'>
                Denda yang dikenakan per hari keterlambatan. Default: Rp 10.000
              </p>
              <div className='mt-2 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5'>
                <span className='text-[9px] font-medium text-gray-500'>
                  Contoh:
                </span>
                <span className='text-[9px] text-gray-400'>
                  Terlambat 5 hari ={' '}
                  {formatRupiah(config.tarif_per_hari_terlambat * 5)}
                </span>
              </div>
            </div>
          </div>

          {/* Denda Kerusakan */}
          <div className='p-4'>
            <div className='flex items-center gap-2 mb-3'>
              <div className='p-1.5 rounded-lg bg-amber-50 text-amber-500'>
                <svg
                  width='16'
                  height='16'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  viewBox='0 0 24 24'
                >
                  <path d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' />
                </svg>
              </div>
              <h2 className='text-sm font-semibold text-gray-900'>
                Denda Kerusakan & Kehilangan
              </h2>
            </div>
            <div className='ml-7 grid grid-cols-1 md:grid-cols-3 gap-4'>
              {/* Rusak Ringan */}
              <div>
                <label className='mb-1.5 block text-xs font-medium text-gray-600'>
                  Rusak Ringan
                </label>
                <div className='relative'>
                  <input
                    type='number'
                    name='persen_rusak_ringan'
                    value={config.persen_rusak_ringan}
                    onChange={handleChange}
                    className={inputCls}
                    min='0'
                    max='100'
                    step='5'
                  />
                  <span className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm'>
                    %
                  </span>
                </div>
                <p className='mt-1 text-[10px] text-gray-400'>
                  Default: 25% dari harga alat
                </p>
                <div className='mt-1 text-[9px] text-gray-400'>
                  Kerusakan minor yang masih bisa diperbaiki
                </div>
              </div>

              {/* Rusak Berat */}
              <div>
                <label className='mb-1.5 block text-xs font-medium text-gray-600'>
                  Rusak Berat
                </label>
                <div className='relative'>
                  <input
                    type='number'
                    name='persen_rusak_berat'
                    value={config.persen_rusak_berat}
                    onChange={handleChange}
                    className={inputCls}
                    min='0'
                    max='100'
                    step='5'
                  />
                  <span className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm'>
                    %
                  </span>
                </div>
                <p className='mt-1 text-[10px] text-gray-400'>
                  Default: 70% dari harga alat
                </p>
                <div className='mt-1 text-[9px] text-gray-400'>
                  Kerusakan parah, perlu perbaikan besar
                </div>
              </div>

              {/* Hilang */}
              <div>
                <label className='mb-1.5 block text-xs font-medium text-gray-600'>
                  Hilang
                </label>
                <div className='relative'>
                  <input
                    type='number'
                    name='persen_hilang'
                    value={config.persen_hilang}
                    onChange={handleChange}
                    className={inputCls}
                    min='0'
                    max='100'
                    step='5'
                  />
                  <span className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm'>
                    %
                  </span>
                </div>
                <p className='mt-1 text-[10px] text-gray-400'>
                  Default: 100% dari harga alat
                </p>
                <div className='mt-1 text-[9px] text-gray-400'>
                  Alat tidak dapat ditemukan/dikembalikan
                </div>
              </div>
            </div>

            {/* Preview Calculation */}
            <div className='ml-7 mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100'>
              <p className='text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2'>
                Preview Perhitungan
              </p>
              <div className='flex flex-wrap gap-3 text-xs'>
                <div className='flex items-center gap-1'>
                  <span className='w-2 h-2 rounded-full bg-green-500' />
                  <span className='text-gray-500'>Rusak Ringan:</span>
                  <span className='font-medium text-gray-700'>
                    {config.persen_rusak_ringan}%
                  </span>
                </div>
                <div className='flex items-center gap-1'>
                  <span className='w-2 h-2 rounded-full bg-orange-500' />
                  <span className='text-gray-500'>Rusak Berat:</span>
                  <span className='font-medium text-gray-700'>
                    {config.persen_rusak_berat}%
                  </span>
                </div>
                <div className='flex items-center gap-1'>
                  <span className='w-2 h-2 rounded-full bg-red-500' />
                  <span className='text-gray-500'>Hilang:</span>
                  <span className='font-medium text-gray-700'>
                    {config.persen_hilang}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className='border-t border-gray-100 p-4 bg-gray-50/30'>
            <button
              type='submit'
              disabled={saving}
              className='w-full rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-60 shadow-sm'
            >
              {saving ? (
                <span className='flex items-center justify-center gap-2'>
                  <svg
                    className='animate-spin h-4 w-4'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    />
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                    />
                  </svg>
                  Menyimpan...
                </span>
              ) : (
                'Simpan Konfigurasi'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Informasi Tambahan */}
      <div className='mt-4 rounded-lg border border-gray-100 bg-white p-3 shadow-sm'>
        <div className='flex items-start gap-2'>
          <svg
            width='14'
            height='14'
            fill='none'
            stroke='#9ca3af'
            strokeWidth='1.5'
            viewBox='0 0 24 24'
          >
            <circle cx='12' cy='12' r='10' />
            <path d='M12 16v-4M12 8h.01' />
          </svg>
          <div>
            <p className='text-[10px] font-medium text-gray-500 uppercase tracking-wider'>
              Informasi
            </p>
            <p className='text-[11px] text-gray-400 mt-0.5'>
              Perubahan konfigurasi akan langsung berlaku untuk perhitungan
              denda baru. Denda yang sudah terhitung sebelumnya tidak akan
              berubah.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
