import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { useNavigate } from 'react-router-dom'

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

const blank = {
  id_kategori: '',
  name: '',
  stok: '',
  stok_minimum: '',
  merk: '',
  tipe_model: '',
  spesifikasi: '',
  kondisi: 'normal'
}

export default function Alat () {
  const [alat, setAlat] = useState([])
  const [kategori, setKategori] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(blank)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
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

  useEffect(() => {
    fetchData()
  }, [])

  const submit = async e => {
    e.preventDefault()
    setError('')
    try {
      const fd = new FormData()
      Object.keys(form).forEach(k => fd.append(k, form[k] ?? ''))
      if (imageFile) fd.append('image', imageFile)
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } }
      if (editingId) await api.put(`/alat/${editingId}`, fd, cfg)
      else await api.post('/alat', fd, cfg)
      resetForm()
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan')
    }
  }

  const resetForm = () => {
    setForm(blank)
    setImageFile(null)
    setPreview(null)
    setEditingId(null)
  }

  const editAlat = async id => {
    const res = await api.get(`/alat/${id}`)
    setEditingId(id)
    setForm(res.data.data)
    if (res.data.data.image) setPreview(res.data.data.image)
  }

  const toggleStatus = async a => {
    await api.put(`/alat/${a.id_alat}/status`, {
      status_aktif: a.status_aktif === 1 ? 0 : 1
    })
    fetchData()
  }

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }))

  const imgSrc = src =>
    src?.startsWith('blob') || src?.startsWith('http')
      ? src
      : `${IMAGE_URL}${src}`

  return (
    <div>
      {/* Page header */}
      <div className='mb-6'>
        <h1 className='text-[20px] font-bold tracking-tight text-gray-900'>
          Alat
        </h1>
        <p className='mt-0.5 text-sm text-gray-400'>
          Kelola data alat dan inventaris
        </p>
      </div>

      {/* Form card */}
      <div className='mb-4 rounded-xl border border-gray-200 bg-white'>
        <div className='flex items-center justify-between border-b border-gray-100 px-5 py-3.5'>
          <span className='text-sm font-semibold text-gray-800'>
            {editingId ? 'Edit Alat' : 'Tambah Alat'}
          </span>
          {editingId && (
            <button
              onClick={resetForm}
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
            <div className='mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              <Field label='Kategori'>
                <select
                  required
                  className={inputCls}
                  value={form.id_kategori}
                  onChange={e => f('id_kategori', e.target.value)}
                >
                  <option value=''>Pilih kategori</option>
                  {kategori.map(k => (
                    <option key={k.id_kategori} value={k.id_kategori}>
                      {k.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label='Nama Alat'>
                <input
                  required
                  className={inputCls}
                  placeholder='Nama alat'
                  value={form.name}
                  onChange={e => f('name', e.target.value)}
                />
              </Field>
              <Field label='Stok'>
                <input
                  type='number'
                  required
                  className={inputCls}
                  placeholder='0'
                  value={form.stok}
                  onChange={e => f('stok', e.target.value)}
                />
              </Field>
              <Field label='Stok Minimum'>
                <input
                  type='number'
                  className={inputCls}
                  placeholder='0'
                  value={form.stok_minimum}
                  onChange={e => f('stok_minimum', e.target.value)}
                />
              </Field>
              <Field label='Merk'>
                <input
                  className={inputCls}
                  placeholder='cth. Bosch'
                  value={form.merk}
                  onChange={e => f('merk', e.target.value)}
                />
              </Field>
              <Field label='Tipe / Model'>
                <input
                  className={inputCls}
                  placeholder='cth. GSB 13 RE'
                  value={form.tipe_model}
                  onChange={e => f('tipe_model', e.target.value)}
                />
              </Field>
              {editingId && (
                <Field label='Kondisi'>
                  <select
                    className={inputCls}
                    value={form.kondisi}
                    onChange={e => f('kondisi', e.target.value)}
                  >
                    <option value='normal'>Normal</option>
                    <option value='rusak'>Rusak</option>
                  </select>
                </Field>
              )}
            </div>

            <div className='mb-3'>
              <Field label='Spesifikasi'>
                <textarea
                  rows={3}
                  className={inputCls + ' resize-none'}
                  placeholder='Deskripsi / spesifikasi alat...'
                  value={form.spesifikasi}
                  onChange={e => f('spesifikasi', e.target.value)}
                />
              </Field>
            </div>

            {/* Upload */}
            <div className='mb-4'>
              <p className='mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400'>
                Gambar Alat
              </p>
              <label className='flex cursor-pointer items-center gap-4 rounded-lg border border-dashed border-gray-200 p-4 transition hover:border-blue-400 hover:bg-blue-50/30'>
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
                    className='h-14 w-14 shrink-0 rounded-lg border border-gray-200 object-cover'
                  />
                ) : (
                  <div className='flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-300'>
                    <svg
                      width='20'
                      height='20'
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
                  <p className='text-sm font-medium text-gray-600'>
                    {preview
                      ? 'Klik untuk ganti gambar'
                      : 'Klik untuk pilih gambar'}
                  </p>
                  <p className='text-xs text-gray-400'>
                    PNG, JPG, WEBP · maks 5 MB
                  </p>
                </div>
              </label>
            </div>

            <button
              type='submit'
              className='rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-700 transition'
            >
              {editingId ? 'Simpan Perubahan' : '+ Tambah Alat'}
            </button>
          </form>
        </div>
      </div>

      {/* Table card */}
      <div className='rounded-xl border border-gray-200 bg-white overflow-hidden'>
        <div className='flex items-center justify-between border-b border-gray-100 px-5 py-3.5'>
          <span className='text-sm font-semibold text-gray-800'>
            Inventaris Alat
          </span>
          <span className='text-xs text-gray-300'>{alat.length} alat</span>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-gray-100 bg-gray-50'>
                {[
                  '',
                  'Kode',
                  'Nama',
                  'Kategori',
                  'Stok',
                  'Kondisi',
                  'Status',
                  'Aksi'
                ].map((h, i) => (
                  <th
                    key={i}
                    className='px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400'
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className='border-b border-gray-50'>
                    {[40, 70, 140, 90, 50, 70, 70, 100].map((w, j) => (
                      <td key={j} className='px-4 py-3.5'>
                        <div
                          className='h-3 animate-pulse rounded bg-gray-100'
                          style={{ width: w }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : alat.length === 0 ? (
                <tr>
                  <td
                    colSpan='8'
                    className='px-5 py-10 text-center text-sm text-gray-300'
                  >
                    Belum ada data alat
                  </td>
                </tr>
              ) : (
                alat.map(a => (
                  <tr
                    key={a.id_alat}
                    className='border-b border-gray-50 last:border-0 hover:bg-gray-50 transition'
                  >
                    {/* Gambar */}
                    <td className='px-4 py-3'>
                      {a.image ? (
                        <img
                          src={`${IMAGE_URL}${a.image}`}
                          alt={a.name}
                          className='h-10 w-10 rounded-lg border border-gray-100 object-cover'
                        />
                      ) : (
                        <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-300'>
                          <svg
                            width='14'
                            height='14'
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
                    </td>

                    {/* Kode */}
                    <td className='px-4 py-3'>
                      <span className='rounded bg-gray-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-gray-500'>
                        {a.kode_alat}
                      </span>
                    </td>

                    {/* Nama */}
                    <td className='px-4 py-3'>
                      <p className='font-semibold text-gray-900 leading-tight'>
                        {a.name}
                      </p>
                      {a.merk && (
                        <p className='text-[11px] text-gray-400'>
                          {a.merk} {a.tipe_model}
                        </p>
                      )}
                    </td>

                    {/* Kategori */}
                    <td className='px-4 py-3 text-sm text-gray-500'>
                      {a.kategori}
                    </td>

                    {/* Stok */}
                    <td className='px-4 py-3'>
                      <span
                        className={`font-semibold ${
                          a.stok <= (a.stok_minimum || 0)
                            ? 'text-red-500'
                            : 'text-gray-900'
                        }`}
                      >
                        {a.stok}
                      </span>
                      {a.stok_minimum > 0 && (
                        <span className='ml-1 text-[11px] text-gray-300'>
                          / {a.stok_minimum}
                        </span>
                      )}
                    </td>

                    {/* Kondisi */}
                    <td className='px-4 py-3'>
                      {a.kondisi === 'normal' ? (
                        <span className='inline-flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-600'>
                          <span className='h-1.5 w-1.5 rounded-full bg-green-500' />{' '}
                          Normal
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-orange-500'>
                          <span className='h-1.5 w-1.5 rounded-full bg-orange-400' />{' '}
                          Rusak
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className='px-4 py-3'>
                      {a.status_aktif === 1 ? (
                        <span className='inline-flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-600'>
                          <span className='h-1.5 w-1.5 rounded-full bg-green-500' />{' '}
                          Aktif
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-500'>
                          <span className='h-1.5 w-1.5 rounded-full bg-red-400' />{' '}
                          Nonaktif
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className='px-4 py-3'>
                      <div className='flex items-center gap-4'>
                        <button
                          onClick={() => editAlat(a.id_alat)}
                          className='text-xs font-medium text-blue-600 hover:text-blue-800 transition'
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleStatus(a)}
                          className='text-xs font-medium text-amber-600 hover:text-amber-800 transition'
                        >
                          {a.status_aktif === 1 ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/admin/alat/${a.id_alat}/unit`)
                          }
                          className='text-xs text-gray-500 hover:text-black'
                        >
                          Lihat Unit
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
