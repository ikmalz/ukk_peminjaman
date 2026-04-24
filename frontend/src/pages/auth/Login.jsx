import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

function Field ({ label, children }) {
  return (
    <div className='flex flex-col gap-1.5'>
      <label className='text-[11px] font-semibold uppercase tracking-wider text-gray-400'>
        {label}
      </label>
      {children}
    </div>
  )
}

function RegisterForm ({ onBack }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      return setError('Konfirmasi password tidak cocok')
    }

    if (form.password.length < 6) {
      return setError('Password minimal 6 karakter')
    }

    setLoading(true)
    try {
      await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mendaftar, coba lagi')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className='text-center space-y-4'>
        <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 border-2 border-green-100'>
          <svg
            width='28'
            height='28'
            fill='none'
            stroke='#16a34a'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <polyline points='20 6 9 17 4 12' />
          </svg>
        </div>
        <div>
          <h3 className='text-base font-bold text-gray-900'>
            Pendaftaran Terkirim!
          </h3>
          <p className='mt-1.5 text-sm text-gray-500 leading-relaxed'>
            Akun Anda sedang menunggu aktivasi oleh admin. Anda akan dapat login
            setelah akun disetujui.
          </p>
        </div>
        <button
          onClick={onBack}
          className='w-full rounded-lg bg-[#0f1e40] py-2.5 text-sm font-semibold text-white hover:bg-[#1a3060] transition'
        >
          Kembali ke Login
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <button
        onClick={onBack}
        className='mb-5 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition'
      >
        <svg
          width='14'
          height='14'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          viewBox='0 0 24 24'
        >
          <line x1='19' y1='12' x2='5' y2='12' />
          <polyline points='12 19 5 12 12 5' />
        </svg>
        Kembali ke Login
      </button>

      <div className='mb-6'>
        <h1 className='text-[22px] font-bold tracking-tight text-gray-900'>
          Daftar Akun
        </h1>
        <p className='mt-1 text-sm text-gray-400'>
          Isi data diri kamu untuk mendaftar sebagai peminjam
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>
        {error && (
          <div className='flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs text-red-600'>
            <svg
              width='13'
              height='13'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <circle cx='12' cy='12' r='10' />
              <line x1='12' y1='8' x2='12' y2='12' />
              <line x1='12' y1='16' x2='12.01' y2='16' />
            </svg>
            {error}
          </div>
        )}

        <Field label='Nama Lengkap'>
          <input
            type='text'
            required
            placeholder='Masukkan nama lengkap'
            className={inputCls}
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
        </Field>

        <Field label='Email'>
          <input
            type='email'
            required
            placeholder='contoh@email.com'
            className={inputCls}
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </Field>

        <Field label='Password'>
          <div className='relative'>
            <input
              type={showPw ? 'text' : 'password'}
              required
              placeholder='Min. 6 karakter'
              className={inputCls + ' pr-10'}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
            <button
              type='button'
              tabIndex={-1}
              onClick={() => setShowPw(v => !v)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition'
            >
              {showPw ? (
                <svg
                  width='15'
                  height='15'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  viewBox='0 0 24 24'
                >
                  <path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94' />
                  <path d='M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19' />
                  <line x1='1' y1='1' x2='23' y2='23' />
                </svg>
              ) : (
                <svg
                  width='15'
                  height='15'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  viewBox='0 0 24 24'
                >
                  <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
                  <circle cx='12' cy='12' r='3' />
                </svg>
              )}
            </button>
          </div>
        </Field>

        <Field label='Konfirmasi Password'>
          <input
            type='password'
            required
            placeholder='Ulangi password'
            className={inputCls}
            value={form.confirmPassword}
            onChange={e =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
          />
        </Field>

        {/* Info badge */}
        <div className='flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3.5 py-2.5'>
          <svg
            width='13'
            height='13'
            fill='none'
            stroke='#3b82f6'
            strokeWidth='2'
            viewBox='0 0 24 24'
            className='mt-0.5 shrink-0'
          >
            <circle cx='12' cy='12' r='10' />
            <line x1='12' y1='16' x2='12' y2='12' />
            <line x1='12' y1='8' x2='12.01' y2='8' />
          </svg>
          <p className='text-[11px] text-blue-600 leading-relaxed'>
            Akun akan diaktivasi oleh admin sebelum dapat digunakan untuk login.
          </p>
        </div>

        <button
          type='submit'
          disabled={loading}
          className='mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0f1e40] py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a3060] disabled:cursor-not-allowed disabled:opacity-50'
        >
          {loading && (
            <svg
              className='h-4 w-4 animate-spin'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              />
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8v8z'
              />
            </svg>
          )}
          {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
        </button>
      </form>
    </div>
  )
}

export default function Login () {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [showRegister, setShowRegister] = useState(false)

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
      setError(err.response?.data?.message || 'Terjadi kesalahan koneksi')
    }
  }

  return (
    <div className='flex min-h-screen'>
      <div className='hidden md:flex md:w-1/2 flex-col justify-between bg-[#0f1e40] px-12 py-10 relative overflow-hidden'>
        <div
          className='absolute inset-0 opacity-[0.04]'
          style={{
            backgroundImage:
              'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }}
        />
        <div className='absolute -top-32 -right-32 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl' />

        {/* Logo */}
        <div className='relative flex items-center gap-2.5 z-10'>
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 border border-white/10'>
            <svg
              width='16'
              height='16'
              fill='none'
              stroke='rgba(255,255,255,.8)'
              strokeWidth='2'
              strokeLinecap='round'
              viewBox='0 0 24 24'
            >
              <path d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' />
            </svg>
          </div>
          <div>
            <p className='text-[13px] font-bold text-white tracking-tight'>
              SiPinjam
            </p>
            <p className='text-[11px] text-white/30'>Sistem Peminjaman Alat</p>
          </div>
        </div>

        {/* Center text */}
        <div className='relative z-10 space-y-4'>
          <h2 className='text-2xl font-bold text-white leading-snug tracking-tight'>
            Platform peminjaman
            <br />
            <span className='text-white/30'>yang efisien & modern</span>
          </h2>
          <p className='text-[13px] text-white/35 leading-relaxed max-w-xs'>
            Digunakan oleh admin, petugas, dan peminjam dalam satu sistem
            terintegrasi.
          </p>
        </div>

        <p className='relative z-10 text-[11px] text-white/20'>
          © {new Date().getFullYear()} SiPinjam · UKK 2025/2026
        </p>
      </div>

      <div className='flex w-full md:w-1/2 items-center justify-center bg-gray-50 px-6 py-12'>
        <div className='w-full max-w-sm'>
          {/* Mobile logo */}
          <div className='mb-8 flex items-center gap-2.5 md:hidden'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f1e40]'>
              <svg
                width='14'
                height='14'
                fill='none'
                stroke='white'
                strokeWidth='2'
                strokeLinecap='round'
                viewBox='0 0 24 24'
              >
                <path d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' />
              </svg>
            </div>
            <p className='text-[13px] font-bold text-gray-900'>SiPinjam</p>
          </div>

          {showRegister ? (
            <RegisterForm onBack={() => setShowRegister(false)} />
          ) : (
            <>
              <div className='mb-7'>
                <h1 className='text-[22px] font-bold tracking-tight text-gray-900'>
                  Selamat datang
                </h1>
                <p className='mt-1 text-sm text-gray-400'>
                  Masuk ke akun kamu untuk melanjutkan
                </p>
              </div>

              <form onSubmit={submit} className='space-y-4'>
                {error && (
                  <div className='flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-xs text-red-600'>
                    <svg
                      width='13'
                      height='13'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                    >
                      <circle cx='12' cy='12' r='10' />
                      <line x1='12' y1='8' x2='12' y2='12' />
                      <line x1='12' y1='16' x2='12.01' y2='16' />
                    </svg>
                    {error}
                  </div>
                )}

                <Field label='Email'>
                  <input
                    type='email'
                    required
                    autoComplete='email'
                    placeholder='contoh@email.com'
                    className={inputCls}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </Field>

                <Field label='Password'>
                  <div className='relative'>
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      autoComplete='current-password'
                      placeholder='••••••••'
                      className={inputCls + ' pr-10'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button
                      type='button'
                      tabIndex={-1}
                      onClick={() => setShowPw(v => !v)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition'
                    >
                      {showPw ? (
                        <svg
                          width='15'
                          height='15'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          viewBox='0 0 24 24'
                        >
                          <path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94' />
                          <path d='M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19' />
                          <line x1='1' y1='1' x2='23' y2='23' />
                        </svg>
                      ) : (
                        <svg
                          width='15'
                          height='15'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          viewBox='0 0 24 24'
                        >
                          <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
                          <circle cx='12' cy='12' r='3' />
                        </svg>
                      )}
                    </button>
                  </div>
                </Field>

                <button
                  type='submit'
                  disabled={loading}
                  className='mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0f1e40] py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a3060] disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {loading && (
                    <svg
                      className='h-4 w-4 animate-spin'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      />
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8v8z'
                      />
                    </svg>
                  )}
                  {loading ? 'Memproses...' : 'Masuk'}
                </button>
              </form>

              {/* ── Link Daftar Akun ── */}
              <div className='mt-6 text-center'>
                <p className='text-xs text-gray-400'>
                  Belum punya akun?{' '}
                  <button
                    onClick={() => {
                      setShowRegister(true)
                      setError('')
                    }}
                    className='font-semibold text-[#0f1e40] hover:underline transition'
                  >
                    Daftar di sini
                  </button>
                </p>
              </div>
            </>
          )}

          <p className='mt-8 text-center text-[11px] text-gray-300'>
            © {new Date().getFullYear()} Aplikasi Peminjaman Alat · UKK
            2025/2026
          </p>
        </div>
      </div>
    </div>
  )
}
