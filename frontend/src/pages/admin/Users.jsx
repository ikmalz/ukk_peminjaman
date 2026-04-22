// Users.jsx - Versi dengan Toast Notification + Dropdown Aksi
import { useEffect, useState, useRef } from 'react'
import api from '../../lib/api'
import Toast from '../../components/Toast'

const initials = (name = '') =>
  name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-gray-100 placeholder:text-gray-300'

// Komponen Dropdown Aksi
function ActionDropdown ({
  user,
  onEdit,
  onToggleStatus,
  onResetPassword,
  onDelete
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = e => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAction = fn => {
    setOpen(false)
    fn()
  }

  return (
    <div className='relative' ref={ref}>
      {/* Tombol Tiga Titik */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className='p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors'
        title='Aksi'
      >
        <svg width='16' height='16' fill='currentColor' viewBox='0 0 24 24'>
          <circle cx='5' cy='12' r='1.5' />
          <circle cx='12' cy='12' r='1.5' />
          <circle cx='19' cy='12' r='1.5' />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className='absolute right-0 z-50 mt-1 w-44 rounded-xl border border-gray-100 bg-white shadow-lg py-1 dropdown-animate'>
          {/* Edit */}
          <button
            onClick={() => handleAction(() => onEdit(user))}
            className='flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
          >
            <svg
              width='14'
              height='14'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
              viewBox='0 0 24 24'
              className='text-blue-500'
            >
              <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
              <path d='M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z' />
            </svg>
            Edit Pengguna
          </button>

          {/* Aktifkan / Nonaktifkan */}
          <button
            onClick={() => handleAction(() => onToggleStatus(user))}
            className='flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
          >
            {user.status === 1 ? (
              <>
                <svg
                  width='14'
                  height='14'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  viewBox='0 0 24 24'
                  className='text-amber-500'
                >
                  <circle cx='12' cy='12' r='10' />
                  <line x1='4.93' y1='4.93' x2='19.07' y2='19.07' />
                </svg>
                Nonaktifkan
              </>
            ) : (
              <>
                <svg
                  width='14'
                  height='14'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  viewBox='0 0 24 24'
                  className='text-green-500'
                >
                  <circle cx='12' cy='12' r='10' />
                  <polyline points='12 6 12 12 16 14' />
                </svg>
                Aktifkan
              </>
            )}
          </button>

          {/* Reset Password */}
          <button
            onClick={() =>
              handleAction(() => onResetPassword(user.id_user, user.name))
            }
            className='flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors'
          >
            <svg
              width='14'
              height='14'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
              viewBox='0 0 24 24'
              className='text-gray-400'
            >
              <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
              <circle cx='12' cy='12' r='3' />
            </svg>
            Reset Password
          </button>

          {/* Divider */}
          <div className='my-1 border-t border-gray-100' />

          {/* Hapus */}
          <button
            onClick={() =>
              handleAction(() => onDelete(user.id_user, user.name))
            }
            className='flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors'
          >
            <svg
              width='14'
              height='14'
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
            Hapus User
          </button>
        </div>
      )}
    </div>
  )
}

