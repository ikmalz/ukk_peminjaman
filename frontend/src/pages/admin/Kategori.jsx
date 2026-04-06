import { useEffect, useState } from 'react'
import api from '../../lib/api'

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300'

function Field ({ label, children }) {
  return (
    <div className='flex flex-col gap-1'>
      <label className='text-[11px] font-semibold uppercase tracking-wider text-gray-400'>
        {label}
      </label>
      {children}
    </div>
  )
}

export default function Kategori () {
  const [kategori, setKategori] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', deskripsi: '' })
  const [error, setError] = useState('')

  const fetchKategori = async () => {
    setLoading(true)
    const res = await api.get('/kategori')
    setKategori(res.data.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchKategori()
  }, [])

  const submit = async e => {
    e.preventDefault()
    setError('')
    try {
      if (editingId) await api.put(`/kategori/${editingId}`, form)
      else await api.post('/kategori', form)
      setForm({ name: '', deskripsi: '' })
      setEditingId(null)
      fetchKategori()
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan')
    }
  }

  const editKategori = k => {
    setEditingId(k.id_kategori)
    setForm({ name: k.name, deskripsi: k.deskripsi || '' })
  }

  const deleteKategori = async id => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return
    try {
      await api.delete(`/kategori/${id}`)
      fetchKategori()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({ name: '', deskripsi: '' })
  }

  return (
    <div>
      {/* Page header */}
      <div className='mb-6'>
        <h1 className='text-[20px] font-bold tracking-tight text-gray-900'>
          Kategori
        </h1>
        <p className='mt-0.5 text-sm text-gray-400'>
          Kelola kategori alat inventaris
        </p>
      </div>

      {/* Form card */}
      <div className='mb-4 rounded-xl border border-gray-200 bg-white'>
        <div className='flex items-center justify-between border-b border-gray-100 px-5 py-3.5'>
          <span className='text-sm font-semibold text-gray-800'>
            {editingId ? 'Edit Kategori' : 'Tambah Kategori'}
          </span>
          {editingId && (
            <button
              onClick={cancelEdit}
              className='rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 transition'
            >
              Batal
            </button>
          )}
        </div>

        <div className='p-5'>
          {error && (
            <div className='mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-xs text-red-600'>
              {error}
            </div>
          )}
          <form onSubmit={submit}>
            <div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <Field label='Nama Kategori'>
                <input
                  required
                  className={inputCls}
                  placeholder='cth. Elektronik'
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <Field label='Deskripsi'>
                <input
                  className={inputCls}
                  placeholder='Deskripsi singkat (opsional)'
                  value={form.deskripsi}
                  onChange={e =>
                    setForm({ ...form, deskripsi: e.target.value })
                  }
                />
              </Field>
            </div>
            <button
              type='submit'
              className='rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-700 transition'
            >
              {editingId ? 'Simpan Perubahan' : '+ Tambah Kategori'}
            </button>
          </form>
        </div>
      </div>

      {/* Table card */}
      <div className='rounded-xl border border-gray-200 bg-white overflow-hidden'>
        <div className='flex items-center justify-between border-b border-gray-100 px-5 py-3.5'>
          <span className='text-sm font-semibold text-gray-800'>
            Daftar Kategori
          </span>
          <span className='text-xs text-gray-300'>
            {kategori.length} kategori
          </span>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-gray-100 bg-gray-50'>
                {['Nama', 'Deskripsi', 'Aksi'].map(h => (
                  <th
                    key={h}
                    className='px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400'
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className='border-b border-gray-50'>
                    {[120, 220, 80].map((w, j) => (
                      <td key={j} className='px-5 py-3.5'>
                        <div
                          className='h-3 animate-pulse rounded bg-gray-100'
                          style={{ width: w }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : kategori.length === 0 ? (
                <tr>
                  <td
                    colSpan='3'
                    className='px-5 py-10 text-center text-sm text-gray-300'
                  >
                    Belum ada kategori
                  </td>
                </tr>
              ) : (
                kategori.map(k => (
                  <tr
                    key={k.id_kategori}
                    className='border-b border-gray-50 last:border-0 hover:bg-gray-50 transition'
                  >
                    <td className='px-5 py-3.5 font-semibold text-gray-900'>
                      {k.name}
                    </td>
                    <td className='px-5 py-3.5 text-sm text-gray-400'>
                      {k.deskripsi || <span className='text-gray-200'>—</span>}
                    </td>
                    <td className='px-5 py-3.5'>
                      <div className='flex items-center gap-4'>
                        <button
                          onClick={() => editKategori(k)}
                          className='text-xs font-medium text-blue-600 hover:text-blue-800 transition'
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteKategori(k.id_kategori)}
                          className='text-xs font-medium text-red-500 hover:text-red-700 transition'
                        >
                          Hapus
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
