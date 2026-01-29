const db = require("../config/db");
const logAktivitas = require("../utils/logAktivitas");

exports.createPengembalian = async (req, res) => {
  const id_user = req.user.id_user;
  const { id_peminjaman, tgl_kembali, kondisi_laporan, keterangan_user } =
    req.body;

  try {
    const cek = await db.query(
      `
      SELECT p.id_peminjaman, p.id_alat, p.status
      FROM peminjaman p
      WHERE p.id_peminjaman = $1
      AND p.id_user = $2
      `,
      [id_peminjaman, id_user],
    );

    if (cek.rows.length === 0) {
      return res.status(404).json({
        message: "Data peminjaman tidak ditemukan atau bukan milik anda",
      });
    }

    const peminjaman = cek.rows[0];

    if (peminjaman.status !== "disetujui") {
      return res.status(400).json({
        message: "Peminjaman belum disetujui atau sudah dikembalikan",
      });
    }

    const insert = await db.query(
      `
      INSERT INTO pengembalian
      (id_peminjaman, tgl_kembali, kondisi_laporan, keterangan_user, status_verifikasi)
      VALUES ($1,$2,$3,$4,'menunggu')
      RETURNING id_pengembalian
      `,
      [
        id_peminjaman,
        tgl_kembali,
        kondisi_laporan || "normal",
        keterangan_user || null,
      ],
    );

    await logAktivitas({
      id_user,
      aktivitas: "Mengajukan pengembalian alat",
      id_peminjaman,
      id_pengembalian: insert.rows[0].id_pengembalian,
    });

    res.json({
      message: "Pengembalian berhasil dikirim, menunggu verifikasi petugas",
      id_pengembalian: insert.rows[0].id_pengembalian,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengirim data pengembalian",
    });
  }
};

exports.getAllPengembalian = async (req, res) => {
  try {
    const query = `
      SELECT 
        pg.id_pengembalian,
        u.name AS peminjam,
        a.name AS alat,
        pg.tgl_kembali,
        pg.kondisi_laporan,
        pg.status_verifikasi
      FROM pengembalian pg
      JOIN peminjaman p ON pg.id_peminjaman = p.id_peminjaman
      JOIN users u ON p.id_user = u.id_user
      JOIN alat a ON p.id_alat = a.id_alat
      ORDER BY pg.id_pengembalian DESC
    `;

    const result = await db.query(query);

    res.json({
      message: "Data pengembalian berhasil diambil",
      data: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengambil data pengembalian",
    });
  }
};

exports.verifikasiPengembalian = async (req, res) => {
  const { id } = req.params;
  const { kondisi_final, tindakan, estimasi_biaya, keterangan_petugas } =
    req.body;
  const id_petugas = req.user.id_user;

  try {
    // simpan verifikasi
    await db.query(
      `
      INSERT INTO verifikasi_pengembalian
      (id_pengembalian, kondisi_final, tindakan, estimasi_biaya, keterangan_petugas, status_selesai)
      VALUES ($1,$2,$3,$4,$5,'selesai')
      `,
      [
        id,
        kondisi_final || "normal",
        tindakan || "tidak_ada",
        estimasi_biaya || 0,
        keterangan_petugas || null,
      ],
    );

    await db.query(
      `
      UPDATE pengembalian
      SET status_verifikasi = 'selesai'
      WHERE id_pengembalian = $1
      `,
      [id],
    );

    res.json({
      message: "Pengembalian berhasil diverifikasi",
    });

    await logAktivitas({
      id_user: id_petugas,
      aktivitas: "Verifikasi pengembalian alat",
      id_pengembalian: id,
    });
  } catch (err) {
    console.error("ERROR DB:", err);
    res.status(500).json({
      error: err.message,
      detail: err.detail,
      code: err.code,
    });
  }
};
