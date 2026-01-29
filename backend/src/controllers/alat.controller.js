const db = require("../config/db");

exports.createAlat = async (req, res) => {
  const {
    kode_alat,
    id_kategori,
    name,
    stok,
    stok_minimum,
    merk,
    tipe_model,
    spesifikasi,
    kondisi,
    status_aktif,
  } = req.body;

  try {
    const query = `
      INSERT INTO alat 
      (kode_alat, id_kategori, name, stok, stok_minimum, merk, tipe_model, spesifikasi, kondisi, status_aktif)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id_alat
    `;

    const result = await db.query(query, [
      kode_alat,
      id_kategori,
      name,
      stok,
      stok_minimum || 0,
      merk,
      tipe_model,
      spesifikasi,
      kondisi || "normal",
      status_aktif ?? 1,
    ]);

    res.json({
      message: "Alat berhasil ditambahkan",
      id_alat: result.rows[0].id_alat,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gagal menambahkan alat" });
  }
};

exports.getAllAlat = async (req, res) => {
  try {
    const query = `
      SELECT 
        a.id_alat,
        a.kode_alat,
        a.name,
        a.stok,
        a.stok_minimum,
        a.merk,
        a.tipe_model,
        a.kondisi,
        a.status_aktif,
        k.name AS kategori
      FROM alat a
      JOIN kategori_alat k ON a.id_kategori = k.id_kategori
      ORDER BY a.id_alat DESC
    `;

    const result = await db.query(query);

    res.json({
      message: "Data alat berhasil diambil",
      data: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengambil data alat",
    });
  }
};

exports.getAlatById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `SELECT * FROM alat WHERE id_alat = $1`;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Alat tidak ditemukan",
      });
    }

    res.json({
      message: "Detail alat",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengambil data alat",
    });
  }
};

exports.updateAlat = async (req, res) => {
  const { id } = req.params;
  const {
    kode_alat,
    id_kategori,
    name,
    stok,
    stok_minimum,
    merk,
    tipe_model,
    spesifikasi,
    kondisi,
    status_aktif,
  } = req.body;

  try {
    const query = `
      UPDATE alat
      SET 
        kode_alat = $1,
        id_kategori = $2,
        name = $3,
        stok = $4,
        stok_minimum = $5,
        merk = $6,
        tipe_model = $7,
        spesifikasi = $8,
        kondisi = $9,
        status_aktif = $10
      WHERE id_alat = $11
    `;

    await db.query(query, [
      kode_alat,
      id_kategori,
      name,
      stok,
      stok_minimum || 0,
      merk,
      tipe_model,
      spesifikasi,
      kondisi || "normal",
      status_aktif ?? 1,
      id,
    ]);

    res.json({
      message: "Data alat berhasil diperbarui",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengubah data alat",
    });
  }
};

exports.updateStatusAlat = async (req, res) => {
  const { id } = req.params;
  const { status_aktif } = req.body;

  try {
    const query = `
      UPDATE alat
      SET status_aktif = $1
      WHERE id_alat = $2
    `;

    await db.query(query, [status_aktif, id]);

    res.json({
      message: "Status alat berhasil diperbarui",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengubah status alat",
    });
  }
};
