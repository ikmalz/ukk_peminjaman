const db = require("../config/db");
const logAktivitas = require("../utils/logAktivitas");
const crypto = require("crypto");

const generateKodeVA = (id_denda) => {
  const tgl = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `VA-${tgl}-${String(id_denda).padStart(4, "0")}${rand}`;
};

const generateKodeStruk = () => {
  const tgl = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `STR-${tgl}-${rand}`;
};

exports.hitungDendaPerUnit = async (kondisi_laporan, hari_terlambat, id_alat, jumlah = 1) => {
  const configRes = await db.query("SELECT * FROM konfigurasi_denda LIMIT 1");
  const config = configRes.rows[0] || {
    tarif_per_hari_terlambat: 10000,
    persen_rusak_ringan: 25,
    persen_rusak_berat: 70,
    persen_hilang: 100,
  };

  const alatRes = await db.query("SELECT harga FROM alat WHERE id_alat = $1", [id_alat]);
  const harga = Number(alatRes.rows[0]?.harga) || 0;

  let denda_damage = 0;
  let persen_digunakan = 0;

  switch (kondisi_laporan?.toLowerCase()) {
    case "rusak_ringan":
      persen_digunakan = config.persen_rusak_ringan;
      denda_damage = (config.persen_rusak_ringan / 100) * harga * jumlah;
      break;
    case "rusak_berat":
      persen_digunakan = config.persen_rusak_berat;
      denda_damage = (config.persen_rusak_berat / 100) * harga * jumlah;
      break;
    case "hilang":
      persen_digunakan = config.persen_hilang;
      denda_damage = (config.persen_hilang / 100) * harga * jumlah;
      break;
    default:
      denda_damage = 0;
  }

  const denda_terlambat = hari_terlambat * config.tarif_per_hari_terlambat * jumlah;
  const total_denda = Math.round(denda_damage + denda_terlambat);

  return {
    total_denda,
    denda_damage: Math.round(denda_damage),
    denda_terlambat: Math.round(denda_terlambat),
    tarif_per_hari: config.tarif_per_hari_terlambat,
    hari_terlambat,
    persen_digunakan,
    jumlah_unit: jumlah,
  };
};

exports.hitungDenda = exports.hitungDendaPerUnit;

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
      persen_hilang: 100,
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
    persen_hilang,
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
          persen_rusak_ringan      = $2,
          persen_rusak_berat       = $3,
          persen_hilang            = $4,
          updated_at               = NOW()
      WHERE id = 1
    `, [tarif_per_hari_terlambat, persen_rusak_ringan, persen_rusak_berat, persen_hilang]);

    await logAktivitas({ id_user: req.user.id_user, aktivitas: "Mengubah konfigurasi denda sistem" });
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
        d.jenis_denda,
        d.kode_va,
        d.batas_bayar,
        d.tgl_dibayar,
        d.catatan_kasir,
        d.created_at,
        u.name        AS peminjam,
        u.id_user     AS id_peminjam,
        a.name        AS alat,
        pg.kondisi_laporan,
        pg.id_pengembalian,
        pg.jumlah_dikembalikan,
        p.id_peminjaman,
        pb.kode_struk,
        pb.created_at AS tgl_bayar_struk,
        pt.name       AS nama_petugas
      FROM denda d
      JOIN pengembalian   pg ON d.id_pengembalian = pg.id_pengembalian
      JOIN peminjaman      p ON pg.id_peminjaman  = p.id_peminjaman
      JOIN users           u ON p.id_user         = u.id_user
      JOIN alat            a ON p.id_alat         = a.id_alat
      LEFT JOIN pembayaran_denda pb ON pb.id_denda = d.id_denda
      LEFT JOIN users       pt ON pb.id_petugas    = pt.id_user
      ORDER BY d.id_denda DESC
    `);

    const withUnitDetail = await Promise.all(
      result.rows.map(async (row) => {
        const units = await db.query(
          `SELECT 
             pnu.id_unit,
             au.kode_unit,
             pnu.kondisi_final,
             pnu.catatan_petugas
           FROM pengembalian_unit pnu
           JOIN alat_unit au ON pnu.id_unit = au.id_unit
           WHERE pnu.id_pengembalian = $1
             AND pnu.kondisi_final IS NOT NULL
             AND pnu.kondisi_final != 'normal'`,
          [row.id_pengembalian]
        );
        return { ...row, unit_bermasalah: units.rows };
      })
    );

    res.json({ data: withUnitDetail });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data denda" });
  }
};

