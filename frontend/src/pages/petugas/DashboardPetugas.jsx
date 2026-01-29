import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function DashboardPetugas() {
  const [summary, setSummary] = useState({
    peminjaman: 0,
    pengembalian: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const peminjaman = await api.get("/peminjaman");
      const pengembalian = await api.get("/pengembalian");

      setSummary({
        peminjaman: peminjaman.data.data.length,
        pengembalian: pengembalian.data.data.length,
      });
    };

    fetchData();
  }, []);

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Dashboard Petugas</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Peminjaman Masuk" value={summary.peminjaman} />
        <Card title="Pengembalian Masuk" value={summary.pengembalian} />
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
