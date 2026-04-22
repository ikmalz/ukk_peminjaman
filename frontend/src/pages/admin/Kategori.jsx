import { useEffect, useState } from 'react'
import api from '../../lib/api'
import Toast from '../../components/Toast' 

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-gray-100 placeholder:text-gray-400'

export default function Kategori () {
  const [kategori, setKategori] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', deskripsi: '' })
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const fetchKategori = async () => {
    setLoading(true)
    try {
      const res = await api.get('/kategori')
      setKategori(res.data.data)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKategori()
  }, [])

  const openAdd = () => {
    setEditingId(null)
    setForm({ name: '', deskripsi: '' })
    setError('')
    setModalOpen(true)
  }

  const openEdit = k => {
    setEditingId(k.id_kategori)
    setForm({ name: k.name, deskripsi: k.deskripsi || '' })
    setError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm({ name: '', deskripsi: '' })
    setError('')
  }

  const submit = async () => {
    setError('')
    if (!form.name.trim()) {
      setError('Nama kategori wajib diisi')
      return
    }

    try {
      if (editingId) {
        await api.put(`/kategori/${editingId}`, form)
        showToast('✅ Kategori berhasil diperbarui!', 'success')
      } else {
        await api.post('/kategori', form)
        showToast('✅ Kategori berhasil ditambahkan!', 'success')
      }
      closeModal()
      fetchKategori()
    } catch (err) {
      const msg = err.response?.data?.message || 'Terjadi kesalahan'
      setError(msg)
      showToast(msg, 'error')
    }
  }

  const deleteKategori = async (id, name) => {
    if (!confirm(`Yakin ingin menghapus kategori "${name}"?`)) return

    try {
      await api.delete(`/kategori/${id}`)
      fetchKategori()
      showToast(`✅ Kategori "${name}" berhasil dihapus`, 'success')
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menghapus kategori'
      showToast(msg, 'error')
    }
  }

  const filteredKategori = kategori.filter(
    k =>
      k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (k.deskripsi &&
        k.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes modalBackdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-animate {
          animation: modalFadeIn 0.2s ease-out;
        }
        .backdrop-animate {
          animation: modalBackdropFade 0.15s ease-out;
        }
      `}</style>

      {/* Modal Popup */}
      {modalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-animate'>
          <div className='absolute inset-0 bg-black/40' onClick={closeModal} />
          <div className='relative w-full max-w-md rounded-xl bg-white shadow-xl modal-animate'>
            {/* Header */}
            <div className='flex items-center justify-between border-b border-gray-100 px-5 py-4'>
              <div>
                <h2 className='text-base font-semibold text-gray-900'>
                  {editingId ? 'Edit Kategori' : 'Tambah Kategori'}
                </h2>
                <p className='text-xs text-gray-400 mt-0.5'>
                  {editingId
                    ? 'Ubah informasi kategori'
                    : 'Isi data kategori baru'}
                </p>
              </div>
              <button
                onClick={closeModal}
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
            <div className='p-5 space-y-4'>
              {error && (
                <div className='rounded-lg bg-red-50 px-4 py-2.5 text-xs text-red-600 border border-red-100'>
                  {error}
                </div>
              )}
              <div>
                <label className='mb-1.5 block text-xs font-medium text-gray-600'>
                  Nama Kategori <span className='text-red-400'>*</span>
                </label>
                <input
                  required
                  autoFocus
                  className={inputCls}
                  placeholder='Contoh: Elektronik, Alat Tulis, Perkakas'
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onKeyPress={e => e.key === 'Enter' && submit()}
                />
              </div>
              <div>
                <label className='mb-1.5 block text-xs font-medium text-gray-600'>
                  Deskripsi
                </label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  placeholder='Deskripsi singkat tentang kategori ini'
                  value={form.deskripsi}
                  onChange={e =>
                    setForm(f => ({ ...f, deskripsi: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Footer */}
            <div className='flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4'>
              <button
                type='button'
                onClick={closeModal}
                className='rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors'
              >
                Batal
              </button>
              <button
                onClick={submit}
                className='rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors shadow-sm'
              >
                {editingId ? 'Simpan Perubahan' : 'Tambah Kategori'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className='mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='text-lg font-semibold tracking-tight text-gray-900'>
            Kategori
          </h1>
          <p className='text-sm text-gray-400 mt-0.5'>
            Kelola kelompok jenis alat inventaris
          </p>
        </div>
        <button
          onClick={openAdd}
          className='flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-all duration-200 shadow-sm'
        >
          <svg
            width='16'
            height='16'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <line x1='12' y1='5' x2='12' y2='19' />
            <line x1='5' y1='12' x2='19' y2='12' />
          </svg>
          Tambah Kategori
        </button>
      </div>

      {/* Stats Cards */}
      <div className='mb-5 grid grid-cols-3 gap-3'>
        <div className='rounded-xl border border-gray-100 bg-white p-3 shadow-sm'>
          <p className='text-[11px] font-medium text-gray-400 uppercase tracking-wider'>
            Total Kategori
          </p>
          <p className='text-xl font-bold text-gray-900 mt-1'>
            {kategori.length}
          </p>
        </div>
        <div className='rounded-xl border border-gray-100 bg-white p-3 shadow-sm'>
          <p className='text-[11px] font-medium text-gray-400 uppercase tracking-wider'>
            Dengan Deskripsi
          </p>
          <p className='text-xl font-bold text-gray-900 mt-1'>
            {kategori.filter(k => k.deskripsi).length}
          </p>
        </div>
        <div className='rounded-xl border border-gray-100 bg-white p-3 shadow-sm'>
          <p className='text-[11px] font-medium text-gray-400 uppercase tracking-wider'>
            Tanpa Deskripsi
          </p>
          <p className='text-xl font-bold text-gray-900 mt-1'>
            {kategori.filter(k => !k.deskripsi).length}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className='mb-4'>
        <div className='relative'>
          <svg
            className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.5'
            viewBox='0 0 24 24'
          >
            <circle cx='11' cy='11' r='8' />
            <line x1='21' y1='21' x2='16.65' y2='16.65' />
          </svg>
          <input
            type='text'
            placeholder='Cari kategori...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100'
          />
        </div>
      </div>

      {/* Table */}
      <div className='rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-100 bg-gray-50/50'>
                <th className='px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400'>
                  No
                </th>
                <th className='px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400'>
                  Nama Kategori
                </th>
                <th className='px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400'>
                  Deskripsi
                </th>
                <th className='px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400'>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className='border-b border-gray-50'>
                    <td className='px-5 py-3.5'>
                      <div className='h-4 w-6 bg-gray-100 rounded animate-pulse' />
                    </td>
                    <td className='px-5 py-3.5'>
                      <div className='h-4 w-32 bg-gray-100 rounded animate-pulse' />
                    </td>
                    <td className='px-5 py-3.5'>
                      <div className='h-4 w-48 bg-gray-100 rounded animate-pulse' />
                    </td>
                    <td className='px-5 py-3.5'>
                      <div className='h-4 w-16 bg-gray-100 rounded animate-pulse ml-auto' />
                    </td>
                  </tr>
                ))
              ) : filteredKategori.length === 0 ? (
                <tr>
                  <td colSpan='4' className='px-5 py-12 text-center'>
                    <div className='flex flex-col items-center gap-2'>
                      <svg
                        width='48'
                        height='48'
                        fill='none'
                        stroke='#d1d5db'
                        strokeWidth='1'
                        viewBox='0 0 24 24'
                      >
                        <path d='M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z' />
                        <circle cx='7' cy='7' r='1.5' />
                      </svg>
                      <p className='text-sm text-gray-400'>
                        {searchTerm
                          ? 'Kategori tidak ditemukan'
                          : 'Belum ada kategori'}
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={openAdd}
                          className='text-sm text-gray-500 hover:text-gray-700'
                        >
                          Tambah kategori pertama
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredKategori.map((k, index) => (
                  <tr
                    key={k.id_kategori}
                    className='border-b border-gray-50 hover:bg-gray-50/50 transition-colors group'
                  >
                    <td className='px-5 py-3.5 text-xs text-gray-400'>
                      {index + 1}
                    </td>
                    <td className='px-5 py-3.5'>
                      <div className='flex items-center gap-2'>
                        <div className='p-1.5 rounded-lg bg-gray-100 text-gray-500'>
                          <svg
                            width='14'
                            height='14'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='1.5'
                            viewBox='0 0 24 24'
                          >
                            <path d='M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z' />
                            <circle cx='7' cy='7' r='1.5' />
                          </svg>
                        </div>
                        <span className='font-medium text-gray-900 text-sm'>
                          {k.name}
                        </span>
                      </div>
                    </td>
                    <td className='px-5 py-3.5 text-sm text-gray-500'>
                      {k.deskripsi || (
                        <span className='text-gray-300 italic'>-</span>
                      )}
                    </td>
                    <td className='px-5 py-3.5 text-right'>
                      <div className='flex items-center justify-end gap-1'>
                        <button
                          onClick={() => openEdit(k)}
                          className='p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors'
                          title='Edit'
                        >
                          <svg
                            width='15'
                            height='15'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='1.5'
                            viewBox='0 0 24 24'
                          >
                            <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
                            <path d='M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z' />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteKategori(k.id_kategori, k.name)}
                          className='p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors'
                          title='Hapus'
                        >
                          <svg
                            width='15'
                            height='15'
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
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
