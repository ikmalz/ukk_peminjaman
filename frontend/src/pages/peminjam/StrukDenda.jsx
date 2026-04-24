import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

const fmt = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID')

const formatDateFull = d => {
  if (!d) return '-'
  return (
    new Date(d).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WIB'
  )
}

const formatDate = d => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const kondisiLabel = {
  normal: 'Normal',
  rusak_ringan: 'Rusak Ringan',
  rusak_berat: 'Rusak Berat',
  hilang: 'Hilang'
}

export default function StrukDenda () {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const strRef = useRef()

  const isPetugas = user?.role === 'petugas' || user?.role === 'admin'

  useEffect(() => {
    const fetchStruk = async () => {
      console.log(`🔄 Fetching struk untuk ID: ${id}`) 
      setLoading(true)
      try {
        const res = await api.get(`/denda/${id}/struk`)
        console.log('📄 Response struk:', res.data) 
        setData(res.data.data)
      } catch (err) {
        console.error(
          '❌ Error fetch struk:',
          err.response?.data || err.message
        )
        setError(err.response?.data?.message || 'Struk tidak ditemukan')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchStruk()
    }
  }, [id])

  if (loading)
    return (
      <div className='flex h-screen items-center justify-center text-sm text-gray-400'>
        Memuat struk...
      </div>
    )

  if (error || !data)
    return (
      <div className='flex h-screen flex-col items-center justify-center px-4 text-center'>
        <p className='text-gray-500 font-medium'>
          {error || 'Struk tidak ditemukan'}
        </p>
        <button
          onClick={() => navigate(-1)}
          className='mt-4 px-4 py-2 text-xs bg-gray-900 text-white rounded-lg'
        >
          Kembali
        </button>
      </div>
    )

  const isLunas = data.status_bayar === 'lunas' || !!data.kode_struk

  const qrValue = JSON.stringify({
    kode_struk: data.kode_struk,
    id_denda: data.id_denda,
    peminjam: data.peminjam,
    nominal: data.total_denda,
    tgl_bayar: data.tgl_bayar
  })

  const qrTagihan = JSON.stringify({
    kode_va: data.kode_va,
    id_denda: data.id_denda,
    peminjam: data.peminjam,
    nominal: data.total_denda
  })

  return (
    <div className='min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8'>
      <div
        ref={strRef}
        className='w-full max-w-md bg-white rounded-2xl shadow-2xl border overflow-hidden'
      >
        {/* Status banner */}
        <div
          className={`px-6 py-3 text-center ${
            isLunas ? 'bg-gray-500' : 'bg-orange-400'
          }`}
        >
          <p className='text-white text-sm font-semibold'>
            {isLunas
              ? '✅ Pembayaran Denda Lunas'
              : '⏳ Tagihan Denda Belum Dibayar'}
          </p>
        </div>

        <div className='p-6'>
          {/* Header */}
          <div className='text-center mb-5'>
            <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1'>
              {isLunas ? 'Struk Pembayaran Denda' : 'Tagihan Denda'}
            </p>
            <h1 className='text-xl font-bold text-gray-900'>
              {isLunas
                ? data.kode_struk
                : data.kode_va || `DENDA-${String(id).padStart(6, '0')}`}
            </h1>
            <p className='text-xs text-gray-400 mt-1'>
              {isLunas
                ? formatDateFull(data.tgl_bayar)
                : `Dibuat: ${formatDateFull(data.tgl_denda_dibuat)}`}
            </p>
          </div>

          <div className='space-y-2 text-sm mb-4 border border-gray-100 rounded-xl p-4'>
            <div className='flex justify-between'>
              <span className='text-gray-400 text-xs'>Peminjam</span>
              <span className='font-semibold text-gray-900 text-xs'>
                {data.peminjam}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-400 text-xs'>Alat</span>
              <span className='text-gray-700 text-xs'>{data.alat}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-400 text-xs'>Tgl Kembali</span>
              <span className='text-gray-700 text-xs'>
                {formatDate(data.tgl_kembali)}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-400 text-xs'>Jatuh Tempo</span>
              <span className='text-gray-700 text-xs'>
                {formatDate(data.tgl_jatuh_tempo)}
              </span>
            </div>
            {data.hari_terlambat > 0 && (
              <div className='flex justify-between'>
                <span className='text-gray-400 text-xs'>Keterlambatan</span>
                <span className='text-red-600 font-medium text-xs'>
                  {data.hari_terlambat} hari
                </span>
              </div>
            )}
            {data.kondisi_laporan && data.kondisi_laporan !== 'normal' && (
              <div className='flex justify-between'>
                <span className='text-gray-400 text-xs'>Kondisi</span>
                <span className='text-orange-600 font-medium text-xs'>
                  {kondisiLabel[data.kondisi_laporan] ?? data.kondisi_laporan}
                </span>
              </div>
            )}
            <div className='border-t border-gray-100 pt-2 mt-2 flex justify-between'>
              <span className='text-gray-600 text-xs font-semibold'>
                Total Denda
              </span>
              <span className='text-gray-900 font-bold text-base'>
                {fmt(data.total_denda)}
              </span>
            </div>
            {isLunas && (
              <>
                <div className='flex justify-between'>
                  <span className='text-gray-400 text-xs'>Metode</span>
                  <span className='text-gray-700 text-xs capitalize'>
                    {data.metode || 'Cash'}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-400 text-xs'>Petugas</span>
                  <span className='text-gray-700 text-xs'>
                    {data.nama_petugas || '-'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Unit bermasalah */}
          {data.unit_bermasalah?.length > 0 && (
            <div className='mb-4'>
              <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2'>
                Unit Bermasalah
              </p>
              <div className='grid grid-cols-2 gap-2'>
                {data.unit_bermasalah.map(u => (
                  <div
                    key={u.id_unit}
                    className='border border-orange-100 rounded-lg p-2 bg-orange-50/30'
                  >
                    <p className='font-mono text-xs font-bold text-gray-800'>
                      {u.kode_unit}
                    </p>
                    <p className='text-[10px] text-orange-600 mt-0.5'>
                      {kondisiLabel[u.kondisi_final] ?? u.kondisi_final}
                    </p>
                    {u.catatan_petugas && (
                      <p className='text-[10px] text-gray-500 mt-0.5'>
                        {u.catatan_petugas}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QR Code */}
          <div className='flex justify-center my-5 bg-gray-50 rounded-xl p-4 border border-gray-100'>
            <div className='text-center'>
              {isLunas ? (
                <>
                  <QRCodeCanvas
                    value={qrValue}
                    size={200}
                    level='H'
                    includeMargin={true}
                    fgColor='#111111'
                    bgColor='#f9fafb'
                  />
                  <p className='text-[10px] text-gray-400 mt-2'>
                    QR Bukti Pembayaran
                  </p>
                </>
              ) : data.kode_va ? (
                <>
                  <QRCodeCanvas
                    value={qrTagihan}
                    size={200}
                    level='Q'
                    includeMargin={true}
                    fgColor='#111111'
                    bgColor='#f9fafb'
                  />
                  <p className='text-[10px] text-gray-400 mt-2'>
                    QR Tagihan — Tunjukkan ke petugas
                  </p>
                </>
              ) : (
                <div className='w-[200px] h-[200px] flex items-center justify-center bg-gray-100 rounded-xl text-xs text-gray-400 text-center px-4'>
                  Tagihan belum diproses petugas
                </div>
              )}
            </div>
          </div>

          {/* Catatan */}
          {data.catatan && (
            <div className='mb-4 rounded-md bg-blue-50 border border-blue-100 px-3 py-2'>
              <p className='text-[10px] text-blue-500 font-medium'>
                Catatan Petugas
              </p>
              <p className='text-xs text-blue-700 mt-0.5'>{data.catatan}</p>
            </div>
          )}

          {!isLunas && !data.kode_va && (
            <div className='mb-4 rounded-md bg-amber-50 border border-amber-100 px-3 py-2 text-center'>
              <p className='text-xs text-amber-700'>
                📍 Datang ke petugas untuk mendapatkan kode VA dan melakukan
                pembayaran
              </p>
            </div>
          )}

          {!isLunas && data.batas_bayar && (
            <div className='mb-4 rounded-md bg-red-50 border border-red-100 px-3 py-2 text-center'>
              <p className='text-xs text-red-600 font-medium'>
                Batas pembayaran: {formatDate(data.batas_bayar)}
              </p>
              <p className='text-[10px] text-red-500 mt-0.5'>
                Melewati batas waktu akan mengakibatkan akun diblokir dari
                peminjaman
              </p>
            </div>
          )}

          {/* Actions */}
          <div className='space-y-2 mt-2'>
            <button
              onClick={() => window.print()}
              className='w-full bg-gray-900 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-800 transition'
            >
              🖨 Print / Simpan Struk
            </button>
            {isPetugas && !isLunas && (
              <button
                onClick={() => navigate('/petugas/kasir-denda')}
                className='w-full border border-green-200 bg-green-50 py-2 rounded-xl text-xs font-medium text-green-700 hover:bg-green-100 transition'
              >
                Proses Pembayaran
              </button>
            )}
            <button
              onClick={() => navigate(-1)}
              className='w-full border border-gray-200 py-2 rounded-xl text-xs text-gray-600 hover:bg-gray-50 transition'
            >
              Kembali
            </button>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #root { visibility: visible; }
          .rounded-2xl { visibility: visible; box-shadow: none !important; }
          button { display: none !important; }
          .min-h-screen { background: white !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  )
}
