import { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import Toast from '../../components/Toast'

const fmt = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID')
const formatDate = d => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}
const kondisiLabel = {
  normal: 'Normal',
  rusak_ringan: 'Rusak Ringan',
  rusak_berat: 'Rusak Berat',
  hilang: 'Hilang'
}

export default function KasirDenda () {
  const [denda, setDenda] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('belum')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null)
  const [formBayar, setFormBayar] = useState({ metode: 'cash', catatan: '' })
  const [formTagihan, setFormTagihan] = useState({ hari_batas: 3, catatan: '' })
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  })
  const [pendingDendaId, setPendingDendaId] = useState(null)
  const LIMIT = 8
  const navigate = useNavigate()

  const showToast = (message, type = 'success') =>
    setToast({ show: true, message, type })
  const closeToast = () =>
    setToast({ show: false, message: '', type: 'success' })

  const fetchDenda = async () => {
    setLoading(true)
    try {
      const res = await api.get('/denda')
      setDenda(res.data.data || [])
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDenda()
  }, [])
  useEffect(() => {
    setPage(1)
  }, [tab, search])

  const filtered = useMemo(() => {
    const byTab =
      tab === 'belum'
        ? denda.filter(d => d.status_bayar !== 'lunas')
        : denda.filter(d => d.status_bayar === 'lunas')
    if (!search.trim()) return byTab
    const q = search.toLowerCase()
    return byTab.filter(
      d =>
        d.peminjam?.toLowerCase().includes(q) ||
        d.alat?.toLowerCase().includes(q) ||
        d.kode_va?.toLowerCase().includes(q)
    )
  }, [denda, tab, search])

  const totalPage = Math.ceil(filtered.length / LIMIT)
  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT)
  const belumCount = denda.filter(d => d.status_bayar !== 'lunas').length
  const totalTagihan = denda
    .filter(d => d.status_bayar !== 'lunas')
    .reduce((s, d) => s + Number(d.total_denda), 0)

  const handleGenerateTagihan = async () => {
    if (!modal?.denda) return
    setSubmitting(true)
    try {
      const res = await api.post(
        `/denda/${modal.denda.id_denda}/generate-tagihan`,
        {
          hari_batas_bayar: formTagihan.hari_batas,
          catatan_kasir: formTagihan.catatan
        }
      )
      showToast(`VA berhasil dibuat: ${res.data.data?.kode_va}`, 'success')
      setModal(null)
      fetchDenda()
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal membuat VA', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleKonfirmasi = async () => {
    if (!modal?.denda) return

    const dendaId = modal.denda.id_denda

    setSubmitting(true)
    try {
      const res = await api.post(`/denda/${dendaId}/konfirmasi-bayar`, {
        metode: formBayar.metode,
        catatan: formBayar.catatan
      })

      console.log('✅ Pembayaran berhasil:', res.data)

      setModal(null)

      await fetchDenda()

      showToast('Pembayaran berhasil dikonfirmasi!', 'success')

      navigate(`/petugas/struk-denda/${dendaId}`)
    } catch (err) {
      console.error('❌ Error konfirmasi:', err.response?.data || err.message)
      showToast(err.response?.data?.message || 'Gagal konfirmasi', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Proses blokir manual ─────────────────────────────────────────────────
  const handleProsesBlokir = async () => {
    try {
      const res = await api.post('/denda/proses-blokir')
      showToast(res.data.message, 'success')
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal proses blokir', 'error')
    }
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

      {/* Header */}
      <div className='mb-5 flex items-start justify-between'>
        <div>
          <h1 className='text-lg font-semibold tracking-tight text-gray-900'>
            Kasir Denda
          </h1>
          <p className='text-sm text-gray-400 mt-0.5'>
            Kelola tagihan & pembayaran denda peminjam
          </p>
        </div>
        <button
          onClick={handleProsesBlokir}
          className='flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition'
        >
          <svg
            width='12'
            height='12'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <circle cx='12' cy='12' r='10' />
            <line x1='4.93' y1='4.93' x2='19.07' y2='19.07' />
          </svg>
          Proses Blokir
        </button>
      </div>

      {/* Stats */}
      <div className='mb-5 grid grid-cols-2 md:grid-cols-4 gap-3'>
        {[
          { label: 'Total Denda', value: denda.length, cls: 'text-gray-900' },
          { label: 'Belum Lunas', value: belumCount, cls: 'text-red-500' },
          {
            label: 'Total Tagihan',
            value: fmt(totalTagihan),
            cls: 'text-orange-500'
          },
          {
            label: 'Sudah Lunas',
            value: denda.filter(d => d.status_bayar === 'lunas').length,
            cls: 'text-green-600'
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

      {/* Main card */}
      <div className='rounded-lg border border-gray-100 bg-white shadow-sm overflow-hidden'>
        {/* Toolbar */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 px-4 py-2.5'>
          <div className='flex gap-1'>
            {[
              { key: 'belum', label: 'Belum Lunas', count: belumCount },
              { key: 'lunas', label: 'Sudah Lunas' }
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  tab === t.key
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className='inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-400 text-[9px] font-bold text-white'>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
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
              placeholder='Cari peminjam, alat, atau kode VA...'
              value={search}
              onChange={e => setSearch(e.target.value)}
              className='w-full sm:w-56 rounded-md border border-gray-200 bg-white py-1.5 pl-8 pr-2.5 text-xs focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-100'
            />
          </div>
        </div>

        {/* Table */}
        <div className='overflow-x-auto'>
          {loading ? (
            <div className='p-6 space-y-2'>
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className='h-12 bg-gray-50 rounded animate-pulse'
                />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <div className='py-14 text-center'>
              <p className='text-sm text-gray-400'>Tidak ada data denda</p>
            </div>
          ) : (
            <table className='w-full text-xs'>
              <thead>
                <tr className='border-b border-gray-100 bg-gray-50/50'>
                  {[
                    'Peminjam',
                    'Alat',
                    'Kondisi',
                    'Total Denda',
                    'Kode VA',
                    'Batas Bayar',
                    'Status',
                    'Aksi'
                  ].map(h => (
                    <th
                      key={h}
                      className='px-4 py-2.5 text-left font-medium text-gray-400 whitespace-nowrap'
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {paginated.map(d => {
                  const isLunas = d.status_bayar === 'lunas'
                  const sisaHari = d.batas_bayar
                    ? Math.ceil(
                        (new Date(d.batas_bayar) - new Date()) / 86400000
                      )
                    : null
                  const isLewat = sisaHari !== null && sisaHari < 0 && !isLunas

                  return (
                    <tr
                      key={d.id_denda}
                      className={`hover:bg-gray-50/50 transition ${
                        isLewat ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className='px-4 py-3 font-medium text-gray-900 whitespace-nowrap'>
                        {d.peminjam}
                      </td>
                      <td className='px-4 py-3 text-gray-600 whitespace-nowrap'>
                        {d.alat}
                      </td>
                      <td className='px-4 py-3'>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                            d.kondisi_laporan === 'hilang'
                              ? 'bg-red-50 text-red-600 border-red-100'
                              : d.kondisi_laporan === 'rusak_berat'
                              ? 'bg-orange-50 text-orange-600 border-orange-100'
                              : d.kondisi_laporan === 'rusak_ringan'
                              ? 'bg-yellow-50 text-yellow-600 border-yellow-100'
                              : 'bg-gray-50 text-gray-500 border-gray-100'
                          }`}
                        >
                          {kondisiLabel[d.kondisi_laporan] ??
                            d.kondisi_laporan ??
                            '-'}
                        </span>
                      </td>
                      <td className='px-4 py-3 font-semibold text-gray-900 whitespace-nowrap'>
                        {fmt(d.total_denda)}
                      </td>
                      <td className='px-4 py-3'>
                        {d.kode_va ? (
                          <span className='font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded'>
                            {d.kode_va}
                          </span>
                        ) : (
                          <span className='text-gray-300'>—</span>
                        )}
                      </td>
                      <td className='px-4 py-3 whitespace-nowrap'>
                        {d.batas_bayar ? (
                          <span
                            className={
                              isLewat
                                ? 'text-red-500 font-medium'
                                : 'text-gray-600'
                            }
                          >
                            {isLewat && '⚠ '}
                            {formatDate(d.batas_bayar)}
                          </span>
                        ) : (
                          <span className='text-gray-300'>—</span>
                        )}
                      </td>
                      <td className='px-4 py-3'>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                            isLunas
                              ? 'bg-green-50 text-green-600 border-green-100'
                              : 'bg-red-50 text-red-600 border-red-100'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isLunas ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          />
                          {isLunas ? 'Lunas' : 'Belum Lunas'}
                        </span>
                      </td>
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-1.5'>
                          {!isLunas && !d.kode_va && (
                            <button
                              onClick={() => {
                                setModal({ type: 'generate', denda: d })
                                setFormTagihan({ hari_batas: 3, catatan: '' })
                              }}
                              className='rounded-md bg-blue-50 border border-blue-100 px-2.5 py-1 text-[10px] font-medium text-blue-600 hover:bg-blue-100 transition whitespace-nowrap'
                            >
                              Buat VA
                            </button>
                          )}
                          {!isLunas && d.kode_va && (
                            <button
                              onClick={() => {
                                setModal({ type: 'bayar', denda: d })
                                setFormBayar({ metode: 'cash', catatan: '' })
                              }}
                              className='rounded-md bg-green-50 border border-green-100 px-2.5 py-1 text-[10px] font-medium text-green-600 hover:bg-green-100 transition whitespace-nowrap'
                            >
                              Konfirmasi Bayar
                            </button>
                          )}
                          {isLunas && (
                            <button
                              onClick={() =>
                                navigate(`/petugas/struk-denda/${d.id_denda}`)
                              }
                              className='rounded-md bg-gray-50 border border-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-100 transition whitespace-nowrap'
                            >
                              Lihat Struk
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPage > 1 && (
          <div className='flex items-center justify-between border-t border-gray-100 px-4 py-2.5'>
            <span className='text-[10px] text-gray-400'>
              {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, filtered.length)}{' '}
              dari {filtered.length}
            </span>
            <div className='flex items-center gap-1'>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className='px-2.5 py-1 rounded-md border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30'
              >
                ← Prev
              </button>
              <span className='px-2 text-xs text-gray-400'>
                {page}/{totalPage}
              </span>
              <button
                disabled={page === totalPage}
                onClick={() => setPage(p => p + 1)}
                className='px-2.5 py-1 rounded-md border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30'
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Generate VA ───────────────────────────────────────────────── */}
      {modal?.type === 'generate' && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => setModal(null)}
          />
          <div className='relative w-full max-w-sm rounded-xl bg-white shadow-xl'>
            <div className='p-5'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 shrink-0'>
                  <svg
                    width='18'
                    height='18'
                    fill='none'
                    stroke='#3b82f6'
                    strokeWidth='2'
                    viewBox='0 0 24 24'
                  >
                    <rect x='2' y='5' width='20' height='14' rx='2' />
                    <line x1='2' y1='10' x2='22' y2='10' />
                  </svg>
                </div>
                <div>
                  <h3 className='text-sm font-semibold text-gray-900'>
                    Buat Kode VA Tagihan
                  </h3>
                  <p className='text-xs text-gray-400 mt-0.5'>
                    {modal.denda.peminjam} — {fmt(modal.denda.total_denda)}
                  </p>
                </div>
              </div>

              <div className='space-y-3 mb-4'>
                <div>
                  <label className='block text-xs font-medium text-gray-600 mb-1'>
                    Batas Waktu Pembayaran
                  </label>
                  <select
                    value={formTagihan.hari_batas}
                    onChange={e =>
                      setFormTagihan(f => ({
                        ...f,
                        hari_batas: Number(e.target.value)
                      }))
                    }
                    className='w-full rounded-md border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-gray-300'
                  >
                    {[1, 2, 3, 5, 7, 14].map(h => (
                      <option key={h} value={h}>
                        {h} hari dari sekarang
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='block text-xs font-medium text-gray-600 mb-1'>
                    Catatan (opsional)
                  </label>
                  <input
                    type='text'
                    value={formTagihan.catatan}
                    onChange={e =>
                      setFormTagihan(f => ({ ...f, catatan: e.target.value }))
                    }
                    placeholder='Catatan untuk peminjam...'
                    className='w-full rounded-md border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-gray-300'
                  />
                </div>
              </div>

              <div className='flex gap-2'>
                <button
                  onClick={() => setModal(null)}
                  className='flex-1 rounded-md border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50'
                >
                  Batal
                </button>
                <button
                  onClick={handleGenerateTagihan}
                  disabled={submitting}
                  className='flex-1 rounded-md bg-blue-600 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50'
                >
                  {submitting ? 'Memproses...' : 'Buat VA'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Konfirmasi Bayar ─────────────────────────────────────────── */}
      {modal?.type === 'bayar' && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
          <div
            className='absolute inset-0 bg-black/40'
            onClick={() => setModal(null)}
          />
          <div className='relative w-full max-w-sm rounded-xl bg-white shadow-xl'>
            <div className='p-5'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-green-50 shrink-0'>
                  <svg
                    width='18'
                    height='18'
                    fill='none'
                    stroke='#16a34a'
                    strokeWidth='2'
                    viewBox='0 0 24 24'
                  >
                    <polyline points='20,6 9,17 4,12' />
                  </svg>
                </div>
                <div>
                  <h3 className='text-sm font-semibold text-gray-900'>
                    Konfirmasi Pembayaran
                  </h3>
                  <p className='text-xs text-gray-400 mt-0.5'>
                    {modal.denda.peminjam}
                  </p>
                </div>
              </div>

              {/* Ringkasan tagihan */}
              <div className='rounded-lg bg-gray-50 border border-gray-100 p-3 mb-4 space-y-1.5'>
                <div className='flex justify-between text-xs'>
                  <span className='text-gray-500'>Alat</span>
                  <span className='font-medium text-gray-800'>
                    {modal.denda.alat}
                  </span>
                </div>
                <div className='flex justify-between text-xs'>
                  <span className='text-gray-500'>Kode VA</span>
                  <span className='font-mono text-blue-600'>
                    {modal.denda.kode_va}
                  </span>
                </div>
                <div className='flex justify-between text-xs border-t border-gray-200 pt-1.5 mt-1'>
                  <span className='font-semibold text-gray-700'>
                    Total Bayar
                  </span>
                  <span className='font-bold text-gray-900 text-sm'>
                    {fmt(modal.denda.total_denda)}
                  </span>
                </div>
              </div>

              <div className='space-y-3 mb-4'>
                <div>
                  <label className='block text-xs font-medium text-gray-600 mb-1'>
                    Metode Pembayaran
                  </label>
                  <div className='grid grid-cols-2 gap-2'>
                    {['cash', 'transfer'].map(m => (
                      <button
                        key={m}
                        onClick={() => setFormBayar(f => ({ ...f, metode: m }))}
                        className={`rounded-md border py-2 text-xs font-medium transition-all capitalize ${
                          formBayar.metode === m
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {m === 'cash' ? '💵 Cash' : '🏦 Transfer'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className='block text-xs font-medium text-gray-600 mb-1'>
                    Catatan (opsional)
                  </label>
                  <input
                    type='text'
                    value={formBayar.catatan}
                    onChange={e =>
                      setFormBayar(f => ({ ...f, catatan: e.target.value }))
                    }
                    placeholder='Catatan tambahan...'
                    className='w-full rounded-md border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-gray-300'
                  />
                </div>
              </div>

              <p className='text-[10px] text-gray-400 mb-4'>
                ⚠ Pastikan uang sudah diterima sebelum konfirmasi. Tindakan ini
                tidak dapat dibatalkan.
              </p>

              <div className='flex gap-2'>
                <button
                  onClick={() => setModal(null)}
                  className='flex-1 rounded-md border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50'
                >
                  Batal
                </button>
                <button
                  onClick={handleKonfirmasi}
                  disabled={submitting}
                  className='flex-1 rounded-md bg-green-600 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50'
                >
                  {submitting ? 'Memproses...' : 'Konfirmasi & Cetak Struk'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
