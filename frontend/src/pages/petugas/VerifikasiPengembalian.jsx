import { useEffect, useMemo, useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import api from '../../lib/api'
import { io } from 'socket.io-client'
import { useAuth } from '../../context/AuthContext'
import Toast from '../../components/Toast'

const formatDate = d =>
  new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

const terlambatHari = (jatuhTempo, kembali) => {
  if (!jatuhTempo || !kembali) return 0
  const diff = Math.ceil((new Date(kembali) - new Date(jatuhTempo)) / 86400000)
  return diff > 0 ? diff : 0
}

const KONDISI_OPTS = [
  { value: 'normal', label: 'Normal', color: 'green' },
  { value: 'rusak_ringan', label: 'Rusak Ringan', color: 'yellow' },
  { value: 'rusak_berat', label: 'Rusak Berat', color: 'orange' },
  { value: 'hilang', label: 'Hilang', color: 'red' }
]

const KONDISI_BADGE = {
  green: 'bg-green-50 text-green-600 border-green-100',
  yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
  orange: 'bg-orange-50 text-orange-600 border-orange-100',
  red: 'bg-red-50 text-red-600 border-red-100'
}

const getKondisiStyle = val => {
  const opt = KONDISI_OPTS.find(o => o.value === val)
  return KONDISI_BADGE[opt?.color] ?? 'bg-gray-50 text-gray-500 border-gray-100'
}

const getKondisiLabel = val =>
  KONDISI_OPTS.find(o => o.value === val)?.label ?? val ?? '-'

function FormVerifikasiUnit ({
  units,
  kondisiMap,
  onKondisiChange,
  onCatatanChange
}) {
  return (
    <div className='space-y-2 mt-3'>
      <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1'>
        Set Kondisi Per Unit
      </p>
      {units.map(unit => {
        const kondisi = kondisiMap[unit.id_unit]?.kondisi ?? 'normal'
        const catatan = kondisiMap[unit.id_unit]?.catatan ?? ''
        return (
          <div
            key={unit.id_unit}
            className={`rounded-lg border p-3 transition-colors ${
              kondisi === 'normal'
                ? 'border-gray-100 bg-gray-50/30'
                : kondisi === 'rusak_ringan'
                ? 'border-yellow-100 bg-yellow-50/30'
                : kondisi === 'rusak_berat'
                ? 'border-orange-100 bg-orange-50/30'
                : 'border-red-100 bg-red-50/30'
            }`}
          >
            <div className='flex items-center gap-2 mb-2'>
              <span className='inline-flex items-center justify-center h-5 w-5 rounded bg-gray-200 text-[10px] font-bold text-gray-600'>
                #
              </span>
              <span className='text-xs font-semibold text-gray-800'>
                {unit.kode_unit}
              </span>
            </div>
            <div className='flex flex-wrap gap-2'>
              <select
                value={kondisi}
                onChange={e => onKondisiChange(unit.id_unit, e.target.value)}
                className='flex-1 min-w-[140px] rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-100'
              >
                {KONDISI_OPTS.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {kondisi !== 'normal' && (
                <input
                  type='text'
                  placeholder='Catatan kondisi...'
                  value={catatan}
                  onChange={e => onCatatanChange(unit.id_unit, e.target.value)}
                  className='flex-1 min-w-[160px] rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-100'
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RingkasanKondisi ({ units }) {
  const counts = { normal: 0, rusak_ringan: 0, rusak_berat: 0, hilang: 0 }
  units.forEach(u => {
    if (u.kondisi_final && counts[u.kondisi_final] !== undefined) {
      counts[u.kondisi_final]++
    }
  })
  return (
    <div className='flex flex-wrap gap-1 mt-1'>
      {Object.entries(counts).map(([k, v]) =>
        v > 0 ? (
          <span
            key={k}
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${getKondisiStyle(
              k
            )}`}
          >
            {v}× {getKondisiLabel(k)}
          </span>
        ) : null
      )}
    </div>
  )
}

export default function VerifikasiPengembalian () {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('verifikasi')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [kondisiMap, setKondisiMap] = useState({})
  const [confirmData, setConfirmData] = useState(null) 
  const [loadingVerif, setLoadingVerif] = useState(false)
  const [expandedId, setExpandedId] = useState(null) 
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  })
  const socketRef = useRef(null)
  const LIMIT = 6

  const showToast = (message, type = 'success') =>
    setToast({ show: true, message, type })
  const closeToast = () =>
    setToast({ show: false, message: '', type: 'success' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/pengembalian')
      const rows = res.data.data || []
      setData(rows)

      const initMap = {}
      rows.forEach(p => {
        if (p.status_verifikasi === 'menunggu' && p.units?.length) {
          initMap[p.id_pengembalian] = {}
          p.units.forEach(u => {
            initMap[p.id_pengembalian][u.id_unit] = {
              kondisi: 'normal',
              catatan: ''
            }
          })
        }
      })
      setKondisiMap(prev => ({ ...initMap, ...prev }))
      setError('')
    } catch (err) {
      console.error(err)
      setError('Gagal mengambil data pengembalian')
      showToast('Gagal mengambil data pengembalian', 'error')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    socketRef.current = io('http://localhost:3000')
    socketRef.current.on('pengembalian_update', () => {
      fetchData()
      showToast('Data pengembalian diperbarui', 'success')
    })
    return () => socketRef.current.disconnect()
  }, [])

  const handleKondisiChange = (id_pengembalian, id_unit, kondisi) => {
    setKondisiMap(prev => ({
      ...prev,
      [id_pengembalian]: {
        ...prev[id_pengembalian],
        [id_unit]: { ...prev[id_pengembalian]?.[id_unit], kondisi }
      }
    }))
  }

  const handleCatatanChange = (id_pengembalian, id_unit, catatan) => {
    setKondisiMap(prev => ({
      ...prev,
      [id_pengembalian]: {
        ...prev[id_pengembalian],
        [id_unit]: { ...prev[id_pengembalian]?.[id_unit], catatan }
      }
    }))
  }

  const handleVerifikasi = async () => {
    if (loadingVerif || !confirmData) return
    setLoadingVerif(true)
    try {
      const { id_pengembalian, units } = confirmData
      const unitKondisi = kondisiMap[id_pengembalian] || {}

      const kondisi_units = units.map(u => ({
        id_unit: u.id_unit,
        kondisi_final: unitKondisi[u.id_unit]?.kondisi ?? 'normal',
        catatan: unitKondisi[u.id_unit]?.catatan ?? ''
      }))

      const res = await api.patch(
        `/pengembalian/${id_pengembalian}/verifikasi`,
        {
          kondisi_units
        }
      )

      const { totalDenda, ringkasanKondisi, peminjaman_selesai } = res.data
      const fmtDenda = 'Rp ' + Number(totalDenda).toLocaleString('id-ID')
      const msg = peminjaman_selesai
        ? `Verifikasi selesai! Semua unit dikembalikan. Denda: ${fmtDenda}`
        : `Verifikasi batch selesai. Denda: ${fmtDenda}. Masih ada unit yang dipinjam.`

      showToast(msg, 'success')
      setConfirmData(null)
      fetchData()
    } catch (err) {
      showToast(
        err.response?.data?.message || 'Gagal verifikasi pengembalian',
        'error'
      )
    } finally {
      setLoadingVerif(false)
    }
  }

  const exportExcel = () => {
    const rows = []
    filteredData.forEach((p, i) => {
      const terlambat = terlambatHari(p.tgl_jatuh_tempo, p.tgl_kembali)
      ;(p.units || []).forEach(u => {
        rows.push({
          No: i + 1,
          'ID Pengembalian': p.id_pengembalian,
          Peminjam: p.peminjam || '-',
          Alat: p.alat || '-',
          'Kode Unit': u.kode_unit || '-',
          'Tgl Dikembalikan': p.tgl_kembali ? formatDate(p.tgl_kembali) : '-',
          'Tgl Jatuh Tempo': p.tgl_jatuh_tempo
            ? formatDate(p.tgl_jatuh_tempo)
            : '-',
          'Keterlambatan (Hari)': terlambat,
          'Kondisi Final': getKondisiLabel(u.kondisi_final),
          'Catatan Petugas': u.catatan_petugas || '-',
          'Status Verifikasi':
            p.status_verifikasi === 'menunggu' ? 'Menunggu' : 'Terverifikasi'
        })
      })
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [
      { wch: 5 },
      { wch: 16 },
      { wch: 22 },
      { wch: 25 },
      { wch: 14 },
      { wch: 20 },
      { wch: 18 },
      { wch: 20 },
      { wch: 16 },
      { wch: 25 },
      { wch: 18 }
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      tab === 'verifikasi' ? 'Perlu Verifikasi' : 'Histori'
    )
    const tgl = new Date()
      .toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      .replace(/\//g, '-')
    XLSX.writeFile(wb, `pengembalian_${tab}_${tgl}.xlsx`)
    showToast(`Berhasil export ${rows.length} baris ke Excel`, 'success')
  }

  const filteredData = useMemo(() => {
    const byTab =
      tab === 'verifikasi'
        ? data.filter(d => d.status_verifikasi === 'menunggu')
        : data.filter(d => d.status_verifikasi !== 'menunggu')
    return byTab.filter(
      d =>
        d.peminjam?.toLowerCase().includes(search.toLowerCase()) ||
        d.alat?.toLowerCase().includes(search.toLowerCase())
    )
  }, [data, tab, search])

  const totalPage = Math.ceil(filteredData.length / LIMIT)
  const paginatedData = filteredData.slice((page - 1) * LIMIT, page * LIMIT)

  useEffect(() => {
    setPage(1)
  }, [tab, search])

  const pendingCount = data.filter(
    d => d.status_verifikasi === 'menunggu'
  ).length

  const previewDendaCount = id_pengembalian => {
    const unitKondisi = kondisiMap[id_pengembalian] || {}
    return Object.values(unitKondisi).filter(u => u.kondisi !== 'normal').length
  }

  return (
    <div>
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
          duration={4000}
        />
      )}

      <style>{`
        @keyframes modalFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes backdropFade { from { opacity: 0; } to { opacity: 1; } }
        .modal-animate { animation: modalFadeIn 0.2s ease-out; }
        .backdrop-animate { animation: backdropFade 0.15s ease-out; }
        .unit-expand { transition: max-height 0.25s ease, opacity 0.2s ease; }
      `}</style>

      {/* Header */}
      <div className='mb-5'>
        <h1 className='text-lg font-semibold tracking-tight text-gray-900'>
          Verifikasi Pengembalian
        </h1>
        <p className='text-sm text-gray-400 mt-0.5'>
          Verifikasi kondisi tiap unit alat yang dikembalikan
        </p>
      </div>

      {/* Stats */}
      <div className='mb-5 grid grid-cols-2 md:grid-cols-4 gap-3'>
        {[
          { label: 'Total Batch', value: data.length, cls: 'text-gray-900' },
          { label: 'Menunggu', value: pendingCount, cls: 'text-amber-500' },
          {
            label: 'Terverifikasi',
            value: data.filter(d => d.status_verifikasi !== 'menunggu').length,
            cls: 'text-green-600'
          },
          {
            label: 'Terlambat',
            value: data.filter(
              d => terlambatHari(d.tgl_jatuh_tempo, d.tgl_kembali) > 0
            ).length,
            cls: 'text-red-500'
          }
        ].map(s => (
          <div
            key={s.label}
            className='rounded-lg border border-gray-100 bg-white p-3 shadow-sm'
          >
            <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider'>
              {s.label}
            </p>
            <p className={`text-xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main Card */}
      <div className='rounded-lg border border-gray-100 bg-white overflow-hidden shadow-sm'>
        {/* Toolbar */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 px-4 py-2.5'>
          <div className='flex gap-1'>
            {['verifikasi', 'histori'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  tab === t
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {t === 'verifikasi' ? 'Perlu Verifikasi' : 'Histori'}
                {t === 'verifikasi' && pendingCount > 0 && (
                  <span className='ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-white'>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className='flex items-center gap-2'>
            <div className='relative'>
              <svg
                className='absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.5'
                viewBox='0 0 24 24'
              >
                <circle cx='11' cy='11' r='8' />
                <line x1='21' y1='21' x2='16.65' y2='16.65' />
              </svg>
              <input
                placeholder='Cari peminjam atau alat...'
                value={search}
                onChange={e => setSearch(e.target.value)}
                className='w-full sm:w-48 rounded-md border border-gray-200 bg-white py-1.5 pl-8 pr-2.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-100'
              />
            </div>
            <button
              onClick={exportExcel}
              disabled={filteredData.length === 0 || loading}
              className='flex items-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
            >
              <svg
                width='13'
                height='13'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.5'
                viewBox='0 0 24 24'
              >
                <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
                <polyline points='14 2 14 8 20 8' />
                <line x1='12' y1='18' x2='12' y2='12' />
                <polyline points='9 15 12 18 15 15' />
              </svg>
              Export Excel
            </button>
          </div>
        </div>

        {error && (
          <div className='mx-4 mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600 border border-red-100'>
            {error}
          </div>
        )}

        {/* List */}
        <div className='p-4'>
          {loading ? (
            <div className='space-y-3'>
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className='rounded-lg border border-gray-100 p-4 space-y-2'
                >
                  <div className='h-4 w-40 bg-gray-100 rounded animate-pulse' />
                  <div className='h-3 w-56 bg-gray-50 rounded animate-pulse' />
                  <div className='h-8 w-full bg-gray-100 rounded animate-pulse' />
                </div>
              ))}
            </div>
          ) : paginatedData.length === 0 ? (
            <div className='py-12 text-center flex flex-col items-center gap-2'>
              <svg
                width='48'
                height='48'
                fill='none'
                stroke='#d1d5db'
                strokeWidth='1'
                viewBox='0 0 24 24'
              >
                <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' />
                <polyline points='3.29 7 12 12 20.71 7' />
              </svg>
              <p className='text-sm text-gray-400'>
                {tab === 'verifikasi'
                  ? 'Tidak ada pengembalian yang menunggu verifikasi'
                  : 'Belum ada histori pengembalian'}
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              {paginatedData.map(p => {
                const isVerified = p.status_verifikasi !== 'menunggu'
                const terlambat = terlambatHari(
                  p.tgl_jatuh_tempo,
                  p.tgl_kembali
                )
                const isExpanded = expandedId === p.id_pengembalian
                const unitKondisi = kondisiMap[p.id_pengembalian] || {}
                const hasDenda = previewDendaCount(p.id_pengembalian)

                return (
                  <div
                    key={p.id_pengembalian}
                    className={`rounded-lg border transition-all duration-200 ${
                      isVerified
                        ? 'border-gray-100 bg-gray-50/30'
                        : 'border-gray-200 bg-white hover:shadow-sm'
                    }`}
                  >
                    {/* Header card */}
                    <div className='p-4'>
                      <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3'>
                        <div>
                          <p className='font-semibold text-gray-900 text-sm'>
                            {p.alat}
                          </p>
                          <p className='text-xs text-gray-500 mt-0.5'>
                            Peminjam:{' '}
                            <span className='font-medium text-gray-700'>
                              {p.peminjam}
                            </span>
                          </p>
                        </div>
                        <div className='flex items-center gap-2 flex-wrap'>
                          {/* Badge status */}
                          {isVerified ? (
                            <span className='inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-medium text-green-600 border border-green-100'>
                              <span className='h-1.5 w-1.5 rounded-full bg-green-500' />{' '}
                              Terverifikasi
                            </span>
                          ) : (
                            <span className='inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-600 border border-amber-100'>
                              <span className='h-1.5 w-1.5 rounded-full bg-amber-400' />{' '}
                              Menunggu
                            </span>
                          )}
                          <span className='inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-600 border border-blue-100'>
                            📦 {p.jumlah_dikembalikan ?? p.units?.length ?? 0}{' '}
                            unit
                          </span>
                        </div>
                      </div>

                      {/* Info baris */}
                      <div className='flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs'>
                        <span className='text-gray-400'>
                          Dikembalikan:{' '}
                          <span className='font-medium text-gray-600'>
                            {formatDate(p.tgl_kembali)}
                          </span>
                        </span>
                        {p.tgl_jatuh_tempo && (
                          <span className='text-gray-400'>
                            Jatuh tempo:{' '}
                            <span className='font-medium text-gray-600'>
                              {formatDate(p.tgl_jatuh_tempo)}
                            </span>
                          </span>
                        )}
                        {terlambat > 0 && (
                          <span className='inline-flex items-center gap-1 text-red-500 font-medium'>
                            <svg
                              width='12'
                              height='12'
                              fill='none'
                              stroke='currentColor'
                              strokeWidth='2'
                              viewBox='0 0 24 24'
                            >
                              <circle cx='12' cy='12' r='10' />
                              <line x1='12' y1='8' x2='12' y2='12' />
                              <line x1='12' y1='16' x2='12.01' y2='16' />
                            </svg>
                            Terlambat {terlambat} hari
                          </span>
                        )}
                      </div>

                      {isVerified && p.units?.length > 0 && (
                        <div className='mt-2'>
                          <RingkasanKondisi units={p.units} />
                        </div>
                      )}

                      {/* Toggle unit list */}
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : p.id_pengembalian)
                        }
                        className='mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors'
                      >
                        <svg
                          width='12'
                          height='12'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          viewBox='0 0 24 24'
                          style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s'
                          }}
                        >
                          <polyline points='6 9 12 15 18 9' />
                        </svg>
                        {isExpanded
                          ? 'Tutup detail unit'
                          : `Lihat ${p.units?.length ?? 0} unit`}
                      </button>
                    </div>

                    {/* Detail unit (expand) */}
                    {isExpanded && (
                      <div className='border-t border-gray-100 px-4 pb-4'>
                        {isVerified ? (
                          <div className='space-y-2 mt-3'>
                            <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1'>
                              Detail Kondisi Unit
                            </p>
                            {p.units?.map(unit => (
                              <div
                                key={unit.id_unit}
                                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${getKondisiStyle(
                                  unit.kondisi_final
                                )}`}
                              >
                                <div className='flex items-center gap-2'>
                                  <span className='text-xs font-semibold'>
                                    {unit.kode_unit}
                                  </span>
                                  {unit.catatan_petugas && (
                                    <span className='text-[10px] opacity-70'>
                                      — {unit.catatan_petugas}
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${getKondisiStyle(
                                    unit.kondisi_final
                                  )}`}
                                >
                                  {getKondisiLabel(unit.kondisi_final)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            <FormVerifikasiUnit
                              units={p.units || []}
                              kondisiMap={unitKondisi}
                              onKondisiChange={(id_unit, val) =>
                                handleKondisiChange(
                                  p.id_pengembalian,
                                  id_unit,
                                  val
                                )
                              }
                              onCatatanChange={(id_unit, val) =>
                                handleCatatanChange(
                                  p.id_pengembalian,
                                  id_unit,
                                  val
                                )
                              }
                            />
                            {hasDenda > 0 && (
                              <div className='mt-2 rounded-md bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-600'>
                                ⚠️{' '}
                                <span className='font-medium'>
                                  {hasDenda} unit
                                </span>{' '}
                                akan dikenakan denda kerusakan/kehilangan
                              </div>
                            )}
                            <div className='mt-3 flex justify-end'>
                              <button
                                onClick={() =>
                                  setConfirmData({
                                    id_pengembalian: p.id_pengembalian,
                                    units: p.units || []
                                  })
                                }
                                className='rounded-md bg-gray-900 px-5 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 transition-colors shadow-sm'
                              >
                                Verifikasi Semua Unit
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPage > 1 && (
          <div className='flex items-center justify-between border-t border-gray-100 px-4 py-2.5'>
            <span className='text-[10px] text-gray-400'>
              {(page - 1) * LIMIT + 1}–
              {Math.min(page * LIMIT, filteredData.length)} dari{' '}
              {filteredData.length}
            </span>
            <div className='flex items-center gap-1'>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className='px-2.5 py-1 rounded-md border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition'
              >
                ← Prev
              </button>
              <span className='px-2 text-xs text-gray-400'>
                {page} / {totalPage}
              </span>
              <button
                disabled={page === totalPage}
                onClick={() => setPage(p => p + 1)}
                className='px-2.5 py-1 rounded-md border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition'
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Konfirmasi Verifikasi */}
      {confirmData && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-animate'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => setConfirmData(null)}
          />
          <div className='relative w-full max-w-sm rounded-xl bg-white shadow-xl modal-animate'>
            <div className='p-5'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 shrink-0'>
                  <svg
                    width='20'
                    height='20'
                    fill='none'
                    stroke='#3b82f6'
                    strokeWidth='2'
                    viewBox='0 0 24 24'
                  >
                    <polyline points='9,11 12,14 22,4' />
                    <path d='M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' />
                  </svg>
                </div>
                <div>
                  <h3 className='text-sm font-semibold text-gray-900'>
                    Konfirmasi Verifikasi
                  </h3>
                  <p className='text-xs text-gray-400 mt-0.5'>
                    {confirmData.units?.length} unit akan diverifikasi
                  </p>
                </div>
              </div>

              <div className='rounded-lg bg-gray-50 border border-gray-100 p-3 mb-4 space-y-1.5'>
                {confirmData.units?.map(unit => {
                  const unitK =
                    kondisiMap[confirmData.id_pengembalian]?.[unit.id_unit]
                  const kondisi = unitK?.kondisi ?? 'normal'
                  return (
                    <div
                      key={unit.id_unit}
                      className='flex items-center justify-between text-xs'
                    >
                      <span className='font-medium text-gray-700'>
                        {unit.kode_unit}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${getKondisiStyle(
                          kondisi
                        )}`}
                      >
                        {getKondisiLabel(kondisi)}
                      </span>
                    </div>
                  )
                })}
              </div>

              <p className='text-xs text-gray-500 mb-4'>
                Data tidak dapat diubah setelah diverifikasi.
              </p>

              <div className='flex gap-2'>
                <button
                  onClick={() => setConfirmData(null)}
                  className='flex-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors'
                >
                  Batal
                </button>
                <button
                  onClick={handleVerifikasi}
                  disabled={loadingVerif}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-colors ${
                    loadingVerif
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                >
                  {loadingVerif ? 'Memproses...' : 'Ya, Verifikasi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
