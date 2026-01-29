import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    await login(email, password);

    const user = JSON.parse(localStorage.getItem("user"));

    if (user.role === "admin") navigate("/admin");
    else if (user.role === "petugas") navigate("/petugas");
    else navigate("/peminjam");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={submit} className="bg-white w-80 p-6 rounded-xl shadow">
        <h1 className="text-xl font-bold mb-4 text-center">Login</h1>

        {error && (
          <div className="mb-3 p-2 text-sm bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <input
          className="w-full border p-2 rounded mb-3"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full border p-2 rounded mb-4"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Masuk..." : "Login"}
        </button>
      </form>
    </div>
  );
}
