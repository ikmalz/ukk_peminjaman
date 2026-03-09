const db = require("../config/db");
const logAktivitas = require("../utils/logAktivitas");

// =====================
// GET ALL DENDA (PETUGAS)
// =====================
exports.getAllDenda = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        d.id_denda,
        d.total_denda,
        d.hari_terlambat,
        d.status_bayar,
        d.created_at,
        u.name AS peminjam,
        a.name AS alat
      FROM denda d
      JOIN pengembalian pg ON d.id_pengembalian = pg.id_pengembalian
      JOIN peminjaman p ON pg.id_peminjaman = p.id_peminjaman
      JOIN users u ON p.id_user = u.id_user
      JOIN alat a ON p.id_alat = a.id_alat
      ORDER BY d.id_denda DESC
    `);

    res.json({ data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data denda" });
  }
};

// =====================
// GET DENDA BY PENGEMBALIAN
// =====================
exports.getByPengembalian = async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    "SELECT * FROM denda WHERE id_pengembalian = $1",
    [id]
  );

  res.json(result.rows[0] || null);
};

// =====================
// BAYAR DENDA (PETUGAS)
// =====================
exports.bayarDenda = async (req, res) => {
  const { id } = req.params;
  const id_user = req.user.id_user;

  const cek = await db.query(
    "SELECT status_bayar FROM denda WHERE id_denda = $1",
    [id]
  );

  if (cek.rows.length === 0) {
    return res.status(404).json({ message: "Denda tidak ditemukan" });
  }

  if (cek.rows[0].status_bayar === "lunas") {
    return res.status(400).json({ message: "Denda sudah lunas" });
  }

  await db.query(
    "UPDATE denda SET status_bayar = 'lunas' WHERE id_denda = $1",
    [id]
  );

  await logAktivitas({
    id_user,
    aktivitas: "Melunasi denda peminjaman",
    id_denda: id,
  });

  res.json({ message: "Denda berhasil ditandai lunas" });
};
