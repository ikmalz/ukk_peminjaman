import { useEffect, useState, useRef } from 'react'
import api from '../../lib/api'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import Toast from '../../components/Toast'

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-gray-100 placeholder:text-gray-400'

const blank = {
  id_kategori: '',
  name: '',
  stok: '',
  stok_minimum: '',
  merk: '',
  tipe_model: '',
  spesifikasi: '',
  kondisi: 'normal',
  harga: ''
}

function ActionMenu ({ alat, onEdit, onToggle, onDelete, onLihatUnit }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const menuRef = useRef(null)

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - 160 
      })
    }
    setOpen(p => !p)
  }

  useEffect(() => {
    const handler = e => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className='relative'>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className='p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors'
        title='Aksi'
      >
        <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
          <circle cx='12' cy='5' r='1.5' />
          <circle cx='12' cy='12' r='1.5' />
          <circle cx='12' cy='19' r='1.5' />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 9999
          }}
          className='w-40 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg'
        >
          <button
            onClick={() => {
              onEdit()
              setOpen(false)
            }}
            className='flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors'
          >
            <svg
              width='12'
              height='12'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
              viewBox='0 0 24 24'
            >
              <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
              <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
            </svg>
            Edit
          </button>
          <button
            onClick={() => {
              onLihatUnit()
              setOpen(false)
            }}
            className='flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors'
          >
            <svg
              width='12'
              height='12'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
              viewBox='0 0 24 24'
            >
              <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' />
            </svg>
            Lihat Unit
          </button>
          <button
            onClick={() => {
              onToggle()
              setOpen(false)
            }}
            className='flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-amber-600 hover:bg-amber-50 transition-colors'
          >
            <svg
              width='12'
              height='12'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
              viewBox='0 0 24 24'
            >
              <path d='M18.36 6.64a9 9 0 1 1-12.73 0' />
              <line x1='12' y1='2' x2='12' y2='12' />
            </svg>
            {alat.status_aktif === 1 ? 'Nonaktifkan' : 'Aktifkan'}
          </button>
          <div className='my-1 border-t border-gray-100' />
          <button
            onClick={() => {
              onDelete()
              setOpen(false)
            }}
            className='flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-500 hover:bg-red-50 transition-colors'
          >
            <svg
              width='12'
              height='12'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
              viewBox='0 0 24 24'
            >
              <polyline points='3 6 5 6 21 6' />
              <path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6' />
              <path d='M10 11v6M14 11v6' />
              <path d='M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2' />
            </svg>
            Hapus
          </button>
        </div>
      )}
    </div>
  )
}

