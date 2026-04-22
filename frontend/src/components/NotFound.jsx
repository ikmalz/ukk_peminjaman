import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NotFound() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const getDashboardLink = () => {
    if (!user) return '/login'
    switch (user.role) {
      case 'admin': return '/admin'
      case 'petugas': return '/petugas'
      case 'peminjam': return '/peminjam'
      default: return '/login'
    }
  }

  const getRoleText = () => {
    if (!user) return 'Login'
    switch (user.role) {
      case 'admin': return 'Dashboard Admin'
      case 'petugas': return 'Dashboard Petugas'
      case 'peminjam': return 'Dashboard Peminjam'
      default: return 'Login'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(5deg); }
          75% { transform: rotate(-5deg); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>

      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8 animate-float">
          <div className="relative inline-block">
            <div className="text-8xl font-bold text-gray-200">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2 animate-fadeInUp">
          Halaman Tidak Ditemukan
        </h1>
        
        <p className="text-gray-500 mb-6 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>

        <div className="mb-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            Error 404 - Page Not Found
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Kembali
          </button>
          
          <Link
            to={getDashboardLink()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            {getRoleText()}
          </Link>
        </div>

        {/* Help Text */}
        <p className="mt-6 text-xs text-gray-400 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          Jika Anda merasa ini adalah kesalahan, silakan hubungi administrator.
        </p>
      </div>
    </div>
  )
}