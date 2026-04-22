import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/auth/Login'
import MainLayout from './layouts/MainLayout'
import DashboardAdmin from './pages/admin/DashboardAdmin'
import Users from './pages/admin/Users'
import Alat from './pages/admin/Alat'
import Kategori from './pages/admin/Kategori'
import DashboardPetugas from './pages/petugas/DashboardPetugas'
import VerifikasiPeminjaman from './pages/petugas/VerifikasiPeminjaman'
import DashboardPeminjam from './pages/peminjam/DashboardPeminjam'
import DaftarAlat from './pages/peminjam/DaftarAlat'
import AjukanPeminjaman from './pages/peminjam/AjukanPeminjaman'
import PengembalianPeminjam from './pages/peminjam/PengembalianPeminjam'
import VerifikasiPengembalian from './pages/petugas/VerifikasiPengembalian'
import DendaPetugas from './pages/petugas/DendaPetugas'
import DetailAlat from './pages/peminjam/DetailAlat'
import AlatUnit from './pages/admin/AlatUnit'
import ScanQR from './pages/petugas/ScanQR'
import LogAktivitas from './pages/admin/LogAktivitas'
import PeminjamanAdmin from './pages/admin/PeminjamanAdmin'
import PengembalianAdmin from './pages/admin/PengembalianAdmin'
import StrukPeminjaman from './pages/peminjam/StrukPeminjaman'
import KonfigurasiDenda from './pages/petugas/KonfigurasiDenda'
import NotFound from './components/NotFound'
import HistoryPeminjam from './pages/peminjam/HistoryPeminjam'

export default function App () {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Navigate to='/login' />} />
          <Route path='/login' element={<Login />} />
          

          {/* ADMIN */}
          <Route
            path='/admin'
            element={
              <ProtectedRoute roles={['admin']}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardAdmin />} />
            <Route path='users' element={<Users />} />
            <Route path='alat' element={<Alat />} />
            <Route path='kategori' element={<Kategori />} />
            <Route path='log' element={<LogAktivitas />} />
            <Route path='alat/:id/unit' element={<AlatUnit />} />
            <Route path='konfigurasi-denda' element={<KonfigurasiDenda />} />
            <Route path='pengembalian' element={<VerifikasiPengembalian />} />
            <Route path='verifikasi' element={<VerifikasiPeminjaman />} />
            <Route path='denda' element={<DendaPetugas />} />
            <Route path='scan' element={<ScanQR />} />
          </Route>

          {/* PETUGAS */}
          <Route
            path='/petugas'
            element={
              <ProtectedRoute roles={['petugas', 'admin']}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPetugas />} />
            <Route path='verifikasi' element={<VerifikasiPeminjaman />} />
            <Route path='pengembalian' element={<VerifikasiPengembalian />} />
            <Route path='denda' element={<DendaPetugas />} />
            <Route path='konfigurasi-denda' element={<KonfigurasiDenda />} />
            <Route path='scan' element={<ScanQR />} />

            <Route path='kategori' element={<Kategori />} />
            <Route path='alat' element={<Alat />} />
            <Route path='alat/:id/unit' element={<AlatUnit />} />
          </Route>

          {/* PEMINJAM */}
          <Route
            path='/peminjam'
            element={
              <ProtectedRoute roles={['peminjam']}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPeminjam />} />
            <Route path='alat' element={<DaftarAlat />} />
            <Route
              path='/peminjam/pinjam/:id'
              element={<AjukanPeminjaman />}
            />{' '}
            <Route path='kembali' element={<PengembalianPeminjam />} />
            <Route path='detail/:id' element={<DetailAlat />} />
            <Route path='pinjam' element={<AjukanPeminjaman />} />
            <Route path='struk/:id' element={<StrukPeminjaman />} />
            <Route path='history' element={<HistoryPeminjam />} />
          </Route>
           <Route path='*' element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
