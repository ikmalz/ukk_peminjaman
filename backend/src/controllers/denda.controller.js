const db = require("../config/db");

exports.getAllDenda = async (req, res) => {
  const result = await db.query(`
    SELECT d.*, u.name AS peminjam
    FROM denda d
    JOIN pengembalian pg ON d.id_pengembalian = pg.id_pengembalian
    JOIN peminjaman p ON pg.id_peminjaman = p.id_peminjaman
    JOIN users u ON p.id_user = u.id_user
    ORDER BY d.id_denda DESC
  `);

  res.json(result.rows);
};

exports.getByPengembalian = async (req, res) => {
  const { id } = req.params;

  const result = await db.query(
    "SELECT * FROM denda WHERE id_pengembalian = $1",
    [id]
  );

  res.json(result.rows[0] || null);
};

exports.bayarDenda = async (req, res) => {
  const { id } = req.params;

  await db.query(
    "UPDATE denda SET status_bayar = 'lunas' WHERE id_denda = $1",
    [id]
  );

  res.json({ message: "Denda berhasil dibayar" });
};
