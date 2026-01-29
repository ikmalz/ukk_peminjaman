import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function DashboardPeminjam() {
  const { user } = useAuth();
  const [data, setData] = useState({
    alat: 0,
    pinjam: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const alat = await api.get("/alat");
      const pinjam = await api.get(`/peminjaman?user=${user.id_user}`);

      setData({
        alat: alat.data.data.length,
        pinjam: pinjam.data.data.length,
      });
    };

    fetchData();
  }, []);

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">
        Dashboard Peminjam
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Alat Tersedia" value={data.alat} />
        <Card title="Peminjaman Saya" value={data.pinjam} />
      </div>
    </>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <p className="text-gray-500">{title}</p>
      <h2 className="text-2xl font-bold">{value}</h2>
    </div>
  );
}
