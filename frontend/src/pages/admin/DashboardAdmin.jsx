import { useEffect, useState } from 'react'
import api from '../../lib/api'

export default function DashboardAdmin () {
  const [stats, setStats] = useState({
    users: null,
    alat: null,
    kategori: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/users'), api.get('/alat'), api.get('/kategori')])
      .then(([u, a, k]) =>
        setStats({
          users: u.data.data.length,
          alat: a.data.data.length,
          kategori: k.data.data.length
        })
      )
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .dash-root {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          color: #111;
        }

        /* header */
        .dash-header { margin-bottom: 28px; }
        .dash-header h1 {
          font-size: 22px; font-weight: 700; color: #111;
          letter-spacing: -0.03em; margin: 0 0 4px;
        }
        .dash-header p { font-size: 13px; color: #999; margin: 0; }

        /* stat grid */
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: #fff;
          border: 1px solid #e8e8e8;
          border-radius: 10px;
          padding: 20px;
          position: relative;
          transition: box-shadow .15s;
        }
        .stat-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,.06); }

        .stat-label {
          font-size: 12px; font-weight: 500; color: #999;
          text-transform: uppercase; letter-spacing: 0.04em;
          margin: 0 0 10px;
        }
        .stat-value {
          font-size: 34px; font-weight: 700; color: #111;
          letter-spacing: -0.04em; line-height: 1;
          margin: 0 0 6px;
        }
        .stat-value.loading {
          width: 48px; height: 34px; background: #f0f0f0;
          border-radius: 6px; animation: shimmer 1.2s infinite;
        }
        .stat-sub { font-size: 12px; color: #bbb; margin: 0; }

        .stat-icon {
          position: absolute; top: 18px; right: 18px;
          width: 32px; height: 32px; border-radius: 8px;
          background: #f5f5f5;
          display: flex; align-items: center; justify-content: center;
          color: #bbb;
        }
        /* blue accent only on first card icon */
        .stat-card:first-child .stat-icon { background: #eff2ff; color: #3451b2; }

        /* info row */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 12px;
        }
        .info-card {
          background: #fff;
          border: 1px solid #e8e8e8;
          border-radius: 10px;
          padding: 20px;
        }
        .info-card h2 {
          font-size: 13px; font-weight: 600; color: #111;
          margin: 0 0 14px; letter-spacing: -0.01em;
        }
        .info-item {
          display: flex; gap: 10px; align-items: baseline;
          padding: 8px 0;
          border-top: 1px solid #f5f5f5;
          font-size: 13px; color: #555; line-height: 1.5;
        }
        .info-item:first-of-type { border-top: none; padding-top: 0; }
        .info-dot { width: 5px; height: 5px; border-radius: 50%; background: #ddd; flex-shrink: 0; margin-top: 7px; }

        @keyframes shimmer {
          0%,100% { opacity: 1; } 50% { opacity: .4; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fu { animation: fadeUp .35s ease both; }
        .fu1 { animation-delay: .05s; }
        .fu2 { animation-delay: .10s; }
        .fu3 { animation-delay: .15s; }
        .fu4 { animation-delay: .20s; }
        .fu5 { animation-delay: .25s; }
      `}</style>

      <div className='dash-root'>
        {/* Header */}
        <div className='dash-header fu fu1'>
          <h1>Dashboard</h1>
          <p>Ringkasan kondisi sistem peminjaman alat</p>
        </div>

        {/* Stats */}
        <div className='stat-grid'>
          <StatCard
            className='fu fu2'
            label='Pengguna'
            value={stats.users}
            sub='akun terdaftar'
            loading={loading}
            icon={
              <svg
                width='15'
                height='15'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                viewBox='0 0 24 24'
              >
                <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
                <circle cx='9' cy='7' r='4' />
                <path d='M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' />
              </svg>
            }
          />
          <StatCard
            className='fu fu3'
            label='Alat'
            value={stats.alat}
            sub='unit inventaris'
            loading={loading}
            icon={
              <svg
                width='15'
                height='15'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                viewBox='0 0 24 24'
              >
                <path d='M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' />
              </svg>
            }
          />
          <StatCard
            className='fu fu4'
            label='Kategori'
            value={stats.kategori}
            sub='jenis alat'
            loading={loading}
            icon={
              <svg
                width='15'
                height='15'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                viewBox='0 0 24 24'
              >
                <path d='M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z' />
                <circle cx='7' cy='7' r='1.5' />
              </svg>
            }
          />
        </div>

        {/* Info cards */}
        <div className='info-grid'>
          <div className='info-card fu fu4'>
            <h2>Status Sistem</h2>
            {[
              <>
                Terdapat <b>{loading ? '…' : stats.users}</b> akun pengguna
                aktif terdaftar
              </>,
              <>
                Total <b>{loading ? '…' : stats.alat}</b> alat tersedia di
                inventaris sistem
              </>,
              <>
                Alat dikelompokkan ke dalam{' '}
                <b>{loading ? '…' : stats.kategori}</b> kategori
              </>,
              <>Admin dapat kelola user, alat, dan kategori secara terpusat</>
            ].map((t, i) => (
              <div className='info-item' key={i}>
                <span className='info-dot' />
                <span>{t}</span>
              </div>
            ))}
          </div>

          <div className='info-card fu fu5'>
            <h2>Catatan Operasional</h2>
            {[
              'Perbarui data alat sebelum membuka proses peminjaman',
              'Periksa status akun pengguna secara berkala',
              'Gunakan fitur kategori untuk kelompokkan alat serupa',
              'Pastikan query database berjalan efisien pada tabel besar'
            ].map((t, i) => (
              <div className='info-item' key={i}>
                <span className='info-dot' />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function StatCard ({ label, value, sub, loading, icon, className }) {
  return (
    <div className={`stat-card ${className ?? ''}`}>
      <div className='stat-icon'>{icon}</div>
      <p className='stat-label'>{label}</p>
      {loading ? (
        <div className='stat-value loading' />
      ) : (
        <p className='stat-value'>{value}</p>
      )}
      <p className='stat-sub'>{sub}</p>
    </div>
  )
}
