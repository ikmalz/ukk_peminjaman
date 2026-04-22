import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import { QRCodeCanvas } from 'qrcode.react'
import api from '../../lib/api'

export default function StrukPeminjaman () {
  const { id } = useParams()
  const navigate = useNavigate()
  const socketRef = useRef(null)

  const [unitList, setUnitList] = useState([])
  const [qrToken, setQrToken] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStruk = async () => {
    try {
      const res = await api.get(`/peminjaman/${id}/struk`)
      if (res.data.data.length > 0) {
        setUnitList(res.data.data)
        setQrToken(res.data.data[0].qr_token)
      }
    } catch (err) {
      console.error('Gagal ambil struk:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStruk()
  }, [id])

  useEffect(() => {
    socketRef.current = io('http://localhost:3000')

    socketRef.current.on('peminjaman_disetujui', data => {
      if (String(data.id_peminjaman) === String(id)) {
        fetchStruk()
      }
    })

    return () => socketRef.current.disconnect()
  }, [id])

  const formatWIB = date =>
    new Date(date).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }) + ' WIB'

  if (loading) {
    return (
      <div className='flex h-screen items-center justify-center text-sm text-gray-400'>
        Memuat struk...
      </div>
    )
  }

  if (unitList.length === 0) {
    return (
      <div className='flex h-screen flex-col items-center justify-center px-4 text-center'>
        <p className='text-gray-500 font-medium'>Struk belum tersedia</p>
        <p className='text-xs text-gray-400 mt-1'>
          Peminjaman mungkin belum disetujui admin
        </p>
        <button
          onClick={() => navigate('/peminjam')}
          className='mt-4 px-4 py-2 text-xs bg-gray-900 text-white rounded-lg'
        >
          Kembali ke Daftar Alat
        </button>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8'>
      <div className='w-full max-w-md bg-white rounded-2xl shadow-2xl border p-6'>
        {/* Header */}
        <div className='text-center mb-5'>
          <h1 className='text-xl font-bold text-gray-900'>
            🧾 Struk Peminjaman
          </h1>
          <p className='text-xs text-gray-400'>
            Simpan atau screenshot sebagai bukti
          </p>
        </div>

        {/* Info pengambilan jika belum diambil */}
        {unitList[0]?.status_pengambilan === 'belum_diambil' && (
          <div className='mb-4 p-3 text-sm bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg'>
            📍 Silakan datang ke petugas untuk scan QR dan mengambil barang
          </div>
        )}

        {unitList[0]?.status_pengambilan === 'sudah_diambil' && (
          <div className='mb-4 p-3 text-sm bg-green-50 border border-green-200 text-green-700 rounded-lg'>
            ✅ Barang sudah diambil
          </div>
        )}

        {/* Detail peminjaman */}
        <div className='space-y-2 text-sm text-gray-700 mb-4'>
          <p>
            <b>ID:</b> {unitList[0]?.id_peminjaman}
          </p>
          <p>
            <b>Alat:</b> {unitList[0]?.alat}
          </p>
          <p>
            <b>Tanggal Pinjam:</b> {formatWIB(unitList[0]?.tgl_pinjam)}
          </p>
          <p>
            <b>Kembali:</b> {formatWIB(unitList[0]?.tgl_rencana_kembali)}
          </p>
        </div>

        <div className='flex justify-center my-6 bg-white p-4 rounded-xl shadow-inner'>
          {qrToken ? (
            <QRCodeCanvas
              value={qrToken}
              size={280}
              level='Q'
              includeMargin={true}
              fgColor='#111111'
              bgColor='#ffffff'
            />
          ) : (
            <div className='w-[280px] h-[280px] flex items-center justify-center bg-gray-100 rounded-xl text-sm text-gray-400'>
              ⏳ Menunggu persetujuan admin...
            </div>
          )}
        </div>

        {unitList[0]?.status_pengambilan === 'belum_diambil' && (
          <div className='mt-6 text-center'>
            <p className='text-sm text-gray-600 mb-2'>
              Tunjukkan QR Code ini ke petugas untuk di-scan
            </p>
            <p className='text-xs text-gray-400'>
              Pastikan kamera jelas, jangan terlalu dekat atau terlalu jauh
            </p>
          </div>
        )}

        {/* Kode Unit */}
        <div className='border-t pt-4'>
          <p className='text-xs text-gray-500 mb-2'>Kode Unit</p>
          <div className='grid grid-cols-2 gap-2'>
            {unitList.map(u => (
              <div
                key={u.kode_unit}
                className='border rounded-lg p-2 text-center font-mono text-xs bg-gray-50'
              >
                {u.kode_unit}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className='mt-6 space-y-2'>
          <button
            onClick={() => window.print()}
            className='w-full bg-black text-white py-2 rounded-lg text-xs font-medium'
          >
            Print / Simpan
          </button>
          <button
            onClick={() => navigate('/peminjam')}
            className='w-full border py-2 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition'
          >
            Kembali ke Daftar Alat
          </button>
        </div>
      </div>
    </div>
  )
}
