const db = require ('../config/db');

exports.createAlat = async (req, res) => {
  const {
    id_kategori,
    name,
    stok,
    stok_minimum,
    merk,
    tipe_model,
    spesifikasi,
  } = req.body;

  if (!id_kategori || !name || stok == null) {
    return res.status (400).json ({
      message: 'Kategori, nama alat, dan stok wajib diisi',
    });
  }

  if (stok < 0) {
    return res.status (400).json ({
      message: 'Stok tidak boleh kurang dari 0',
    });
  }

  if (stok_minimum && stok_minimum > stok) {
    return res.status (400).json ({
      message: 'Stok minimum tidak boleh lebih besar dari stok',
    });
  }

  try {
    const kodeRes = await db.query (
      'SELECT COUNT(*) AS total FROM alat WHERE id_kategori = $1',
      [id_kategori]
    );

    const urutan = Number (kodeRes.rows[0].total) + 1;

    const kategoriRes = await db.query (
      'SELECT name FROM kategori_alat WHERE id_kategori = $1',
      [id_kategori]
    );

    if (!kategoriRes.rows.length) {
      return res.status (400).json ({
        message: 'Kategori tidak ditemukan',
      });
    }

    const prefix = kategoriRes.rows[0].name.substring (0, 3).toUpperCase ();

    const kode_alat = prefix + '-' + String (urutan).padStart (3, '0');
    const image = req.file ? `/uploads/alat/${req.file.filename}` : null;

    const result = await db.query (
      `
      INSERT INTO alat 
      (kode_alat, id_kategori, name, stok, stok_minimum, merk, tipe_model, spesifikasi, kondisi, status_aktif, image)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'normal',1,$9)
      RETURNING id_alat
      `,
      [
        kode_alat,
        id_kategori,
        name,
        stok,
        stok_minimum || 0,
        merk,
        tipe_model,
        spesifikasi,
        image,
      ]
    );

    const id_alat = result.rows[0].id_alat;

    for (let i = 1; i <= stok; i++) {
      const kode_unit = `${kode_alat}-${String (i).padStart (3, '0')}`;

      await db.query (
        `INSERT INTO alat_unit (id_alat, kode_unit)
     VALUES ($1, $2)`,
        [id_alat, kode_unit]
      );
    }

    res.json ({
      message: 'Alat berhasil ditambahkan',
      id_alat: result.rows[0].id_alat,
    });
  } catch (err) {
    console.error (err);
    res.status (500).json ({
      message: 'Gagal menambahkan alat',
    });
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
    a.image,   
    k.name AS kategori
  FROM alat a
  JOIN kategori_alat k ON a.id_kategori = k.id_kategori
  ORDER BY a.id_alat DESC
`;

    const result = await db.query (query);

    res.json ({
      message: 'Data alat berhasil diambil',
      data: result.rows,
    });
  } catch (err) {
    console.error (err);
    res.status (500).json ({
      message: 'Gagal mengambil data alat',
    });
  }
};

exports.getAlatById = async (req, res) => {
  const {id} = req.params;

  try {
    const query = `SELECT * FROM alat WHERE id_alat = $1`;
    const result = await db.query (query, [id]);

    if (result.rows.length === 0) {
      return res.status (404).json ({
        message: 'Alat tidak ditemukan',
      });
    }

    res.json ({
      message: 'Detail alat',
      data: result.rows[0],
    });
  } catch (err) {
    console.error (err);
    res.status (500).json ({
      message: 'Gagal mengambil data alat',
    });
  }
};

exports.updateAlat = async (req, res) => {
  const {id} = req.params;
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
    const image = req.file ? `/uploads/alat/${req.file.filename}` : null;

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
  status_aktif = $10,
  image = COALESCE($11, image)
WHERE id_alat = $12

    `;

    await db.query (query, [
      kode_alat,
      id_kategori,
      name,
      stok,
      stok_minimum || 0,
      merk,
      tipe_model,
      spesifikasi,
      kondisi || 'normal',
      status_aktif !== undefined && status_aktif !== null ? status_aktif : 1,
      image,
      id,
    ]);

    res.json ({
      message: 'Data alat berhasil diperbarui',
    });
  } catch (err) {
    console.error (err);
    res.status (500).json ({
      message: 'Gagal mengubah data alat',
    });
  }
};