exports.getDendaSaya = async (req, res) => {
  const id_user = req.user.id_user;

  try {
    const result = await db.query(`
      SELECT 
        d.id_denda,
        d.total_denda,
        d.hari_terlambat,
        d.status_bayar,
        d.jenis_denda,
        d.kode_va,
        d.batas_bayar,
        d.tgl_dibayar,
        d.created_at,
        a.name        AS alat,
        pg.kondisi_laporan,
        pg.tgl_kembali,
        p.tgl_jatuh_tempo,
        pb.kode_struk,
        pb.created_at AS tgl_bayar_struk,
        pt.name       AS nama_petugas
      FROM denda d
      JOIN pengembalian   pg ON d.id_pengembalian = pg.id_pengembalian
      JOIN peminjaman      p ON pg.id_peminjaman  = p.id_peminjaman
      JOIN alat            a ON p.id_alat         = a.id_alat
      LEFT JOIN pembayaran_denda pb ON pb.id_denda = d.id_denda
      LEFT JOIN users       pt ON pb.id_petugas    = pt.id_user
      WHERE p.id_user = $1
      ORDER BY d.created_at DESC
    `, [id_user]);

    const now = new Date();
    const data = result.rows.map((d) => ({
      ...d,
      lewat_batas: d.batas_bayar && new Date(d.batas_bayar) < now && d.status_bayar !== "lunas",
    }));

    res.json({ data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal mengambil data denda" });
  }
};

exports.generateTagihan = async (req, res) => {
  const { id } = req.params; 
  const { hari_batas_bayar = 3, catatan_kasir } = req.body; 

  try {
    const cek = await db.query(`SELECT * FROM denda WHERE id_denda = $1`, [id]);
    if (cek.rows.length === 0) return res.status(404).json({ message: "Denda tidak ditemukan" });

    const denda = cek.rows[0];
    if (denda.status_bayar === "lunas") return res.status(400).json({ message: "Denda sudah lunas" });

    if (denda.kode_va) {
      return res.json({
        message: "Tagihan sudah ada",
        data: { kode_va: denda.kode_va, batas_bayar: denda.batas_bayar, total_denda: denda.total_denda },
      });
    }

    const kode_va = generateKodeVA(id);
    const batas_bayar = new Date();
    batas_bayar.setDate(batas_bayar.getDate() + hari_batas_bayar);

    await db.query(
      `UPDATE denda 
       SET kode_va = $1, batas_bayar = $2, catatan_kasir = $3
       WHERE id_denda = $4`,
      [kode_va, batas_bayar.toISOString().split("T")[0], catatan_kasir || null, id]
    );

    await logAktivitas({
      id_user: req.user.id_user,
      aktivitas: `Generate tagihan denda ID ${id}, VA: ${kode_va}`,
    });

    res.json({
      message: "Tagihan berhasil dibuat",
      data: { kode_va, batas_bayar: batas_bayar.toISOString().split("T")[0], total_denda: denda.total_denda },
    });
  } catch (err) {
    console.error("ERROR GENERATE TAGIHAN:", err);
    res.status(500).json({ message: err.message || "Gagal membuat tagihan" });
  }
};

exports.konfirmasiPembayaran = async (req, res) => {
  const { id } = req.params; 
  const { metode = "cash", catatan } = req.body;
  const id_petugas = req.user.id_user;

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const cek = await client.query(
      `SELECT d.*, u.id_user AS id_peminjam 
       FROM denda d
       JOIN pengembalian pg ON d.id_pengembalian = pg.id_pengembalian
       JOIN peminjaman    p  ON pg.id_peminjaman = p.id_peminjaman
       JOIN users         u  ON p.id_user = u.id_user
       WHERE d.id_denda = $1
       FOR UPDATE`,
      [id]
    );

    if (cek.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Denda tidak ditemukan" });
    }

    const denda = cek.rows[0];
    if (denda.status_bayar === "lunas") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Denda sudah lunas" });
    }

    await client.query(
      `UPDATE denda 
       SET status_bayar = 'lunas', tgl_dibayar = NOW(), dibayar_oleh = $1
       WHERE id_denda = $2`,
      [id_petugas, id]
    );

    const kode_struk = generateKodeStruk();
    await client.query(
      `INSERT INTO pembayaran_denda (id_denda, id_petugas, nominal_bayar, metode, kode_struk, catatan)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, id_petugas, denda.total_denda, metode, kode_struk, catatan || null]
    );

    const sisaDenda = await client.query(
      `SELECT COUNT(*) AS cnt 
       FROM denda d
       JOIN pengembalian pg ON d.id_pengembalian = pg.id_pengembalian
       JOIN peminjaman    p  ON pg.id_peminjaman = p.id_peminjaman
       WHERE p.id_user = $1 AND d.status_bayar = 'belum_bayar' AND d.id_denda != $2`,
      [denda.id_peminjam, id]
    );

    if (parseInt(sisaDenda.rows[0].cnt) === 0) {
      await client.query(
        `UPDATE users SET is_blocked = FALSE, alasan_blokir = NULL WHERE id_user = $1`,
        [denda.id_peminjam]
      );
    }

    await client.query("COMMIT");

    await logAktivitas({
      id_user: id_petugas,
      aktivitas: `Konfirmasi pembayaran denda ID ${id}. Struk: ${kode_struk}`,
    });

    res.json({
      message: "Pembayaran berhasil dikonfirmasi",
      data: { kode_struk, kode_va: denda.kode_va, total_denda: denda.total_denda },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("ERROR KONFIRMASI BAYAR:", err);
    res.status(500).json({ message: err.message || "Gagal konfirmasi pembayaran" });
  } finally {
    client.release();
  }
};

exports.getStrukPembayaran = async (req, res) => {
  const { id } = req.params;
  
  console.log(`🔍 Mencari struk untuk denda ID: ${id}`);

  try {
    const result = await db.query(`
      SELECT 
        d.id_denda,
        d.total_denda,
        d.hari_terlambat,
        d.kode_va,
        d.batas_bayar,
        d.tgl_dibayar,
        d.jenis_denda,
        -- d.kondisi_laporan_snapshot,  ← HAPUS BARIS INI
        d.created_at       AS tgl_denda_dibuat,
        pb.kode_struk,
        pb.metode,
        pb.nominal_bayar,
        pb.catatan,
        pb.created_at      AS tgl_bayar,
        u.name             AS peminjam,
        u.email            AS email_peminjam,
        a.name             AS alat,
        pt.name            AS nama_petugas,
        pg.kondisi_laporan,
        pg.tgl_kembali,
        p.tgl_jatuh_tempo,
        p.id_peminjaman
      FROM denda d
      JOIN pengembalian    pg ON d.id_pengembalian = pg.id_pengembalian
      JOIN peminjaman       p ON pg.id_peminjaman  = p.id_peminjaman
      JOIN users            u ON p.id_user         = u.id_user
      JOIN alat             a ON p.id_alat         = a.id_alat
      LEFT JOIN pembayaran_denda pb ON pb.id_denda = d.id_denda
      LEFT JOIN users       pt ON pb.id_petugas    = pt.id_user
      WHERE d.id_denda = $1
    `, [id]);

    console.log(`📊 Query result rows: ${result.rows.length}`);

    if (result.rows.length === 0) {
      console.log(`❌ Denda ID ${id} tidak ditemukan`);
      return res.status(404).json({ message: "Struk tidak ditemukan" });
    }

    console.log(`✅ Struk ditemukan untuk denda ID ${id}, kode_struk: ${result.rows[0].kode_struk}`);

    const units = await db.query(`
      SELECT pnu.id_unit, au.kode_unit, pnu.kondisi_final, pnu.catatan_petugas
      FROM pengembalian_unit pnu
      JOIN alat_unit au ON pnu.id_unit = au.id_unit
      WHERE pnu.id_pengembalian = (
        SELECT id_pengembalian FROM denda WHERE id_denda = $1
      ) AND pnu.kondisi_final != 'normal'
    `, [id]);

    res.json({ data: { ...result.rows[0], unit_bermasalah: units.rows } });
  } catch (err) {
    console.error("❌ Error getStrukPembayaran:", err);
    res.status(500).json({ message: "Gagal mengambil struk" });
  }
};

exports.prosesBlokir = async (req, res) => {
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const dendaLewatBatas = await client.query(`
      SELECT DISTINCT p.id_user, u.name
      FROM denda d
      JOIN pengembalian   pg ON d.id_pengembalian = pg.id_pengembalian
      JOIN peminjaman      p  ON pg.id_peminjaman = p.id_peminjaman
      JOIN users           u  ON p.id_user = u.id_user
      WHERE d.status_bayar = 'belum_bayar'
        AND d.batas_bayar IS NOT NULL
        AND d.batas_bayar < CURRENT_DATE
        AND u.is_blocked = FALSE
    `);

    const blocked = [];
    for (const row of dendaLewatBatas.rows) {
      await client.query(
        `UPDATE users 
         SET is_blocked = TRUE, alasan_blokir = 'Denda melewati batas waktu pembayaran'
         WHERE id_user = $1`,
        [row.id_user]
      );
      blocked.push(row.name);
    }

    await client.query("COMMIT");

    res.json({
      message: `Proses blokir selesai. ${blocked.length} user diblokir.`,
      data: blocked,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("ERROR PROSES BLOKIR:", err);
    res.status(500).json({ message: "Gagal proses blokir" });
  } finally {
    client.release();
  }
};

exports.bayarDenda = async (req, res) => {
  const { id } = req.params;
  const id_user = req.user.id_user;

  try {
    const cek = await db.query(`SELECT status_bayar FROM denda WHERE id_denda = $1`, [id]);
    if (cek.rows.length === 0) return res.status(404).json({ message: "Denda tidak ditemukan" });
    if (cek.rows[0].status_bayar === "lunas") return res.status(400).json({ message: "Denda sudah lunas" });

    await db.query(`UPDATE denda SET status_bayar = 'lunas', tgl_dibayar = NOW() WHERE id_denda = $1`, [id]);

    await logAktivitas({ id_user, aktivitas: `Menandai denda ID ${id} sebagai LUNAS`, id_denda: id });
    res.json({ message: "Denda berhasil ditandai lunas" });
  } catch (err) {
    console.error("ERROR BAYAR DENDA:", err);
    res.status(500).json({ message: err.message || "Gagal memproses pembayaran denda" });
  }
};