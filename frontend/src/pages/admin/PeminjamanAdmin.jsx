import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

export default function PeminjamanAdmin() {
  const [peminjaman, setPeminjaman] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); 
  const { user } = useAuth();

  const fetchPeminjaman = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/peminjaman/admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPeminjaman(res.data.data || res.data);
    } catch (err) {
      setError('Gagal memuat data peminjaman');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeminjaman();
  }, []);

  const updateTanggal = async (id_peminjaman, tgl_pinjam, tgl_rencana_kembali) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/peminjaman/${id_peminjaman}/tanggal`, {
        tgl_pinjam,
        tgl_rencana_kembali
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Tanggal berhasil diubah');
      setEditing(null);
      fetchPeminjaman();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah tanggal');
    }
  };

  if (loading) return <div className="p-8 text-center">Memuat data...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Daftar Semua Peminjaman (Admin)</h1>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left">Peminjam</th>
              <th className="px-6 py-4 text-left">Alat</th>
              <th className="px-6 py-4 text-left">Tgl Pinjam</th>
              <th className="px-6 py-4 text-left">Rencana Kembali</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {peminjaman.map(p => (
              <tr key={p.id_peminjaman} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{p.peminjam}</td>
                <td className="px-6 py-4">{p.alat}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {format(new Date(p.tgl_pinjam), 'dd MMM yyyy HH:mm')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {format(new Date(p.tgl_rencana_kembali), 'dd MMM yyyy')}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    p.status === 'disetujui' ? 'bg-green-100 text-green-700' :
                    p.status === 'menunggu' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => setEditing(p)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Ubah Tanggal
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Edit Tanggal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">Ubah Tanggal Peminjaman</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tanggal Pinjam</label>
                <input
                  type="datetime-local"
                  defaultValue={editing.tgl_pinjam.slice(0, 16)}
                  onChange={e => setEditing({...editing, tgl_pinjam: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rencana Kembali</label>
                <input
                  type="date"
                  defaultValue={editing.tgl_rencana_kembali.slice(0, 10)}
                  onChange={e => setEditing({...editing, tgl_rencana_kembali: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-2.5 border rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={() => updateTanggal(editing.id_peminjaman, editing.tgl_pinjam, editing.tgl_rencana_kembali)}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}