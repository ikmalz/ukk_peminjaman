import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

export default function PengembalianAdmin() {
  const [pengembalian, setPengembalian] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); 
  const { user } = useAuth();

  const fetchPengembalian = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/pengembalian/admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPengembalian(res.data.data || res.data);
    } catch (err) {
      setError('Gagal memuat data pengembalian');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPengembalian();
  }, []);

  const updateTanggalKembali = async (id_pengembalian, tgl_kembali) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/pengembalian/${id_pengembalian}/tanggal`, {
        tgl_kembali
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Tanggal pengembalian berhasil diubah');
      setEditing(null);
      fetchPengembalian();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah tanggal');
    }
  };

  if (loading) return <div className="p-8 text-center">Memuat data pengembalian...</div>;
  if (error) return <div className="p-8 text-red-500 text-center">{error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Daftar Semua Pengembalian (Admin)</h1>
        <p className="text-gray-500 mt-1">Kelola tanggal pengembalian alat</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left">Peminjam</th>
                <th className="px-6 py-4 text-left">Alat</th>
                <th className="px-6 py-4 text-left">Tanggal Dikembalikan</th>
                <th className="px-6 py-4 text-left">Kondisi Laporan</th>
                <th className="px-6 py-4 text-left">Status Verifikasi</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pengembalian.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    Belum ada data pengembalian
                  </td>
                </tr>
              ) : (
                pengembalian.map(pg => (
                  <tr key={pg.id_pengembalian} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{pg.peminjam}</td>
                    <td className="px-6 py-4">{pg.alat}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(new Date(pg.tgl_kembali), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 capitalize text-sm">
                      {pg.kondisi_laporan}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        pg.status_verifikasi === 'selesai' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {pg.status_verifikasi}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setEditing(pg)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Ubah Tanggal
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">Ubah Tanggal Pengembalian</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Tanggal Dikembalikan
              </label>
              <input
                type="date"
                defaultValue={editing.tgl_kembali ? editing.tgl_kembali.slice(0, 10) : ''}
                onChange={(e) => setEditing({ ...editing, tgl_kembali: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditing(null)}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium"
              >
                Batal
              </button>
              <button
                onClick={() => updateTanggalKembali(editing.id_pengembalian, editing.tgl_kembali)}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
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