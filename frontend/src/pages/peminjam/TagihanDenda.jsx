import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'

const fmt = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')

const formatDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

const sisaHari = (batas) => {
  if (!batas) return null
  const diff = Math.ceil((new Date(batas) - new Date()) / 86400000)
  return diff
}

const kondisiLabel = {
  normal: 'Normal',
  rusak_ringan: 'Rusak Ringan',
  rusak_berat: 'Rusak Berat',
  hilang: 'Hilang',
}

export default function TagihanDenda() {
  const [denda, setDenda] = useState([])
  const [loading, setLoading] = useState(true)
  const [userBlocked, setUserBlocked] = useState(false)
  const [tab, setTab] = useState('belum') 
  const navigate = useNavigate()

  const fetchDenda = async () => {
    setLoading(true)
    try {
      const res = await api.get('/denda/saya')
      setDenda(res.data.data || [])
    } catch (err) {
      if (err.response?.data?.is_blocked) setUserBlocked(true)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const checkBlokir = async () => {
      try {
        const res = await api.get('/auth/me')
        setUserBlocked(res.data?.data?.is_blocked || false)
      } catch {}
    }
    checkBlokir()
    fetchDenda()
  }, [])

  const belumLunas = useMemo(() => denda.filter(d => d.status_bayar !== 'lunas'), [denda])
  const sudahLunas = useMemo(() => denda.filter(d => d.status_bayar === 'lunas'), [denda])
  const displayed = tab === 'belum' ? belumLunas : sudahLunas

  const totalTagihan = belumLunas.reduce((s, d) => s + Number(d.total_denda), 0)

  if (loading) return (
    <div className='flex justify-center items-center py-16'>
      <div className='h-6 w-6 border-2 border-gray-200 border-t-gray-700 rounded-full animate-spin' />
    </div>
  )

  return (
    <div className='space-y-5 pb-10'>
      {/* Header */}
      <div>
        <h1 className='text-lg font-semibold tracking-tight text-gray-900'>Tagihan Denda</h1>
        <p className='text-sm text-gray-400 mt-0.5'>Daftar denda peminjaman kamu</p>
      </div>

      {/* Banner blokir */}
      {userBlocked && (
        <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
          <div className='flex items-start gap-3'>
            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-red-100 shrink-0'>
              <svg width='16' height='16' fill='none' stroke='#dc2626' strokeWidth='2' viewBox='0 0 24 24'>
                <circle cx='12' cy='12' r='10'/><line x1='12' y1='8' x2='12' y2='12'/><line x1='12' y1='16' x2='12.01' y2='16'/>
              </svg>
            </div>
            <div>
              <p className='text-sm font-semibold text-red-700'>Akun Anda Diblokir</p>
              <p className='text-xs text-red-600 mt-0.5'>
                Kamu tidak dapat melakukan peminjaman baru karena ada denda yang melewati batas waktu pembayaran.
                Segera datang ke petugas untuk menyelesaikan pembayaran.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary card */}
      {belumLunas.length > 0 && (
        <div className='rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-4'>
          <p className='text-xs font-medium text-orange-400 uppercase tracking-wider'>Total tagihan belum lunas</p>
          <p className='text-2xl font-bold text-orange-600 mt-1'>{fmt(totalTagihan)}</p>
          <p className='text-xs text-orange-500 mt-1'>{belumLunas.length} tagihan perlu diselesaikan</p>
          <div className='mt-3 rounded-md bg-orange-100/60 px-3 py-2'>
            <p className='text-xs text-orange-700'>
              📍 Segera datang ke petugas, tunjukkan kode VA tagihan untuk melakukan pembayaran cash.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className='flex gap-1'>
        {[
          { key: 'belum', label: 'Belum Lunas', count: belumLunas.length },
          { key: 'lunas', label: 'Sudah Lunas', count: sudahLunas.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              tab === t.key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                tab === t.key
                  ? t.key === 'belum' ? 'bg-red-400 text-white' : 'bg-green-400 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {displayed.length === 0 ? (
        <div className='rounded-lg border border-gray-100 bg-white py-12 text-center'>
          <p className='text-sm text-gray-400'>
            {tab === 'belum' ? 'Tidak ada tagihan denda' : 'Belum ada riwayat denda yang lunas'}
          </p>
        </div>
      ) : (
        <div className='space-y-3'>
          {displayed.map(d => {
            const sisa = sisaHari(d.batas_bayar)
            const isLewat = d.lewat_batas || (sisa !== null && sisa < 0)
            const isMendesak = sisa !== null && sisa >= 0 && sisa <= 1
            const isLunas = d.status_bayar === 'lunas'

            return (
              <div
                key={d.id_denda}
                className={`rounded-xl border overflow-hidden ${
                  isLunas ? 'border-gray-100 bg-white'
                  : isLewat ? 'border-red-200 bg-red-50/30'
                  : isMendesak ? 'border-orange-200 bg-orange-50/30'
                  : 'border-gray-200 bg-white'
                }`}
              >
                {/* Header strip */}
                {!isLunas && (isLewat || isMendesak) && (
                  <div className={`px-4 py-1.5 text-[10px] font-semibold ${
                    isLewat ? 'bg-red-500 text-white' : 'bg-orange-400 text-white'
                  }`}>
                    {isLewat ? '⚠ Batas waktu terlewat — akun berpotensi diblokir' : `⏰ Sisa ${sisa} hari untuk membayar`}
                  </div>
                )}

                <div className='p-4'>
                  <div className='flex justify-between items-start gap-2 mb-3'>
                    <div>
                      <p className='font-semibold text-gray-900 text-sm'>{d.alat}</p>
                      <p className='text-xs text-gray-400 mt-0.5'>Dikembalikan {formatDate(d.tgl_kembali)}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium border ${
                      isLunas ? 'bg-green-50 text-green-600 border-green-100'
                              : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isLunas ? 'bg-green-500' : 'bg-red-500'}`}/>
                      {isLunas ? 'Lunas' : 'Belum Lunas'}
                    </span>
                  </div>

                  {/* Nominal */}
                  <div className='rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5 mb-3'>
                    <div className='flex justify-between items-center'>
                      <span className='text-xs text-gray-500'>Total Denda</span>
                      <span className='text-base font-bold text-gray-900'>{fmt(d.total_denda)}</span>
                    </div>
                    {d.hari_terlambat > 0 && (
                      <div className='flex justify-between items-center mt-1'>
                        <span className='text-[10px] text-gray-400'>Keterlambatan {d.hari_terlambat} hari</span>
                        <span className='text-[10px] text-gray-500'>termasuk dalam total</span>
                      </div>
                    )}
                    {d.kondisi_laporan && d.kondisi_laporan !== 'normal' && (
                      <div className='flex justify-between items-center mt-1'>
                        <span className='text-[10px] text-gray-400'>Kondisi: {kondisiLabel[d.kondisi_laporan] ?? d.kondisi_laporan}</span>
                      </div>
                    )}
                  </div>

                  {/* Info kode VA & batas bayar */}
                  {!isLunas && d.kode_va && (
                    <div className='rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2.5 mb-3'>
                      <p className='text-[10px] text-blue-500 font-medium uppercase tracking-wider mb-1'>Kode VA Tagihan</p>
                      <p className='font-mono text-sm font-bold text-blue-700 tracking-wider'>{d.kode_va}</p>
                      {d.batas_bayar && (
                        <p className='text-[10px] text-blue-500 mt-1'>Batas bayar: {formatDate(d.batas_bayar)}</p>
                      )}
                      <p className='text-[10px] text-blue-400 mt-2'>
                        Tunjukkan kode ini ke petugas saat datang membayar
                      </p>
                    </div>
                  )}

                  {!isLunas && !d.kode_va && (
                    <div className='rounded-md bg-amber-50 border border-amber-100 px-3 py-2 mb-3'>
                      <p className='text-xs text-amber-700'>
                        📋 Datanglah ke petugas untuk mendapatkan kode VA dan melakukan pembayaran.
                      </p>
                    </div>
                  )}

                  {/* Struk jika lunas */}
                  {isLunas && d.kode_struk && (
                    <div className='rounded-lg border border-green-100 bg-green-50/50 px-3 py-2.5 mb-3'>
                      <p className='text-[10px] text-green-600 font-medium uppercase tracking-wider mb-1'>Bukti Pembayaran</p>
                      <p className='font-mono text-xs text-green-700 tracking-wider'>{d.kode_struk}</p>
                      <p className='text-[10px] text-green-500 mt-1'>Dibayar pada {formatDate(d.tgl_bayar_struk)}</p>
                      {d.nama_petugas && (
                        <p className='text-[10px] text-green-500'>Diproses oleh: {d.nama_petugas}</p>
                      )}
                    </div>
                  )}

                  {/* Tombol lihat struk */}
                  {isLunas && (
                    <button
                      onClick={() => navigate(`/peminjam/struk-denda/${d.id_denda}`)}
                      className='w-full rounded-lg border border-gray-200 bg-white py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition'
                    >
                      Lihat Struk Pembayaran
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}