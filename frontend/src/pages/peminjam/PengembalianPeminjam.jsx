import { useEffect, useState } from 'react'
import api from '../../lib/api'

const formatDate = d => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const fmt = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID')

export default function PengembalianPeminjam () {
  const [data, setData] = useState([])
  const [denda, setDenda] = useState([])
  const [form, setForm] = useState({})
  const [modal, setModal] = useState({ show: false, type: '', message: '' })
  const [showAll, setShowAll] = useState(false)
  const [submitting, setSubmitting] = useState(null)
  const [unitsData, setUnitsData] = useState({})  
  const [loadingUnits, setLoadingUnits] = useState({}) 
  const [selectedUnits, setSelectedUnits] = useState({})

  const displayedDenda = showAll ? denda : denda.slice(0, 3)

  const fetchData = async () => {
    try {
      const res = await api.get('/peminjaman/saya')
      const aktif =
        res.data.data?.filter(
          p => p.status === 'dipinjam' || p.status === 'menunggu_pengembalian'
        ) || []
      setData(aktif)

      for (const peminjaman of aktif) {
        await fetchUnits(peminjaman.id_peminjaman)
      }
    } catch (err) {
      console.error('Gagal fetch peminjaman:', err)
    }
  }

  const fetchDenda = async () => {
    try {
      const res = await api.get('/denda/saya')
      setDenda(res.data.data || res.data || [])
    } catch (err) {
      console.error('Gagal fetch denda:', err)
      setDenda([])
    }
  }

  useEffect(() => {
    fetchData()
    fetchDenda()
  }, [])

  const fetchUnits = async id_peminjaman => {
    setLoadingUnits(prev => ({ ...prev, [id_peminjaman]: true }))
    try {
      const res = await api.get(`/pengembalian/unit-tersedia/${id_peminjaman}`)
      setUnitsData(prev => ({
        ...prev,
        [id_peminjaman]: {
          units: res.data.data || [],
          stats: res.data.stats,
          peminjaman: res.data.peminjaman
        }
      }))
    } catch (err) {
      console.error('Gagal ambil unit:', err)
      setUnitsData(prev => ({
        ...prev,
        [id_peminjaman]: {
          units: [],
          stats: null,
          error: err.response?.data?.message
        }
      }))
    } finally {
      setLoadingUnits(prev => ({ ...prev, [id_peminjaman]: false }))
    }
  }

  const handleKeteranganChange = (id, value) => {
    setForm(prev => ({ ...prev, [id]: { ...prev[id], keterangan: value } }))
  }

  const handleSelectUnit = (peminjamanId, unitId, isChecked) => {
    setSelectedUnits(prev => {
      const current = prev[peminjamanId] || []
      return {
        ...prev,
        [peminjamanId]: isChecked
          ? [...current, unitId]
          : current.filter(id => id !== unitId)
      }
    })
  }

  const handleSelectAllUnits = (peminjamanId, unitIds) => {
    setSelectedUnits(prev => {
      const currentSelected = prev[peminjamanId] || []
      const allSelected =
        unitIds.length === currentSelected.length && unitIds.length > 0
      return {
        ...prev,
        [peminjamanId]: allSelected ? [] : [...unitIds]
      }
    })
  }

  const ajukanPengembalian = async id_peminjaman => {
    const unit_ids = selectedUnits[id_peminjaman] || []

    if (unit_ids.length === 0) {
      setModal({
        show: true,
        type: 'error',
        message: 'Pilih minimal 1 unit untuk dikembalikan'
      })
      return
    }

    setSubmitting(id_peminjaman)

    try {
      await api.post('/pengembalian', {
        id_peminjaman,
        tgl_kembali: new Date().toISOString().split('T')[0],
        keterangan_user: form[id_peminjaman]?.keterangan || '',
        unit_ids
      })

      setModal({
        show: true,
        type: 'success',
        message: `${unit_ids.length} unit berhasil diajukan pengembalian dan menunggu verifikasi petugas.`
      })

      setForm(prev => {
        const newForm = { ...prev }
        delete newForm[id_peminjaman]
        return newForm
      })

      setSelectedUnits(prev => {
        const newSelected = { ...prev }
        delete newSelected[id_peminjaman]
        return newSelected
      })

      await fetchData()
      fetchDenda()
    } catch (err) {
      setModal({
        show: true,
        type: 'error',
        message: err.response?.data?.message || 'Gagal mengajukan pengembalian'
      })
    } finally {
      setSubmitting(null)
    }
  }

  const getStatusInfo = p => {
    if (!p?.tgl_jatuh_tempo) {
      return {
        label: 'Aktif',
        cls: 'bg-green-50 text-green-600 border-green-100',
        dot: 'bg-green-500'
      }
    }

    const jatuhTempo = new Date(p.tgl_jatuh_tempo)
    const sekarang = new Date()
    const diffMs = jatuhTempo - sekarang
    const diffHari = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (p.status === 'menunggu_pengembalian') {
      return {
        label: 'Menunggu Verifikasi',
        cls: 'bg-blue-50 text-blue-600 border-blue-100',
        dot: 'bg-blue-500'
      }
    }

    if (diffHari < 0) {
      return {
        label: `Terlambat ${Math.abs(diffHari)} hari`,
        cls: 'bg-red-50 text-red-600 border-red-100',
        dot: 'bg-red-500'
      }
    }

    if (diffHari <= 1) {
      return {
        label: 'Hampir Jatuh Tempo',
        cls: 'bg-amber-50 text-amber-600 border-amber-100',
        dot: 'bg-amber-500'
      }
    }

    return {
      label: 'Aktif',
      cls: 'bg-green-50 text-green-600 border-green-100',
      dot: 'bg-green-500'
    }
  }

  return (
    <div className='space-y-5'>
      {/* Header */}
      <div>
        <h1 className='text-lg font-semibold tracking-tight text-gray-900'>
          Pengembalian Alat
        </h1>
        <p className='text-sm text-gray-400 mt-0.5'>
          Ajukan pengembalian alat yang sedang kamu pinjam
        </p>
      </div>

      {/* Warning Info */}
      <div className='rounded-md bg-amber-50 border border-amber-100 p-3'>
        <div className='flex items-start gap-2'>
          <svg
            width='14'
            height='14'
            fill='none'
            stroke='#d97706'
            strokeWidth='2'
            viewBox='0 0 24 24'
            className='mt-0.5 shrink-0'
          >
            <circle cx='12' cy='12' r='10' />
            <line x1='12' y1='8' x2='12' y2='12' />
            <line x1='12' y1='16' x2='12.01' y2='16' />
          </svg>
          <p className='text-xs text-amber-700'>
            Pengembalian melewati tanggal jatuh tempo akan dikenakan denda
            sesuai konfigurasi sistem.
          </p>
        </div>
      </div>

      {/* Daftar Denda */}
      {denda.length > 0 && (
        <div className='rounded-lg border border-red-100 bg-white overflow-hidden'>
          <div className='bg-red-50/50 border-b border-red-100 px-4 py-2.5'>
            <div className='flex items-center gap-2'>
              <svg
                width='14'
                height='14'
                fill='none'
                stroke='#dc2626'
                strokeWidth='1.5'
                viewBox='0 0 24 24'
              >
                <circle cx='12' cy='12' r='10' />
                <line x1='12' y1='8' x2='12' y2='12' />
                <line x1='12' y1='16' x2='12.01' y2='16' />
              </svg>
              <span className='text-xs font-semibold text-red-600'>
                Denda yang Belum Lunas
              </span>
            </div>
          </div>
          <div className='divide-y divide-gray-100'>
            {displayedDenda.map(d => (
              <div
                key={d.id_denda}
                className='flex items-center justify-between px-4 py-3'
              >
                <div>
                  <p className='text-sm font-medium text-gray-900'>
                    {d.alat || 'Alat'}
                  </p>
                  <p className='text-xs text-red-600 font-medium mt-0.5'>
                    {fmt(d.total_denda)}
                  </p>
                  <p className='text-[10px] text-gray-400'>
                    Terlambat {d.hari_terlambat} hari
                  </p>
                </div>
                {d.status_bayar === 'belum_bayar' ? (
                  <span className='inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-medium text-red-600 border border-red-100'>
                    <span className='h-1.5 w-1.5 rounded-full bg-red-500' />
                    Belum Lunas
                  </span>
                ) : (
                  <span className='inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-medium text-green-600 border border-green-100'>
                    <span className='h-1.5 w-1.5 rounded-full bg-green-500' />
                    Lunas
                  </span>
                )}
              </div>
            ))}
          </div>
          {denda.length > 3 && (
            <div className='border-t border-gray-100 px-4 py-2 text-center'>
              <button
                onClick={() => setShowAll(!showAll)}
                className='text-xs text-blue-500 hover:text-blue-600 font-medium'
              >
                {showAll ? 'Tutup' : `Lihat Semua (${denda.length})`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* List Peminjaman */}
      {data.length === 0 ? (
        <div className='rounded-lg border border-gray-100 bg-white py-12 text-center'>
          <div className='flex flex-col items-center gap-2'>
            <svg
              width='48'
              height='48'
              fill='none'
              stroke='#d1d5db'
              strokeWidth='1'
              viewBox='0 0 24 24'
            >
              <path d='M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2' />
              <rect x='9' y='3' width='6' height='4' rx='1' />
            </svg>
            <p className='text-sm text-gray-400'>
              Tidak ada alat yang sedang kamu pinjam saat ini
            </p>
          </div>
        </div>
      ) : (
        <div className='space-y-3'>
          {data.map(p => {
            const status = getStatusInfo(p)
            const isLate = status.label.includes('Terlambat')
            const isWaiting = p.status === 'menunggu_pengembalian'
            const unitData = unitsData[p.id_peminjaman]
            const availableUnits = unitData?.units || []
            const stats = unitData?.stats
            const isLoading = loadingUnits[p.id_peminjaman]
            const selectedCount = (selectedUnits[p.id_peminjaman] || []).length

            return (
              <div
                key={p.id_peminjaman}
                className='rounded-lg border border-gray-100 bg-white overflow-hidden shadow-sm'
              >
                <div className='p-4'>
                  <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2'>
                    <div className='flex-1'>
                      <p className='text-sm font-semibold text-gray-900'>
                        {p.alat}
                      </p>
                      <div className='flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500'>
                        <span>
                          Dipinjam:{' '}
                          <span className='font-medium text-gray-700'>
                            {formatDate(p.tgl_pinjam)}
                          </span>
                        </span>
                        <span>
                          Jatuh tempo:{' '}
                          <span
                            className={`font-medium ${
                              isLate ? 'text-red-600' : 'text-gray-700'
                            }`}
                          >
                            {formatDate(p.tgl_jatuh_tempo)}
                          </span>
                        </span>
                        {stats && (
                          <>
                            <span>
                              Total unit:{' '}
                              <span className='font-medium text-gray-700'>
                                {stats.total_dipinjam}
                              </span>
                            </span>
                            {stats.sudah_dikembalikan > 0 && (
                              <span className='text-green-600'>
                                Sudah kembali: {stats.sudah_dikembalikan}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium border ${status.cls}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                      />
                      {status.label}
                    </div>
                  </div>

                  {isLate && !isWaiting && (
                    <p className='mt-2 text-[10px] text-red-500 font-medium'>
                      ⚠️ Denda akan dihitung otomatis saat petugas memverifikasi
                      pengembalian
                    </p>
                  )}
                </div>

                {!isWaiting && p.status === 'dipinjam' && (
                  <>
                    <div className='px-4 pb-2'>
                      <div className='flex items-center justify-between mb-2'>
                        <p className='text-xs font-medium text-gray-600'>
                          Pilih Unit yang Dikembalikan
                          {availableUnits.length > 0 && (
                            <span className='ml-1 text-gray-400'>
                              ({selectedCount}/{availableUnits.length})
                            </span>
                          )}
                        </p>
                        {availableUnits.length > 1 && (
                          <button
                            onClick={() =>
                              handleSelectAllUnits(
                                p.id_peminjaman,
                                availableUnits.map(u => u.id_unit)
                              )
                            }
                            className='text-[10px] text-blue-500 hover:text-blue-600'
                          >
                            {selectedCount === availableUnits.length
                              ? 'Batal Pilih Semua'
                              : 'Pilih Semua'}
                          </button>
                        )}
                      </div>

                      {isLoading ? (
                        <div className='text-center py-4'>
                          <div className='inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600'></div>
                          <p className='text-xs text-gray-400 mt-1'>
                            Memuat unit...
                          </p>
                        </div>
                      ) : availableUnits.length === 0 ? (
                        <div className='text-center py-4 bg-gray-50 rounded-md'>
                          <p className='text-xs text-gray-400'>
                            {unitData?.error ||
                              'Semua unit sudah dikembalikan atau sedang menunggu verifikasi'}
                          </p>
                        </div>
                      ) : (
                        <div className='grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-md'>
                          {availableUnits.map(u => (
                            <label
                              key={u.id_unit}
                              className='flex items-center gap-2 text-xs p-1 hover:bg-white rounded transition'
                            >
                              <input
                                type='checkbox'
                                checked={
                                  selectedUnits[p.id_peminjaman]?.includes(
                                    u.id_unit
                                  ) || false
                                }
                                onChange={e =>
                                  handleSelectUnit(
                                    p.id_peminjaman,
                                    u.id_unit,
                                    e.target.checked
                                  )
                                }
                                className='rounded border-gray-300'
                              />
                              <span className='text-gray-700'>
                                {u.kode_unit}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className='border-t border-gray-100 bg-gray-50/50 px-4 py-3'>
                      <label className='block text-[10px] font-medium text-gray-500 mb-1'>
                        Catatan Tambahan (Opsional)
                      </label>
                      <input
                        type='text'
                        className='w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-100'
                        placeholder='Contoh: Ada goresan kecil pada body alat...'
                        value={form[p.id_peminjaman]?.keterangan || ''}
                        onChange={e =>
                          handleKeteranganChange(
                            p.id_peminjaman,
                            e.target.value
                          )
                        }
                      />
                      <button
                        onClick={() => ajukanPengembalian(p.id_peminjaman)}
                        disabled={
                          submitting === p.id_peminjaman ||
                          selectedCount === 0 ||
                          isLoading
                        }
                        className='mt-3 w-full rounded-md bg-gray-900 py-3 text-xs font-medium text-white hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed'
                      >
                        {submitting === p.id_peminjaman
                          ? 'Memproses...'
                          : selectedCount === 0
                          ? 'Pilih Unit Terlebih Dahulu'
                          : `Ajukan Pengembalian (${selectedCount} unit)`}
                      </button>
                    </div>
                  </>
                )}

                {isWaiting && (
                  <div className='border-t border-gray-100 bg-blue-50/30 px-4 py-2.5'>
                    <div className='flex items-center justify-center gap-2'>
                      <svg
                        width='12'
                        height='12'
                        fill='none'
                        stroke='#2563eb'
                        strokeWidth='2'
                        viewBox='0 0 24 24'
                      >
                        <circle cx='12' cy='12' r='10' />
                        <polyline points='12 6 12 12 16 14' />
                      </svg>
                      <p className='text-xs text-blue-600'>
                        Pengembalian sedang menunggu verifikasi petugas
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modal.show && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => setModal({ show: false, type: '', message: '' })}
          />
          <div className='relative w-full max-w-sm rounded-lg bg-white shadow-xl'>
            <div className='p-5 text-center'>
              <div
                className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                  modal.type === 'success' ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                {modal.type === 'success' ? (
                  <svg
                    width='22'
                    height='22'
                    fill='none'
                    stroke='#16a34a'
                    strokeWidth='2'
                    viewBox='0 0 24 24'
                  >
                    <polyline points='20,6 9,17 4,12' />
                  </svg>
                ) : (
                  <svg
                    width='22'
                    height='22'
                    fill='none'
                    stroke='#dc2626'
                    strokeWidth='2'
                    viewBox='0 0 24 24'
                  >
                    <line x1='18' y1='6' x2='6' y2='18' />
                    <line x1='6' y1='6' x2='18' y2='18' />
                  </svg>
                )}
              </div>
              <h3 className='text-base font-semibold text-gray-900 mb-1'>
                {modal.type === 'success' ? 'Berhasil' : 'Gagal'}
              </h3>
              <p className='text-xs text-gray-500 mb-5'>{modal.message}</p>
              <button
                onClick={() => setModal({ show: false, type: '', message: '' })}
                className='w-full rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition'
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
