import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../lib/api";

export default function DetailAlat() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [alat, setAlat] = useState(null);
  const IMAGE_URL = api.defaults.baseURL.replace("/api", "");

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/alat/${id}`);
        setAlat(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchDetail();
  }, [id]);

  if (!alat) {
    return <p className="text-sm text-slate-500">Memuat detail alat...</p>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">
          Detail Alat
        </h1>

        <button
          onClick={() => navigate(-1)}
          className="text-sm bg-slate-200 px-4 py-2 rounded-lg hover:bg-slate-300"
        >
          Kembali
        </button>
      </div>

      {/* CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm grid md:grid-cols-2">

        {/* IMAGE */}
        <div className="bg-slate-100 flex items-center justify-center p-6">
          {alat.image ? (
            <img
              src={`${IMAGE_URL}${alat.image}`}
              alt={alat.name}
              className="max-h-80 object-contain"
            />
          ) : (
            <span className="text-slate-400">Tidak ada gambar</span>
          )}
        </div>

        {/* DETAIL */}
        <div className="p-6 space-y-4">

          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              {alat.name}
            </h2>
            <p className="text-sm text-slate-500">
              {alat.kode_alat}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">

            <div>
              <p className="text-slate-500">Merk</p>
              <p className="font-medium">{alat.merk || "-"}</p>
            </div>

            <div>
              <p className="text-slate-500">Model</p>
              <p className="font-medium">{alat.tipe_model || "-"}</p>
            </div>

            <div>
              <p className="text-slate-500">Stok</p>
              <p className="font-medium">{alat.stok}</p>
            </div>

            <div>
              <p className="text-slate-500">Stok Minimum</p>
              <p className="font-medium">{alat.stok_minimum}</p>
            </div>

            <div>
              <p className="text-slate-500">Kondisi</p>
              <p
                className={`font-medium ${
                  alat.kondisi === "rusak"
                    ? "text-red-500"
                    : "text-emerald-500"
                }`}
              >
                {alat.kondisi}
              </p>
            </div>

            <div>
              <p className="text-slate-500">Status</p>
              <p className="font-medium">
                {alat.status_aktif ? "Aktif" : "Nonaktif"}
              </p>
            </div>

          </div>

          {/* SPESIFIKASI */}
          <div>
            <p className="text-sm text-slate-500 mb-1">
              Spesifikasi
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {alat.spesifikasi || "Tidak ada spesifikasi"}
            </p>
          </div>

          {/* BUTTON */}
          <div className="pt-4">
            <button
              onClick={() =>
                navigate("/peminjam/pinjam", {
                  state: {
                    id_alat: alat.id_alat,
                    name: alat.name
                  }
                })
              }
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              Ajukan Peminjaman
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}