export default function Users () {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  })
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'peminjam',
    password: ''
  })

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/users')
      setUsers(res.data.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      showToast('Gagal memuat data pengguna', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const showToast = (message, type = 'success') =>
    setToast({ show: true, message, type })
  const closeToast = () =>
    setToast({ show: false, message: '', type: 'success' })

  const openAddModal = () => {
    setEditingUser(null)
    setForm({ name: '', email: '', role: 'peminjam', password: '' })
    setModalOpen(true)
  }

  const openEditModal = user => {
    setEditingUser(user)
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: ''
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingUser(null)
    setForm({ name: '', email: '', role: 'peminjam', password: '' })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id_user}`, form)
        showToast(`User "${form.name}" berhasil diperbarui`, 'success')
      } else {
        await api.post('/users', form)
        showToast(`User "${form.name}" berhasil ditambahkan`, 'success')
      }
      closeModal()
      fetchUsers()
    } catch (error) {
      showToast(
        error.response?.data?.message || 'Gagal menyimpan data user',
        'error'
      )
    }
  }

  const toggleStatus = async user => {
    const action = user.status === 1 ? 'menonaktifkan' : 'mengaktifkan'
    if (!confirm(`Apakah Anda yakin ingin ${action} user ${user.name}?`)) return
    try {
      await api.put(`/users/${user.id_user}/status`, {
        status: user.status === 1 ? 0 : 1
      })
      showToast(`User "${user.name}" berhasil di${action}`, 'success')
      fetchUsers()
    } catch {
      showToast('Gagal mengubah status user', 'error')
    }
  }

  const resetPassword = async (id, name) => {
    if (!confirm(`Reset password untuk user "${name}" ke default (123456)?`))
      return
    try {
      await api.put(`/users/${id}/reset-password`)
      showToast(`Password user "${name}" berhasil direset ke 123456`, 'success')
    } catch {
      showToast('Gagal mereset password', 'error')
    }
  }

  const deleteUser = async (id, name) => {
    if (
      !confirm(
        `Hapus permanen user "${name}"? Tindakan ini tidak bisa dibatalkan.`
      )
    )
      return
    try {
      await api.delete(`/users/${id}`)
      showToast(`User "${name}" berhasil dihapus`, 'success')
      fetchUsers()
    } catch (error) {
      showToast(
        error.response?.data?.message || 'Gagal menghapus user',
        'error'
      )
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

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes modalBackdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .modal-animate { animation: modalFadeIn 0.2s ease-out; }
        .backdrop-animate { animation: modalBackdropFade 0.15s ease-out; }
        .dropdown-animate { animation: dropdownFadeIn 0.15s ease-out; }
      `}</style>

      {/* Page Header */}
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-semibold tracking-tight text-gray-900'>
            Kelola Pengguna
          </h1>
          <p className='mt-0.5 text-sm text-gray-400'>
            Tambah, edit, atau kelola akun pengguna sistem
          </p>
        </div>
        <button
          onClick={openAddModal}
          className='flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-all duration-200 shadow-sm'
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
          Tambah User
        </button>
      </div>

      {/* Stats Summary */}
      <div className='mb-5 grid grid-cols-3 gap-3'>
        <div className='rounded-xl border border-gray-100 bg-white p-3 shadow-sm'>
          <p className='text-[11px] font-medium text-gray-400 uppercase tracking-wider'>
            Total User
          </p>
          <p className='text-xl font-bold text-gray-900 mt-1'>{users.length}</p>
        </div>
        <div className='rounded-xl border border-gray-100 bg-white p-3 shadow-sm'>
          <p className='text-[11px] font-medium text-gray-400 uppercase tracking-wider'>
            Aktif
          </p>
          <p className='text-xl font-bold text-green-600 mt-1'>
            {users.filter(u => u.status === 1 && u.role !== 'admin').length}
          </p>
        </div>
        <div className='rounded-xl border border-gray-100 bg-white p-3 shadow-sm'>
          <p className='text-[11px] font-medium text-gray-400 uppercase tracking-wider'>
            Nonaktif
          </p>
          <p className='text-xl font-bold text-red-500 mt-1'>
            {users.filter(u => u.status === 0 && u.role !== 'admin').length}
          </p>
        </div>
      </div>

      {/* User Table */}
      <div className='rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-gray-100 bg-gray-50/50'>
                <th className='px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400'>
                  Pengguna
                </th>
                <th className='px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400'>
                  Role
                </th>
                <th className='px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400'>
                  Status
                </th>
                <th className='px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400'>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className='border-b border-gray-50'>
                    <td className='px-5 py-3'>
                      <div className='flex items-center gap-2'>
                        <div className='h-8 w-8 rounded-full bg-gray-100 animate-pulse' />
                        <div className='space-y-1'>
                          <div className='h-3 w-24 bg-gray-100 rounded animate-pulse' />
                          <div className='h-2 w-32 bg-gray-50 rounded animate-pulse' />
                        </div>
                      </div>
                    </td>
                    <td className='px-5 py-3'>
                      <div className='h-5 w-14 bg-gray-100 rounded animate-pulse' />
                    </td>
                    <td className='px-5 py-3'>
                      <div className='h-5 w-16 bg-gray-100 rounded animate-pulse' />
                    </td>
                    <td className='px-5 py-3'>
                      <div className='h-5 w-8 bg-gray-100 rounded animate-pulse ml-auto' />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan='4' className='px-5 py-12 text-center'>
                    <div className='flex flex-col items-center gap-2'>
                      <svg
                        width='40'
                        height='40'
                        fill='none'
                        stroke='#d1d5db'
                        strokeWidth='1'
                        viewBox='0 0 24 24'
                      >
                        <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
                        <circle cx='9' cy='7' r='4' />
                        <path d='M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' />
                      </svg>
                      <p className='text-sm text-gray-400'>
                        Belum ada data pengguna
                      </p>
                      <button
                        onClick={openAddModal}
                        className='text-sm text-gray-500 hover:text-gray-700'
                      >
                        Tambah user pertama
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                users
                  .filter(u => u.role !== 'admin')
                  .map(user => (
                    <tr
                      key={user.id_user}
                      className='border-b border-gray-50 hover:bg-gray-50/50 transition-colors'
                    >
                      <td className='px-5 py-3'>
                        <div className='flex items-center gap-3'>
                          <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-xs font-semibold text-gray-600'>
                            {initials(user.name)}
                          </div>
                          <div>
                            <p className='font-medium text-gray-900'>
                              {user.name}
                            </p>
                            <p className='text-xs text-gray-400'>
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className='px-5 py-3'>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                            user.role === 'petugas'
                              ? 'bg-purple-50 text-purple-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {user.role === 'petugas' ? (
                            <svg
                              width='10'
                              height='10'
                              fill='none'
                              stroke='currentColor'
                              strokeWidth='2'
                              viewBox='0 0 24 24'
                            >
                              <path d='M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm10-10V7a4 4 0 0 0-8 0v4' />
                            </svg>
                          ) : (
                            <svg
                              width='10'
                              height='10'
                              fill='none'
                              stroke='currentColor'
                              strokeWidth='2'
                              viewBox='0 0 24 24'
                            >
                              <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
                              <circle cx='12' cy='7' r='4' />
                            </svg>
                          )}
                          {user.role}
                        </span>
                      </td>
                      <td className='px-5 py-3'>
                        {user.status === 1 ? (
                          <span className='inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-600'>
                            <span className='h-1.5 w-1.5 rounded-full bg-green-500' />{' '}
                            Aktif
                          </span>
                        ) : (
                          <span className='inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-500'>
                            <span className='h-1.5 w-1.5 rounded-full bg-red-400' />{' '}
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className='px-5 py-3 text-right'>
                        {/* Dropdown tiga titik */}
                        <ActionDropdown
                          user={user}
                          onEdit={openEditModal}
                          onToggleStatus={toggleStatus}
                          onResetPassword={resetPassword}
                          onDelete={deleteUser}
                        />
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Popup */}
      {modalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-animate'>
          <div className='absolute inset-0 bg-black/40' onClick={closeModal} />
          <div className='relative w-full max-w-md rounded-2xl bg-white shadow-xl modal-animate'>
            <div className='flex items-center justify-between border-b border-gray-100 px-5 py-4'>
              <div>
                <h2 className='text-base font-semibold text-gray-900'>
                  {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                </h2>
                <p className='text-xs text-gray-400 mt-0.5'>
                  {editingUser
                    ? 'Ubah informasi pengguna'
                    : 'Isi data pengguna baru'}
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

            <form onSubmit={handleSubmit}>
              <div className='p-5 space-y-4'>
                <div>
                  <label className='mb-1 block text-xs font-medium text-gray-600'>
                    Nama Lengkap
                  </label>
                  <input
                    required
                    type='text'
                    className={inputCls}
                    placeholder='Masukkan nama lengkap'
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className='mb-1 block text-xs font-medium text-gray-600'>
                    Email
                  </label>
                  <input
                    required
                    type='email'
                    className={inputCls}
                    placeholder='email@contoh.com'
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className='mb-1 block text-xs font-medium text-gray-600'>
                    Role
                  </label>
                  <select
                    className={inputCls}
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                  >
                    <option value='peminjam'>Peminjam</option>
                    <option value='petugas'>Petugas</option>
                  </select>
                </div>
                {!editingUser && (
                  <div>
                    <label className='mb-1 block text-xs font-medium text-gray-600'>
                      Password
                    </label>
                    <input
                      type='password'
                      className={inputCls}
                      placeholder='Kosongkan untuk default (123456)'
                      value={form.password}
                      onChange={e =>
                        setForm({ ...form, password: e.target.value })
                      }
                    />
                    <p className='mt-1 text-[10px] text-gray-400'>
                      Default password: 123456
                    </p>
                  </div>
                )}
              </div>

              <div className='flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4'>
                <button
                  type='button'
                  onClick={closeModal}
                  className='rounded-lg border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors'
                >
                  Batal
                </button>
                <button
                  type='submit'
                  className='rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors shadow-sm'
                >
                  {editingUser ? 'Simpan Perubahan' : 'Tambah User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
