import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Login () {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const user = JSON.parse(localStorage.getItem('user'))

  const submit = async e => {
    e.preventDefault()
    setError('')

    try {
      await login(email, password)

      const user = JSON.parse(localStorage.getItem('user'))

      if (user.role === 'admin') navigate('/admin')
      else if (user.role === 'petugas') navigate('/petugas')
      else navigate('/peminjam')
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message)
      } else {
        setError('Terjadi kesalahan koneksi')
      }
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4'>
      <div className='w-full max-w-md'>
        <form
          onSubmit={submit}
          className='bg-white rounded-2xl shadow-lg border border-slate-200 p-8'
        >
          {/* Header */}
          <div className='mb-6 text-center'>
            <h1 className='text-2xl font-semibold text-slate-800'>
              Sistem Peminjaman Alat
            </h1>
            <p className='text-sm text-slate-500 mt-1'>
              Silakan login untuk melanjutkan
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className='mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700'>
              {error}
            </div>
          )}

          {/* Email */}
          <div className='mb-4'>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              Email
            </label>
            <input
              type='email'
              placeholder='contoh@email.com'
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className='
              w-full rounded-lg border border-slate-300
              px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            '
            />
          </div>

          {/* Password */}
          <div className='mb-6'>
            <label className='block text-sm font-medium text-slate-700 mb-1'>
              Password
            </label>
            <input
              type='password'
              placeholder='••••••••'
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className='
              w-full rounded-lg border border-slate-300
              px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            '
            />
          </div>

          {/* Button */}
          <button
            disabled={loading}
            className='
            w-full rounded-lg bg-blue-600 px-4 py-2.5
            text-sm font-medium text-white
            hover:bg-blue-700
            transition disabled:opacity-60 disabled:cursor-not-allowed
          '
          >
            {loading ? 'Memproses...' : 'Login'}
          </button>
        </form>

        {/* Footer */}
        <p className='mt-6 text-center text-xs text-slate-500'>
          © {new Date().getFullYear()} Aplikasi Peminjaman Alat
        </p>
      </div>
    </div>
  )
}
