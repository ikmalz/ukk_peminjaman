const db = require("../config/db");
const logAktivitas = require("../utils/logAktivitas");

exports.createPeminjaman = async (req, res) => {
  const id_user = req.user.id_user;
  const { id_alat, tgl_pinjam, tgl_rencana_kembali } = req.body;

  try {
    const cek = await db.query(
      "SELECT stok, status_aktif FROM alat WHERE id_alat = $1",
      [id_alat],
    );

    if (cek.rows.length === 0) {
      return res.status(404).json({ message: "Alat tidak ditemukan" });
    }

    const alat = cek.rows[0];

    if (alat.status_aktif !== 1) {
      return res.status(400).json({ message: "Alat tidak aktif" });
    }

    if (alat.stok <= 0) {
      return res.status(400).json({ message: "Stok alat habis" });
    }

    const insert = await db.query(
      `
      INSERT INTO peminjaman 
      (id_user, id_alat, tgl_pinjam, tgl_rencana_kembali, status)
      VALUES ($1,$2,$3,$4,'menunggu')
      RETURNING id_peminjaman
      `,
      [id_user, id_alat, tgl_pinjam, tgl_rencana_kembali],
    );

    await logAktivitas({
      id_user,
      aktivitas: "Mengajukan peminjaman alat",
      id_peminjaman,
    });

    res.json({
      message: "Peminjaman berhasil diajukan",
      id_peminjaman: insert.rows[0].id_peminjaman,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengajukan peminjaman" });
  }
};

exports.getAllPeminjaman = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id_peminjaman,
        u.name AS peminjam,
        a.name AS alat,
        p.tgl_pinjam,
        p.tgl_rencana_kembali,
        p.status
      FROM peminjaman p
      JOIN users u ON p.id_user = u.id_user
      JOIN alat a ON p.id_alat = a.id_alat
      ORDER BY p.id_peminjaman DESC
    `;

    const result = await db.query(query);

    res.json({
      message: "Data peminjaman berhasil diambil",
      data: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengambil data peminjaman",
    });
  }
};

exports.getMyPeminjaman = async (req, res) => {
  const id_user = req.user.id_user;

  try {
    const query = `
      SELECT 
        p.id_peminjaman,
        a.name AS alat,
        p.tgl_pinjam,
        p.tgl_rencana_kembali,
        p.status
      FROM peminjaman p
      JOIN alat a ON p.id_alat = a.id_alat
      WHERE p.id_user = $1
      ORDER BY p.id_peminjaman DESC
    `;

    const result = await db.query(query, [id_user]);

    res.json({
      message: "Data peminjaman saya",
      data: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengambil data peminjaman",
    });
  }
};

exports.updateStatusPeminjaman = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const cek = await db.query(
      "SELECT id_alat, status FROM peminjaman WHERE id_peminjaman = $1",
      [id],
    );

    if (cek.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Data peminjaman tidak ditemukan" });
    }

    const peminjaman = cek.rows[0];

    if (peminjaman.status !== "menunggu") {
      return res.status(400).json({
        message: "Peminjaman sudah diproses sebelumnya",
      });
    }

    await db.query(
      "UPDATE peminjaman SET status = $1 WHERE id_peminjaman = $2",
      [status, id],
    );

    if (status === "disetujui") {
      await db.query("UPDATE alat SET stok = stok - 1 WHERE id_alat = $1", [
        peminjaman.id_alat,
      ]);
    }

    res.json({
      message: `Peminjaman berhasil ${status}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengubah status peminjaman",
    });
  }
};