exports.updateStatusAlat = async (req, res) => {
  const {id} = req.params;
  const {status_aktif} = req.body;

  try {
    const query = `
      UPDATE alat
      SET status_aktif = $1
      WHERE id_alat = $2
    `;

    await db.query (query, [status_aktif, id]);

    res.json ({
      message: 'Status alat berhasil diperbarui',
    });
  } catch (err) {
    console.error (err);
    res.status (500).json ({
      message: 'Gagal mengubah status alat',
    });
  }
};

exports.getAlatTersedia = async (req, res) => {
  try {
    const query = `
     SELECT 
  a.id_alat,
  a.kode_alat,
  a.name,
  a.stok,
  a.merk,
  a.tipe_model,
  a.spesifikasi,
  a.kondisi,
  a.image,
  k.name AS kategori
FROM alat a
JOIN kategori_alat k ON a.id_kategori = k.id_kategori
WHERE a.status_aktif = 1 AND a.stok > 0
ORDER BY a.name

    `;

    const result = await db.query (query);

    res.json ({
      message: 'Alat tersedia',
      data: result.rows,
    });
  } catch (err) {
    console.error (err);
    res.status (500).json ({message: 'Gagal mengambil alat tersedia'});
  }
};

exports.getUnitByAlat = async (req, res) => {
  const {id} = req.params;

  const result = await db.query (
    `SELECT * FROM alat_unit WHERE id_alat = $1 ORDER BY kode_unit`,
    [id]
  );

  res.json (result.rows);
};

exports.deleteAlat = async (req, res) => {
  const {id} = req.params;
  const client = await db.connect ();

  try {
    await client.query ('BEGIN');
    await client.query (`DELETE FROM riwayat_alat WHERE id_alat = $1`, [id]);

    const peminjaman = await client.query (
      `SELECT id_peminjaman FROM peminjaman WHERE id_alat = $1`,
      [id]
    );

    const ids = peminjaman.rows.map (p => p.id_peminjaman);

    const pengembalian = await client.query (
      `SELECT id_pengembalian FROM pengembalian WHERE id_peminjaman = ANY($1)`,
      [ids]
    );

    const pengembalianIds = pengembalian.rows.map (p => p.id_pengembalian);

    if (pengembalianIds.length > 0) {
      await client.query (
        `DELETE FROM log_aktivitas WHERE id_pengembalian = ANY($1)`,
        [pengembalianIds]
      );
    }

    if (ids.length > 0) {
      await client.query (
        `DELETE FROM log_aktivitas WHERE id_peminjaman = ANY($1)`,
        [ids]
      );
    }

    if (ids.length > 0) {
      await client.query (
        `DELETE FROM peminjaman_unit WHERE id_peminjaman = ANY($1)`,
        [ids]
      );

      await client.query (
        `DELETE FROM pengembalian WHERE id_peminjaman = ANY($1)`,
        [ids]
      );

      await client.query (
        `DELETE FROM denda 
         WHERE id_pengembalian IN (
           SELECT id_pengembalian FROM pengembalian 
           WHERE id_peminjaman = ANY($1)
         )`,
        [ids]
      );

      await client.query (`DELETE FROM peminjaman WHERE id_alat = $1`, [id]);
    }

    await client.query (`DELETE FROM alat_unit WHERE id_alat = $1`, [id]);

    await client.query (`DELETE FROM alat WHERE id_alat = $1`, [id]);

    await client.query ('COMMIT');

    res.json ({
      message: 'Alat dan semua relasinya berhasil dihapus',
    });
  } catch (err) {
    await client.query ('ROLLBACK');
    console.error (err);
    res.status (500).json ({
      message: 'Gagal menghapus alat',
    });
  } finally {
    client.release ();
  }
};
