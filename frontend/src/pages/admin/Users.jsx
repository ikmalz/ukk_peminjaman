import { useEffect, useState } from 'react'
import api from '../../lib/api'

export default function Users () {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'peminjam',
    password: ''
  })
  const [editingId, setEditingId] = useState(null)

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
    setForm({ name: u.name, email: u.email, role: u.role })
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
    <div className='space-y-6'>
      {/* HEADER */}
      <div>
        <h1 className='text-xl md:text-2xl font-semibold text-slate-800'>
          Manajemen User
        </h1>
        <p className='text-sm text-slate-500'>Kelola akun pengguna sistem</p>
      </div>

      {/* FORM */}
      <form
        onSubmit={submit}
        className='bg-white rounded-xl border border-slate-200 p-4 md:p-6 space-y-4'
      >
        <h2 className='text-sm font-semibold text-slate-700'>
          {editingId ? 'Edit User' : 'Tambah User Baru'}
        </h2>

        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <input
            required
            placeholder='Nama lengkap'
            className='rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500'
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <input
            required
            type='email'
            placeholder='Email'
            className='rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500'
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <select
            className='rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500'
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
          >
            <option value='peminjam'>Peminjam</option>
            <option value='petugas'>Petugas</option>
          </select>
          {!editingId && (
            <input
              type='password'
              placeholder='Password (default 123456)'
              className='rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500'
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          )}
        </div>

        <button className='inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition'>
          {editingId ? 'Update User' : 'Simpan User'}
        </button>
      </form>

      {/* TABLE */}
      <div className='bg-white rounded-xl border border-slate-200 overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead className='bg-slate-100 text-slate-600'>
            <tr>
              <th className='px-4 py-3 text-left font-medium'>Nama</th>
              <th className='px-4 py-3 text-left font-medium'>Email</th>
              <th className='px-4 py-3 text-left font-medium'>Role</th>
              <th className='px-4 py-3 text-left font-medium'>Status</th>
              <th className='px-4 py-3 text-left font-medium'>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan='5'
                  className='px-4 py-6 text-center text-slate-500'
                >
                  Memuat data...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan='5'
                  className='px-4 py-6 text-center text-slate-500'
                >
                  Data user belum tersedia
                </td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.id_user} className='border-t hover:bg-slate-50'>
                  <td className='px-4 py-3'>{u.name}</td>
                  <td className='px-4 py-3'>{u.email}</td>
                  <td className='px-4 py-3 capitalize'>{u.role}</td>
                  <td className='px-4 py-3'>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        u.status === 1
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {u.status === 1 ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className='px-4 py-3 space-x-3'>
                    {u.role === 'admin' ? (
                      <span className='text-xs italic text-slate-400'>
                        Tidak tersedia
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => editUser(u)}
                          className='text-blue-600 hover:underline text-xs'
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleStatus(u)}
                          className='text-orange-600 hover:underline text-xs'
                        >
                          {u.status === 1 ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button
                          onClick={() => resetPassword(u.id_user)}
                          className='text-red-600 hover:underline text-xs'
                        >
                          Reset PW
                        </button>
                      </>
                    )}
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
