const db = require("../config/db");
const logAktivitas = require("../utils/logAktivitas");

exports.hitungDenda = async (kondisi_laporan, hari_terlambat, id_alat, jumlah = 1) => {
  const configRes = await db.query("SELECT * FROM konfigurasi_denda LIMIT 1");
  const config = configRes.rows[0] || {
    tarif_per_hari_terlambat: 10000,
    persen_rusak_ringan: 25,
    persen_rusak_berat: 70,
    persen_hilang: 100
  };

  const alatRes = await db.query("SELECT harga FROM alat WHERE id_alat = $1", [id_alat]);
  const harga = Number(alatRes.rows[0]?.harga) || 0;

  let denda_damage = 0;

  switch (kondisi_laporan?.toLowerCase()) {
    case "rusak_ringan":
      denda_damage = (config.persen_rusak_ringan / 100) * harga * jumlah;
      break;
    case "rusak_berat":
      denda_damage = (config.persen_rusak_berat / 100) * harga * jumlah;
      break;
    case "hilang":
      denda_damage = (config.persen_hilang / 100) * harga * jumlah;   
      break;
    case "normal":
    default:
      denda_damage = 0;
  }

  const denda_terlambat = hari_terlambat * config.tarif_per_hari_terlambat * jumlah;

  const total_denda = Math.round(denda_damage + denda_terlambat);

  return {
    total_denda,
    denda_damage: Math.round(denda_damage),
    denda_terlambat: Math.round(denda_terlambat),
    hari_terlambat,
    persen_digunakan: kondisi_laporan !== "normal" 
      ? config[`persen_${kondisi_laporan}`] 
      : 0,
    jumlah_unit: jumlah   // optional, untuk debug
  };
};

exports.getKonfigurasiDenda = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        tarif_per_hari_terlambat,
        persen_rusak_ringan,
        persen_rusak_berat,
        persen_hilang,
        updated_at 
      FROM konfigurasi_denda LIMIT 1
    `);

    const data = result.rows[0] || {
      tarif_per_hari_terlambat: 10000,
      persen_rusak_ringan: 25,
      persen_rusak_berat: 70,
      persen_hilang: 100
    };

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil konfigurasi denda" });
  }
};

exports.updateKonfigurasiDenda = async (req, res) => {
  const {
    tarif_per_hari_terlambat,
    persen_rusak_ringan,
    persen_rusak_berat,
    persen_hilang
  } = req.body;

  if (
    tarif_per_hari_terlambat < 0 ||
    persen_rusak_ringan < 0 || persen_rusak_ringan > 100 ||
    persen_rusak_berat < 0 || persen_rusak_berat > 100 ||
    persen_hilang < 0 || persen_hilang > 100
  ) {
    return res.status(400).json({ message: "Nilai tidak valid (persen 0-100, tarif >= 0)" });
  }

  try {
    await db.query(`
      UPDATE konfigurasi_denda
      SET tarif_per_hari_terlambat = $1,
          persen_rusak_ringan = $2,
          persen_rusak_berat = $3,
          persen_hilang = $4,
          updated_at = NOW()
      WHERE id = 1
    `, [tarif_per_hari_terlambat, persen_rusak_ringan, persen_rusak_berat, persen_hilang]);

    await logAktivitas({
      id_user: req.user.id_user,
      aktivitas: "Mengubah konfigurasi denda sistem"
    });

    res.json({ message: "Konfigurasi denda berhasil diperbarui" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal memperbarui konfigurasi denda" });
  }
};

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
        a.name AS alat,
        pg.kondisi_laporan
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

exports.bayarDenda = async (req, res) => {
  const { id } = req.params;
  const id_user = req.user.id_user;

  try {
    const cek = await db.query(
      `SELECT status_bayar 
       FROM denda 
       WHERE id_denda = $1`,
      [id]
    );

    if (cek.rows.length === 0) {
      return res.status(404).json({ message: "Denda tidak ditemukan" });
    }

    if (cek.rows[0].status_bayar === "lunas") {
      return res.status(400).json({ message: "Denda sudah lunas" });
    }

    await db.query(
      `UPDATE denda 
       SET status_bayar = 'lunas' 
       WHERE id_denda = $1`,
      [id]
    );

    await logAktivitas({
      id_user,
      aktivitas: `Menandai denda ID ${id} sebagai LUNAS`,
      id_denda: id
    });

    res.json({ message: "Denda berhasil ditandai lunas" });

  } catch (err) {
    console.error('ERROR BAYAR DENDA:', err);
    res.status(500).json({ 
      message: err.message || "Gagal memproses pembayaran denda" 
    });
  }
};