import { useEffect, useState } from 'react'
import api from '../../lib/api'

const initials = (name = '') =>
  name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

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

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300'

export default function Users () {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'peminjam',
    password: ''
  })

  const fetchUsers = async () => {
    setLoading(true)
    const res = await api.get('/users')
    setUsers(res.data.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const submit = async e => {
    e.preventDefault()
    if (editingId) await api.put(`/users/${editingId}`, form)
    else await api.post('/users', form)
    setForm({ name: '', email: '', role: 'peminjam', password: '' })
    setEditingId(null)
    fetchUsers()
  }

  const editUser = u => {
    setEditingId(u.id_user)
    setForm({ name: u.name, email: u.email, role: u.role, password: '' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({ name: '', email: '', role: 'peminjam', password: '' })
  }

  const toggleStatus = async u => {
    await api.put(`/users/${u.id_user}/status`, {
      status: u.status === 1 ? 0 : 1
    })
    fetchUsers()
  }

  const resetPassword = async id => {
    if (!confirm('Reset password ke default?')) return
    await api.put(`/users/${id}/reset-password`)
    alert('Password direset ke 123456')
  }

  return (
    <div>
      {/* Page header */}
      <div className='mb-6'>
        <h1 className='text-[20px] font-bold tracking-tight text-gray-900'>
          Users
        </h1>
        <p className='mt-0.5 text-sm text-gray-400'>
          Kelola akun pengguna sistem
        </p>
      </div>

      {/* Form card */}
      <div className='mb-4 rounded-xl border border-gray-200 bg-white'>
        <div className='flex items-center justify-between border-b border-gray-100 px-5 py-3.5'>
          <span className='text-sm font-semibold text-gray-800'>
            {editingId ? 'Edit User' : 'Tambah User'}
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
          <form onSubmit={submit}>
            <div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              <Field label='Nama'>
                <input
                  required
                  className={inputCls}
                  placeholder='Nama lengkap'
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <Field label='Email'>
                <input
                  required
                  type='email'
                  className={inputCls}
                  placeholder='email@contoh.com'
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field label='Role'>
                <select
                  className={inputCls}
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                >
                  <option value='peminjam'>Peminjam</option>
                  <option value='petugas'>Petugas</option>
                </select>
              </Field>
              {!editingId && (
                <Field label='Password'>
                  <input
                    type='password'
                    className={inputCls}
                    placeholder='Kosong = 123456'
                    value={form.password}
                    onChange={e =>
                      setForm({ ...form, password: e.target.value })
                    }
                  />
                </Field>
              )}
            </div>
            <button
              type='submit'
              className='rounded-lg bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-700 transition'
            >
              {editingId ? 'Simpan Perubahan' : '+ Tambah User'}
            </button>
          </form>
        </div>
      </div>

      {/* Table card */}
      <div className='rounded-xl border border-gray-200 bg-white overflow-hidden'>
        <div className='flex items-center justify-between border-b border-gray-100 px-5 py-3.5'>
          <span className='text-sm font-semibold text-gray-800'>
            Daftar User
          </span>
          <span className='text-xs text-gray-300'>{users.length} akun</span>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-gray-100 bg-gray-50'>
                {['Pengguna', 'Role', 'Status', 'Aksi'].map(h => (
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
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className='border-b border-gray-50'>
                    {[160, 80, 70, 120].map((w, j) => (
                      <td key={j} className='px-5 py-3.5'>
                        <div
                          className='h-3 animate-pulse rounded bg-gray-100'
                          style={{ width: w }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan='4'
                    className='px-5 py-10 text-center text-sm text-gray-300'
                  >
                    Belum ada data user
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr
                    key={u.id_user}
                    className='border-b border-gray-50 last:border-0 hover:bg-gray-50 transition'
                  >
                    {/* Pengguna */}
                    <td className='px-5 py-3.5'>
                      <div className='flex items-center gap-2.5'>
                        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[11px] font-bold text-blue-600'>
                          {initials(u.name)}
                        </div>
                        <div>
                          <p className='font-semibold text-gray-900 leading-tight'>
                            {u.name}
                          </p>
                          <p className='text-[11px] text-gray-400'>{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className='px-5 py-3.5'>
                      <span className='rounded bg-gray-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-gray-500'>
                        {u.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className='px-5 py-3.5'>
                      {u.status === 1 ? (
                        <span className='inline-flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-600'>
                          <span className='h-1.5 w-1.5 rounded-full bg-green-500' />
                          Aktif
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-500'>
                          <span className='h-1.5 w-1.5 rounded-full bg-red-400' />
                          Nonaktif
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className='px-5 py-3.5'>
                      {u.role === 'admin' ? (
                        <span className='text-xs italic text-gray-300'>—</span>
                      ) : (
                        <div className='flex items-center gap-4'>
                          <button
                            onClick={() => editUser(u)}
                            className='text-xs font-medium text-blue-600 hover:text-blue-800 transition'
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleStatus(u)}
                            className='text-xs font-medium text-amber-600 hover:text-amber-800 transition'
                          >
                            {u.status === 1 ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                          <button
                            onClick={() => resetPassword(u.id_user)}
                            className='text-xs font-medium text-red-500 hover:text-red-700 transition'
                          >
                            Reset PW
                          </button>
                        </div>
                      )}
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
