const db = require("../config/db");

exports.createKategori = async (req, res) => {
  const { name, deskripsi } = req.body;

  if (!name) {
    return res.status(400).json({
      message: "Nama kategori wajib diisi",
    });
  }

  try {
    const query = `
      INSERT INTO kategori_alat (name, deskripsi)
      VALUES ($1, $2)
      RETURNING id_kategori
    `;

    const result = await db.query(query, [name, deskripsi]);

    res.json({
      message: "Kategori berhasil ditambahkan",
      kategori: {
        id_kategori: result.rows[0].id_kategori,
        name,
        deskripsi,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal menambahkan kategori",
    });
  }
};

exports.getAllKategori = async (req, res) => {
  try {
    const query = `
      SELECT id_kategori, name, deskripsi
      FROM kategori_alat
      ORDER BY id_kategori DESC
    `;

    const result = await db.query(query);

    res.json({
      message: "Data kategori berhasil diambil",
      data: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengambil data kategori",
    });
  }
};

exports.getKategoriById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT id_kategori, name, deskripsi
      FROM kategori_alat
      WHERE id_kategori = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Kategori tidak ditemukan",
      });
    }

    res.json({
      message: "Detail kategori",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengambil data kategori",
    });
  }
};

exports.updateKategori = async (req, res) => {
  const { id } = req.params;
  const { name, deskripsi } = req.body;

  if (!name) {
    return res.status(400).json({
      message: "Nama kategori wajib diisi",
    });
  }

  try {
    const query = `
      UPDATE kategori_alat
      SET name = $1, deskripsi = $2
      WHERE id_kategori = $3
    `;

    await db.query(query, [name, deskripsi, id]);

    res.json({
      message: "Kategori berhasil diperbarui",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal mengubah kategori",
    });
  }
};

exports.deleteKategori = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      DELETE FROM kategori_alat
      WHERE id_kategori = $1
    `;

    await db.query(query, [id]);

    res.json({
      message: "Kategori berhasil dihapus",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal menghapus kategori",
    });
  }
};

exports.deleteKategori = async (req, res) => {
  const { id } = req.params;

  try {
    const cek = await db.query(
      "SELECT COUNT(*) FROM alat WHERE id_kategori = $1",
      [id]
    );

    if (parseInt(cek.rows[0].count) > 0) {
      return res.status(400).json({
        message: "Kategori tidak dapat dihapus karena masih digunakan oleh alat",
      });
    }

    await db.query(
      "DELETE FROM kategori_alat WHERE id_kategori = $1",
      [id]
    );

    res.json({
      message: "Kategori berhasil dihapus",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Gagal menghapus kategori",
    });
  }
};
