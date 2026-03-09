import { useEffect, useState } from 'react'
import api from '../../lib/api'

export default function Kategori () {
  const [kategori, setKategori] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: '',
    deskripsi: ''
  })
  const [editingId, setEditingId] = useState(null)
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
      if (editingId) {
        await api.put(`/kategori/${editingId}`, form)
      } else {
        await api.post('/kategori', form)
      }

      setForm({ name: '', deskripsi: '' })
      setEditingId(null)
      fetchKategori()
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan')
    }
  }

  const editKategori = k => {
    setEditingId(k.id_kategori)
    setForm({
      name: k.name,
      deskripsi: k.deskripsi || ''
    })
  }

  const deleteKategori = async id => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return

    try {
      await api.delete(`/kategori/${id}`)
      fetchKategori()
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus kategori')
    }
  }

  return (
    <div className='space-y-6'>
      {/* HEADER */}
      <div>
        <h1 className='text-xl md:text-2xl font-semibold text-slate-800'>
          Manajemen Kategori
        </h1>
        <p className='text-sm text-slate-500'>
          Kelola kategori alat inventaris
        </p>
      </div>

      {/* FORM */}
      <form
        onSubmit={submit}
        className='bg-white rounded-xl border border-slate-200 p-4 md:p-6 space-y-4'
      >
        <h2 className='text-sm font-semibold text-slate-700'>
          {editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
        </h2>

        {error && (
          <div className='rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700'>
            {error}
          </div>
        )}

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <input
            required
            placeholder='Nama kategori'
            className='rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500'
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <input
            placeholder='Deskripsi (opsional)'
            className='rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500'
            value={form.deskripsi}
            onChange={e => setForm({ ...form, deskripsi: e.target.value })}
          />
        </div>

        <button className='inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition'>
          {editingId ? 'Update Kategori' : 'Simpan Kategori'}
        </button>
      </form>

      {/* TABLE */}
      <div className='bg-white rounded-xl border border-slate-200 overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead className='bg-slate-100 text-slate-600'>
            <tr>
              <th className='px-4 py-3 text-left font-medium'>Nama</th>
              <th className='px-4 py-3 text-left font-medium'>Deskripsi</th>
              <th className='px-4 py-3 text-left font-medium'>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan='3'
                  className='px-4 py-6 text-center text-slate-500'
                >
                  Memuat data...
                </td>
              </tr>
            ) : kategori.length === 0 ? (
              <tr>
                <td
                  colSpan='3'
                  className='px-4 py-6 text-center text-slate-500'
                >
                  Kategori belum tersedia
                </td>
              </tr>
            ) : (
              kategori.map(k => (
                <tr key={k.id_kategori} className='border-t hover:bg-slate-50'>
                  <td className='px-4 py-3 font-medium text-slate-700'>
                    {k.name}
                  </td>
                  <td className='px-4 py-3 text-slate-600'>
                    {k.deskripsi || '-'}
                  </td>
                  <td className='px-4 py-3 space-x-3'>
                    <button
                      onClick={() => editKategori(k)}
                      className='text-blue-600 hover:underline text-xs'
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteKategori(k.id_kategori)}
                      className='text-red-600 hover:underline text-xs'
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
