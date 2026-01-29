import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function DashboardAdmin() {
  const [stats, setStats] = useState({
    users: 0,
    alat: 0,
    kategori: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const [users, alat, kategori] = await Promise.all([
        api.get("/users"),
        api.get("/alat"),
        api.get("/kategori"),
      ]);

      setStats({
        users: users.data.data.length,
        alat: alat.data.data.length,
        kategori: kategori.data.data.length,
      });
    };

    fetchData();
  }, []);

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Dashboard Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Total User" value={stats.users} />
        <Card title="Total Alat" value={stats.alat} />
        <Card title="Kategori" value={stats.kategori} />
      </div>
    </>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-3xl font-bold">{value}</h2>
    </div>
  );
}
