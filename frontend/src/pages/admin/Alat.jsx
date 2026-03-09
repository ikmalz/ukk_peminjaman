import { useEffect, useState } from 'react'
import api from '../../lib/api'

export default function Alat () {
  const [alat, setAlat] = useState([])
  const [kategori, setKategori] = useState([])
  const [loading, setLoading] = useState(true)
  const IMAGE_URL = api.defaults.baseURL.replace('/api', '')

  const [form, setForm] = useState({
    id_kategori: '',
    name: '',
    stok: '',
    stok_minimum: '',
    merk: '',
    tipe_model: '',
    spesifikasi: '',
    kondisi: 'normal'
  })

  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)

      const alatRes = await api.get('/alat')
      setAlat(alatRes.data.data)

      const katRes = await api.get('/kategori')
      setKategori(katRes.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const submit = async e => {
    e.preventDefault()
    setError('')

    try {
      const fd = new FormData()

      Object.keys(form).forEach(key => {
        fd.append(key, form[key] ?? '')
      })

      if (imageFile) {
        fd.append('image', imageFile)
      }

      if (editingId) {
        await api.put(`/alat/${editingId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        await api.post('/alat', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      resetForm()
      fetchData()
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError('Terjadi kesalahan')
      }
    }
  }

  const resetForm = () => {
    setForm({
      id_kategori: '',
      name: '',
      stok: '',
      stok_minimum: '',
      merk: '',
      tipe_model: '',
      spesifikasi: '',
      kondisi: 'normal'
    })
    setImageFile(null)
    setPreview(null)
    setEditingId(null)
  }
  console.log(api.defaults.baseURL)

  const editAlat = async id => {
    const res = await api.get(`/alat/${id}`)
    setEditingId(id)
    setForm(res.data.data)

    if (res.data.data.image) {
      setPreview(res.data.data.image)
    }
  }

  const toggleStatus = async a => {
    await api.put(`/alat/${a.id_alat}/status`, {
      status_aktif: a.status_aktif === 1 ? 0 : 1
    })
    fetchData()
  }

  return (
    <div className='space-y-6'>
      {/* HEADER */}
      <div>
        <h1 className='text-xl md:text-2xl font-semibold text-slate-800'>
          Manajemen Alat
        </h1>
        <p className='text-sm text-slate-500'>
          Kelola data alat dan inventaris
        </p>
      </div>

      {/* FORM */}
      <form
        onSubmit={submit}
        className='bg-white rounded-xl border border-slate-200 p-4 md:p-6 space-y-4'
      >
        <h2 className='text-sm font-semibold text-slate-700'>
          {editingId ? 'Edit Data Alat' : 'Tambah Alat Baru'}
        </h2>

        {error && (
          <div className='rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700'>
            {error}
          </div>
        )}

        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <select
            required
            className='rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500'
            value={form.id_kategori}
            onChange={e => setForm({ ...form, id_kategori: e.target.value })}
          >
            <option value=''>Pilih Kategori</option>
            {kategori.map(k => (
              <option key={k.id_kategori} value={k.id_kategori}>
                {k.name}
              </option>
            ))}
          </select>

          <input
            required
            placeholder='Nama Alat'
            className='rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500'
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />

          <input
            type='number'
            required
            placeholder='Stok'
            className='rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500'
            value={form.stok}
            onChange={e => setForm({ ...form, stok: e.target.value })}
          />

          <input
            type='number'
            placeholder='Stok Minimum'
            className='rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500'
            value={form.stok_minimum}
            onChange={e => setForm({ ...form, stok_minimum: e.target.value })}
          />

          {editingId && (
            <select
              className='rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500'
              value={form.kondisi}
              onChange={e => setForm({ ...form, kondisi: e.target.value })}
            >
              <option value='normal'>Normal</option>
              <option value='rusak'>Rusak</option>
            </select>
          )}

          <input
            placeholder='Merk'
            className='rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500'
            value={form.merk}
            onChange={e => setForm({ ...form, merk: e.target.value })}
          />

          <input
            placeholder='Tipe / Model'
            className='rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500'
            value={form.tipe_model}
            onChange={e => setForm({ ...form, tipe_model: e.target.value })}
          />
        </div>

        <textarea
          placeholder='Spesifikasi alat'
          rows='3'
          className='w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500'
          value={form.spesifikasi}
          onChange={e => setForm({ ...form, spesifikasi: e.target.value })}
        />

        {/* UPLOAD GAMBAR */}
        <div className='space-y-2'>
          <label className='text-sm font-medium text-slate-600'>
            Gambar Alat
          </label>

          <input
            type='file'
            accept='image/*'
            className='w-full text-sm'
            onChange={e => {
              const file = e.target.files[0]
              if (file) {
                setImageFile(file)
                setPreview(URL.createObjectURL(file))
              }
            }}
          />

          {preview && (
            <div className='w-32 h-32 rounded-lg overflow-hidden border'>
              <img
                src={preview}
                alt='preview'
                className='w-full h-full object-cover'
              />
            </div>
          )}
        </div>

        <div className='flex gap-2'>
          <button className='rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition'>
            {editingId ? 'Update Alat' : 'Simpan Alat'}
          </button>

          {editingId && (
            <button
              type='button'
              onClick={resetForm}
              className='rounded-lg bg-slate-400 px-4 py-2 text-sm font-medium text-white hover:bg-slate-500 transition'
            >
              Batal
            </button>
          )}
        </div>
      </form>

      {/* TABLE */}
      <div className='bg-white rounded-xl border border-slate-200 overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead className='bg-slate-100 text-slate-600'>
            <tr>
              <th className='px-4 py-3 text-left font-medium'>Kode</th>
              <th className='px-4 py-3 text-left font-medium'>Nama</th>
              <th className='px-4 py-3 text-left font-medium'>Gambar</th>
              <th className='px-4 py-3 text-left font-medium'>Kategori</th>
              <th className='px-4 py-3 text-left font-medium'>Stok</th>
              <th className='px-4 py-3 text-left font-medium'>Kondisi</th>
              <th className='px-4 py-3 text-left font-medium'>Status</th>
              <th className='px-4 py-3 text-left font-medium'>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan='7'
                  className='px-4 py-6 text-center text-slate-500'
                >
                  Memuat data...
                </td>
              </tr>
            ) : alat.length === 0 ? (
              <tr>
                <td
                  colSpan='7'
                  className='px-4 py-6 text-center text-slate-500'
                >
                  Data alat belum tersedia
                </td>
              </tr>
            ) : (
              alat.map(a => (
                <tr key={a.id_alat} className='border-t hover:bg-slate-50'>
                  <td className='px-4 py-3'>{a.kode_alat}</td>
                  <td className='px-4 py-3'>{a.name}</td>
                  <td className='px-4 py-3'>
                    {a.image ? (
                      <img
                        src={`${IMAGE_URL}${a.image}`}
                        alt={a.name}
                        className='w-12 h-12 object-cover rounded-md border'
                      />
                    ) : (
                      <span className='text-xs text-slate-400'>-</span>
                    )}
                  </td>

                  <td className='px-4 py-3'>{a.kategori}</td>
                  <td className='px-4 py-3'>{a.stok}</td>
                  <td className='px-4 py-3 capitalize'>{a.kondisi}</td>
                  <td className='px-4 py-3'>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        a.status_aktif === 1
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {a.status_aktif === 1 ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className='px-4 py-3 space-x-3'>
                    <button
                      onClick={() => editAlat(a.id_alat)}
                      className='text-blue-600 hover:underline text-xs'
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleStatus(a)}
                      className='text-orange-600 hover:underline text-xs'
                    >
                      {a.status_aktif === 1 ? 'Nonaktifkan' : 'Aktifkan'}
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