function AlatModal ({
  open,
  onClose,
  editingId,
  kategori,
  onSuccess,
  IMAGE_URL,
  showToast
}) {
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    if (editingId) {
      api
        .get(`/alat/${editingId}`)
        .then(res => {
          const data = res.data.data || blank
          setForm({ ...data, harga: data.harga || '' })
          if (data.image) setPreview(data.image)
        })
        .catch(() => setForm(blank))
    } else {
      setForm(blank)
      setImageFile(null)
      setPreview(null)
      setError('')
    }
  }, [open, editingId])

  const imgSrc = src =>
    src?.startsWith('blob') || src?.startsWith('http')
      ? src
      : `${IMAGE_URL}${src}`

  const submit = async e => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const fd = new FormData()
      Object.keys(form).forEach(key => {
        if (form[key] !== undefined && form[key] !== null) {
          fd.append(key, key === 'harga' ? Number(form[key]) || 0 : form[key])
        }
      })
      if (imageFile) fd.append('image', imageFile)

      if (editingId) {
        await api.put(`/alat/${editingId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        showToast('Alat berhasil diperbarui!', 'success')
      } else {
        await api.post('/alat', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        showToast('Alat berhasil ditambahkan!', 'success')
      }

      onSuccess()
      onClose()
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Terjadi kesalahan saat menyimpan'
      setError(errorMsg)
      showToast(errorMsg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <div
        className='absolute inset-0 bg-black/40 backdrop-blur-sm'
        onClick={onClose}
      />
      <div className='relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl'>
        {/* Header */}
        <div className='sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4'>
          <div>
            <h2 className='text-base font-semibold text-gray-900'>
              {editingId ? 'Edit Alat' : 'Tambah Alat'}
            </h2>
            <p className='text-xs text-gray-400 mt-0.5'>
              {editingId ? 'Ubah informasi alat' : 'Isi data alat baru'}
            </p>
          </div>
          <button
            onClick={onClose}
            className='p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors'
          >
            <svg
              width='18'
              height='18'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
              viewBox='0 0 24 24'
            >
              <line x1='18' y1='6' x2='6' y2='18' />
              <line x1='6' y1='6' x2='18' y2='18' />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className='p-5'>
          {error && (
            <div className='mb-4 rounded-lg bg-red-50 px-4 py-2 text-xs text-red-600 border border-red-100'>
              {error}
            </div>
          )}

          <form onSubmit={submit}>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4'>
              <div>
                <label className='mb-1 block text-xs font-medium text-gray-600'>
                  Kategori *
                </label>
                <select
                  required
                  className={inputCls}
                  value={form.id_kategori}
                  onChange={e =>
                    setForm(f => ({ ...f, id_kategori: e.target.value }))
                  }
                >
                  <option value=''>Pilih kategori</option>
                  {kategori.map(k => (
                    <option key={k.id_kategori} value={k.id_kategori}>
                      {k.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='mb-1 block text-xs font-medium text-gray-600'>
                  Nama Alat *
                </label>
                <input
                  required
                  className={inputCls}
                  placeholder='Nama alat'
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className='mb-1 block text-xs font-medium text-gray-600'>
                  Stok *
                </label>
                <input
                  type='number'
                  required
                  className={inputCls}
                  placeholder='0'
                  value={form.stok}
                  onChange={e => setForm(f => ({ ...f, stok: e.target.value }))}
                />
              </div>
              <div>
                <label className='mb-1 block text-xs font-medium text-gray-600'>
                  Stok Minimum
                </label>
                <input
                  type='number'
                  className={inputCls}
                  placeholder='0'
                  value={form.stok_minimum}
                  onChange={e =>
                    setForm(f => ({ ...f, stok_minimum: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className='mb-1 block text-xs font-medium text-gray-600'>
                  Harga (Rp)
                </label>
                <input
                  type='number'
                  className={inputCls}
                  placeholder='0'
                  value={form.harga || ''}
                  onChange={e =>
                    setForm(f => ({ ...f, harga: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className='mb-1 block text-xs font-medium text-gray-600'>
                  Merk
                </label>
                <input
                  className={inputCls}
                  placeholder='Merk'
                  value={form.merk}
                  onChange={e => setForm(f => ({ ...f, merk: e.target.value }))}
                />
              </div>
              <div>
                <label className='mb-1 block text-xs font-medium text-gray-600'>
                  Tipe/Model
                </label>
                <input
                  className={inputCls}
                  placeholder='Tipe/model'
                  value={form.tipe_model}
                  onChange={e =>
                    setForm(f => ({ ...f, tipe_model: e.target.value }))
                  }
                />
              </div>
              {editingId && (
                <div>
                  <label className='mb-1 block text-xs font-medium text-gray-600'>
                    Kondisi
                  </label>
                  <select
                    className={inputCls}
                    value={form.kondisi}
                    onChange={e =>
                      setForm(f => ({ ...f, kondisi: e.target.value }))
                    }
                  >
                    <option value='normal'>Normal</option>
                    <option value='rusak'>Rusak</option>
                  </select>
                </div>
              )}
            </div>

            <div className='mb-4'>
              <label className='mb-1 block text-xs font-medium text-gray-600'>
                Spesifikasi
              </label>
              <textarea
                rows={3}
                className={`${inputCls} resize-none`}
                placeholder='Spesifikasi alat...'
                value={form.spesifikasi}
                onChange={e =>
                  setForm(f => ({ ...f, spesifikasi: e.target.value }))
                }
              />
            </div>

            {/* Upload Gambar */}
            <div className='mb-5'>
              <label className='mb-1 block text-xs font-medium text-gray-600'>
                Gambar Alat
              </label>
              <label className='flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-200 p-3 transition hover:border-gray-300 hover:bg-gray-50'>
                <input
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={e => {
                    const file = e.target.files[0]
                    if (file) {
                      setImageFile(file)
                      setPreview(URL.createObjectURL(file))
                    }
                  }}
                />
                {preview ? (
                  <img
                    src={imgSrc(preview)}
                    alt='preview'
                    className='h-12 w-12 rounded-lg border border-gray-200 object-cover'
                  />
                ) : (
                  <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-400'>
                    <svg
                      width='18'
                      height='18'
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
                )}
                <div>
                  <p className='text-xs text-gray-600'>
                    {preview
                      ? 'Klik untuk ganti gambar'
                      : 'Klik untuk pilih gambar'}
                  </p>
                  <p className='text-[10px] text-gray-400'>
                    PNG, JPG, WEBP · maks 5 MB
                  </p>
                </div>
              </label>
            </div>

            {/* Footer */}
            <div className='flex items-center justify-end gap-2 pt-2 border-t border-gray-100'>
              <button
                type='button'
                onClick={onClose}
                className='rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors'
              >
                Batal
              </button>
              <button
                type='submit'
                disabled={submitting}
                className='rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-60'
              >
                {submitting ? 'Menyimpan...' : editingId ? 'Simpan' : 'Tambah'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function DaftarAlat () {
  const [alat, setAlat] = useState([])
  const [kategori, setKategori] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [filterKondisi, setFilterKondisi] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [toast, setToast] = useState(null)

  const navigate = useNavigate()
  const IMAGE_URL = api.defaults.baseURL.replace('/api', '')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [alatRes, katRes] = await Promise.all([
        api.get('/alat'),
        api.get('/kategori')
      ])
      setAlat(alatRes.data.data)
      setKategori(katRes.data.data)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleExportExcel = () => {
    const dataExport = alat.map(a => ({
      Kode: a.kode_alat,
      Nama: a.name,
      Kategori: a.kategori,
      Stok: a.stok,
      Stok_Minimum: a.stok_minimum,
      Harga: `Rp ${Number(a.harga || 0).toLocaleString('id-ID')}`,
      Merk: a.merk,
      Tipe_Model: a.tipe_model,
      Kondisi: a.kondisi,
      Status: a.status_aktif === 1 ? 'Aktif' : 'Nonaktif'
    }))
    const ws = XLSX.utils.json_to_sheet(dataExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data Alat')
    XLSX.writeFile(wb, 'data-alat.xlsx')
  }

  const toggleStatus = async a => {
    await api.put(`/alat/${a.id_alat}/status`, {
      status_aktif: a.status_aktif === 1 ? 0 : 1
    })
    fetchData()
  }

  const handleDelete = async id => {
    if (!confirm('Yakin ingin menghapus alat ini?')) return

    try {
      await api.delete(`/alat/${id}`)
      navigate('/admin/alat', {
        state: {
          success: true,
          title: 'Alat Berhasil Dihapus',
          message: 'Data alat dan semua unitnya telah dihapus permanen.',
          redirectPath: '/petugas/alat'
        }
      })
    } catch (err) {
      navigate('/admin/alat', {
        state: {
          success: false,
          title: 'Gagal Menghapus Alat',
          message: err.response?.data?.message || 'Gagal menghapus alat',
          redirectPath: '/petugas/alat'
        }
      })
    }
  }

  const filtered = alat.filter(a => {
    const matchSearch =
      !search ||
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.kode_alat?.toLowerCase().includes(search.toLowerCase())
    const matchKategori =
      !filterKategori || String(a.id_kategori) === filterKategori
    const matchKondisi = !filterKondisi || a.kondisi === filterKondisi
    const matchStatus =
      !filterStatus ||
      (filterStatus === '1' ? a.status_aktif === 1 : a.status_aktif !== 1)
    return matchSearch && matchKategori && matchKondisi && matchStatus
  })

  const hasFilter = search || filterKategori || filterKondisi || filterStatus
  const resetFilter = () => {
    setSearch('')
    setFilterKategori('')
    setFilterKondisi('')
    setFilterStatus('')
  }

  return (
    <div>
      {/* Header */}
      <div className='mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='text-lg font-semibold tracking-tight text-gray-900'>
            Inventaris Alat
          </h1>
          <p className='text-sm text-gray-400 mt-0.5'>
            Kelola data alat dan inventaris
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => {
              setEditingId(null)
              setModalOpen(true)
            }}
            className='flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors shadow-sm'
          >
            <svg
              width='14'
              height='14'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <line x1='12' y1='5' x2='12' y2='19' />
              <line x1='5' y1='12' x2='19' y2='12' />
            </svg>
            Tambah Alat
          </button>
          <button
            onClick={handleExportExcel}
            className='flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors'
          >
            <svg
              width='14'
              height='14'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
              viewBox='0 0 24 24'
            >
              <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
              <polyline points='7 10 12 15 17 10' />
              <line x1='12' y1='15' x2='12' y2='3' />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3'>
        <div className='rounded-lg border border-gray-100 bg-white p-3 shadow-sm'>
          <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider'>
            Total Alat
          </p>
          <p className='text-xl font-bold text-gray-900 mt-1'>{alat.length}</p>
        </div>
        <div className='rounded-lg border border-gray-100 bg-white p-3 shadow-sm'>
          <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider'>
            Aktif
          </p>
          <p className='text-xl font-bold text-green-600 mt-1'>
            {alat.filter(a => a.status_aktif === 1).length}
          </p>
        </div>
        <div className='rounded-lg border border-gray-100 bg-white p-3 shadow-sm'>
          <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider'>
            Nonaktif
          </p>
          <p className='text-xl font-bold text-red-500 mt-1'>
            {alat.filter(a => a.status_aktif !== 1).length}
          </p>
        </div>
        <div className='rounded-lg border border-gray-100 bg-white p-3 shadow-sm'>
          <p className='text-[10px] font-medium text-gray-400 uppercase tracking-wider'>
            Stok Menipis
          </p>
          <p className='text-xl font-bold text-gray-500 mt-1'>
            {
              alat.filter(
                a => a.stok <= (a.stok_minimum || 0) && a.stok_minimum > 0
              ).length
            }
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className='mb-4 rounded-lg border border-gray-100 bg-white p-3'>
        <div className='flex flex-col sm:flex-row gap-2'>
          <div className='relative flex-1'>
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
              className='w-full rounded-md border border-gray-200 bg-white py-1.5 pl-8 pr-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-100'
              placeholder='Cari alat...'
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className='rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700'
            value={filterKategori}
            onChange={e => setFilterKategori(e.target.value)}
          >
            <option value=''>Semua Kategori</option>
            {kategori.map(k => (
              <option key={k.id_kategori} value={k.id_kategori}>
                {k.name}
              </option>
            ))}
          </select>
          <select
            className='rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700'
            value={filterKondisi}
            onChange={e => setFilterKondisi(e.target.value)}
          >
            <option value=''>Semua Kondisi</option>
            <option value='normal'>Normal</option>
            <option value='rusak'>Rusak</option>
          </select>
          <select
            className='rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700'
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value=''>Semua Status</option>
            <option value='1'>Aktif</option>
            <option value='0'>Nonaktif</option>
          </select>
          {hasFilter && (
            <button
              onClick={resetFilter}
              className='rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors'
            >
              Reset
            </button>
          )}
        </div>
        {hasFilter && (
          <p className='mt-2 text-[10px] text-gray-400'>
            Menampilkan {filtered.length} dari {alat.length} alat
          </p>
        )}
      </div>

      {/* Table */}
      <div className='rounded-lg border border-gray-100 bg-white overflow-hidden shadow-sm'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-100 bg-gray-50/50'>
                <th className='px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 w-12'>
                  Gambar
                </th>
                <th className='px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400'>
                  Kode
                </th>
                <th className='px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400'>
                  Nama Alat
                </th>
                <th className='px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400'>
                  Kategori
                </th>
                <th className='px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400'>
                  Stok
                </th>
                <th className='px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400'>
                  Harga
                </th>
                <th className='px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400'>
                  Kondisi
                </th>
                <th className='px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400'>
                  Status
                </th>
                <th className='px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400 w-10'>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className='border-b border-gray-50'>
                    {[40, 60, 120, 80, 50, 80, 70, 60, 30].map((w, j) => (
                      <td key={j} className='px-4 py-3'>
                        <div
                          className='h-3 bg-gray-100 rounded animate-pulse'
                          style={{ width: w }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan='9' className='px-5 py-12 text-center'>
                    <div className='flex flex-col items-center gap-2'>
                      <svg
                        width='48'
                        height='48'
                        fill='none'
                        stroke='#d1d5db'
                        strokeWidth='1'
                        viewBox='0 0 24 24'
                      >
                        <circle cx='11' cy='11' r='8' />
                        <line x1='21' y1='21' x2='16.65' y2='16.65' />
                      </svg>
                      <p className='text-sm text-gray-400'>
                        {hasFilter
                          ? 'Tidak ada alat yang sesuai filter'
                          : 'Belum ada data alat'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(a => (
                  <tr
                    key={a.id_alat}
                    className='border-b border-gray-50 hover:bg-gray-50/50 transition-colors'
                  >
                    <td className='px-4 py-2.5'>
                      {a.image ? (
                        <img
                          src={`${IMAGE_URL}${a.image}`}
                          alt={a.name}
                          className='h-8 w-8 rounded-md border border-gray-100 object-cover'
                        />
                      ) : (
                        <div className='flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-gray-300'>
                          <svg
                            width='12'
                            height='12'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='1.5'
                            viewBox='0 0 24 24'
                          >
                            <rect x='3' y='3' width='18' height='18' rx='2' />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className='px-4 py-2.5'>
                      <span className='font-mono text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded'>
                        {a.kode_alat}
                      </span>
                    </td>
                    <td className='px-4 py-2.5'>
                      <p className='font-medium text-gray-900 text-sm'>
                        {a.name}
                      </p>
                      {a.merk && (
                        <p className='text-[10px] text-gray-400'>
                          {a.merk} {a.tipe_model}
                        </p>
                      )}
                    </td>
                    <td className='px-4 py-2.5 text-sm text-gray-500'>
                      {a.kategori}
                    </td>
                    <td className='px-4 py-2.5'>
                      <span
                        className={`text-sm font-semibold ${
                          a.stok <= (a.stok_minimum || 0)
                            ? 'text-red-500'
                            : 'text-gray-900'
                        }`}
                      >
                        {a.stok}
                      </span>
                      {a.stok <= (a.stok_minimum || 0) &&
                        a.stok_minimum > 0 && (
                          <span className='ml-1 text-[9px] text-red-400'>
                            ⚠️
                          </span>
                        )}
                    </td>
                    <td className='px-4 py-2.5 text-sm text-gray-700'>
                      Rp {Number(a.harga || 0).toLocaleString('id-ID')}
                    </td>
                    <td className='px-4 py-2.5'>
                      {a.kondisi === 'normal' ? (
                        <span className='inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600'>
                          <span className='h-1 w-1 rounded-full bg-green-500' />
                          Normal
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-500'>
                          <span className='h-1 w-1 rounded-full bg-orange-400' />
                          Rusak
                        </span>
                      )}
                    </td>
                    <td className='px-4 py-2.5'>
                      {a.status_aktif === 1 ? (
                        <span className='inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600'>
                          <span className='h-1 w-1 rounded-full bg-green-500' />
                          Aktif
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-500'>
                          <span className='h-1 w-1 rounded-full bg-red-400' />
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className='px-2 py-2.5 text-center'>
                      <ActionMenu
                        alat={a}
                        onEdit={() => {
                          setEditingId(a.id_alat)
                          setModalOpen(true)
                        }}
                        onToggle={() => toggleStatus(a)}
                        onDelete={() => handleDelete(a.id_alat)}
                        onLihatUnit={() =>
                          navigate(`/admin/alat/${a.id_alat}/unit`)
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <AlatModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editingId={editingId}
        kategori={kategori}
        onSuccess={fetchData}
        IMAGE_URL={IMAGE_URL}
        showToast={showToast}
      />
    </div>
  )
}
