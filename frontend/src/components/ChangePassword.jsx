import { useState } from "react";
import api from "../lib/api";

export default function ChangePassword() {
  const [oldPassword, setOld] = useState("");
  const [newPassword, setNew] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    await api.put("/users/change-password", {
      oldPassword,
      newPassword,
    });
    alert("Password berhasil diubah, silakan login ulang");
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <form onSubmit={submit} className="max-w-sm mx-auto mt-20 space-y-3">
      <h1 className="text-xl font-bold">Ganti Password</h1>
      <input type="password" placeholder="Password Lama" onChange={e=>setOld(e.target.value)} />
      <input type="password" placeholder="Password Baru" onChange={e=>setNew(e.target.value)} />
      <button className="bg-blue-600 text-white p-2 rounded">
        Simpan
      </button>
    </form>
  );
}
