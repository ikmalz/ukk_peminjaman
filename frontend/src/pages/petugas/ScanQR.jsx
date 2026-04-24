import { Html5QrcodeScanner } from 'html5-qrcode'
import { useEffect, useState, useRef } from 'react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export default function ScanQR () {
  const [scanResult, setScanResult] = useState(null)
  const [error, setError] = useState('')
  const [isScanning, setIsScanning] = useState(true)
  const scannerRef = useRef(null)
  const { user } = useAuth()
  const role = user?.role === 'admin' ? 'Admin' : 'Petugas'

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1,
        disableFlip: false,
        showTorchButtonIfSupported: true
      },
      false
    )

    scanner.render(
      async decodedText => {
        try {
          setError('')
          const res = await api.post('/peminjaman/scan', { token: decodedText })
          setScanResult(res.data)
          setIsScanning(false)
          setTimeout(() => scanner.clear(), 1800)
        } catch (err) {
          const msg =
            err.response?.data?.message ||
            'QR Code tidak valid atau sudah digunakan'
          setError(msg)
          setTimeout(() => setError(''), 3000)
        }
      },
      err => console.warn('Scan error:', err)
    )

    scannerRef.current = scanner

    return () => scanner.clear().catch(() => {})
  }, [])

  const resetScanner = () => {
    setScanResult(null)
    setError('')
    setIsScanning(true)
    window.location.reload()
  }

  const formatDate = date => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .fade-in { animation: fadeIn 0.3s ease-out; }
        .slide-up { animation: slideUp 0.4s ease-out; }
        .pulse-slow { animation: pulse 2s ease-in-out infinite; }
      `}</style>

      {/* Header */}
      <div className='mb-5'>
        <h1 className='text-lg font-semibold tracking-tight text-gray-900'>
          Scan QR Code
        </h1>
        <p className='text-sm text-gray-400 mt-0.5'>
          Arahkan kamera ke QR Code untuk verifikasi peminjaman alat
        </p>
      </div>

      <div className='grid lg:grid-cols-2 gap-5'>
        <div className='rounded-lg border border-gray-100 bg-white overflow-hidden shadow-sm'>
          <div className='border-b border-gray-100 px-4 py-3 bg-gray-50/50'>
            <div className='flex items-center gap-2'>
              <div className='p-1.5 rounded-lg bg-blue-50 text-blue-500'>
                <svg
                  width='16'
                  height='16'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  viewBox='0 0 24 24'
                >
                  <rect x='3' y='3' width='18' height='18' rx='2' />
                  <circle cx='8.5' cy='8.5' r='1.5' />
                  <polyline points='21,15 16,10 5,21' />
                </svg>
              </div>
              <div>
                <h2 className='text-sm font-semibold text-gray-900'>
                  Pemindai QR Code
                </h2>
                <p className='text-[10px] text-gray-400'>
                  Pastikan QR Code terlihat jelas
                </p>
              </div>
            </div>
          </div>
          <div className='p-4'>
            <div className='relative rounded-lg overflow-hidden bg-gray-100'>
              <div id='reader' className='w-full' />
              {isScanning && !scanResult && (
                <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                  <div className='text-center'>
                    <div className='w-12 h-12 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-2' />
                    <p className='text-xs text-gray-400'>Menunggu scan...</p>
                  </div>
                </div>
              )}
            </div>
            <div className='mt-4 flex items-center justify-center gap-2 text-[10px] text-gray-400'>
              <svg
                width='12'
                height='12'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.5'
                viewBox='0 0 24 24'
              >
                <circle cx='12' cy='12' r='10' />
                <line x1='12' y1='8' x2='12' y2='12' />
                <line x1='12' y1='16' x2='12.01' y2='16' />
              </svg>
              Pastikan pencahayaan cukup dan QR berada dalam bingkai
            </div>
          </div>
        </div>

        {/* Result Section */}
        <div className='rounded-lg border border-gray-100 bg-white shadow-sm'>
          <div className='border-b border-gray-100 px-4 py-3 bg-gray-50/50'>
            <div className='flex items-center gap-2'>
              <div className='p-1.5 rounded-lg bg-green-50 text-green-500'>
                <svg
                  width='16'
                  height='16'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  viewBox='0 0 24 24'
                >
                  <polyline points='20,6 9,17 4,12' />
                </svg>
              </div>
              <div>
                <h2 className='text-sm font-semibold text-gray-900'>
                  Hasil Verifikasi
                </h2>
                <p className='text-[10px] text-gray-400'>
                  Informasi peminjaman yang discan
                </p>
              </div>
            </div>
          </div>
          <div className='p-4'>
            {scanResult ? (
              <div className='slide-up'>
                {/* Success Badge */}
                <div className='mb-4 flex items-center gap-3 rounded-lg bg-green-50 border border-green-100 p-3'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 text-xl'>
                    ✅
                  </div>
                  <div>
                    <p className='font-semibold text-green-700 text-sm'>
                      Verifikasi Berhasil
                    </p>
                    <p className='text-[10px] text-green-600'>
                      Peminjaman telah diverifikasi
                    </p>
                  </div>
                </div>

                {/* Info Peminjam */}
                <div className='mb-4'>
                  <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1'>
                    Peminjam
                  </p>
                  <div className='flex items-center gap-2'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 font-semibold text-sm'>
                      {scanResult.peminjam?.charAt(0).toUpperCase()}
                    </div>
                    <p className='font-semibold text-gray-900 text-sm'>
                      {scanResult.peminjam}
                    </p>
                  </div>
                </div>

                {/* Info Alat */}
                <div className='mb-4'>
                  <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1'>
                    Alat
                  </p>
                  <p className='font-semibold text-gray-900 text-sm'>
                    {scanResult.alat}
                  </p>
                  {scanResult.kode_alat && (
                    <p className='text-[10px] font-mono text-gray-400 mt-0.5'>
                      Kode: {scanResult.kode_alat}
                    </p>
                  )}
                </div>

                {/* Tanggal */}
                <div className='grid grid-cols-2 gap-3 mb-4'>
                  <div className='rounded-md bg-gray-50 p-2'>
                    <p className='text-[9px] text-gray-400 mb-0.5'>
                      Tanggal Pinjam
                    </p>
                    <p className='text-xs font-medium text-gray-700'>
                      {formatDate(scanResult.tgl_pinjam)}
                    </p>
                  </div>
                  <div className='rounded-md bg-gray-50 p-2'>
                    <p className='text-[9px] text-gray-400 mb-0.5'>
                      Jatuh Tempo
                    </p>
                    <p className='text-xs font-medium text-gray-700'>
                      {formatDate(scanResult.tgl_jatuh_tempo)}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className='mb-4'>
                  <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1'>
                    Status
                  </p>
                  <span className='inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-medium text-green-600 border border-green-100'>
                    <span className='h-1.5 w-1.5 rounded-full bg-green-500' />
                    Sudah Diambil / Terverifikasi
                  </span>
                </div>

                {/* Tombol Scan Lagi */}
                <button
                  onClick={resetScanner}
                  className='mt-2 w-full rounded-md bg-gray-900 py-2 text-xs font-medium text-white hover:bg-gray-800 transition-colors shadow-sm'
                >
                  Scan QR Lagi
                </button>
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-12 text-center'>
                <div className='mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
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
                <p className='text-sm text-gray-400'>Belum ada hasil scan</p>
                <p className='text-[10px] text-gray-300 mt-1'>
                  Arahkan kamera ke QR Code peminjaman
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Toast Notification */}
      {error && (
        <div className='fixed bottom-5 left-1/2 -translate-x-1/2 z-50 fade-in'>
          <div className='flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-4 py-2 shadow-md'>
            <div className='flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-500'>
              <svg
                width='12'
                height='12'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                viewBox='0 0 24 24'
              >
                <line x1='18' y1='6' x2='6' y2='18' />
                <line x1='6' y1='6' x2='18' y2='18' />
              </svg>
            </div>
            <span className='text-xs text-red-600'>{error}</span>
          </div>
        </div>
      )}
    </div>
  )
}
