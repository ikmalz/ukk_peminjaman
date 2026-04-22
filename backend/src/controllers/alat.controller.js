const db = require ('../config/db');
const logAktivitas = require ('../utils/logAktivitas');

exports.createAlat = async (req, res) => {
  let {
    id_kategori,
    name,
    stok,
    stok_minimum,
    merk,
    tipe_model,
    spesifikasi,
    harga = 0,
  } = req.body;

  id_kategori = parseInt(id_kategori);
  stok = parseInt(stok) || 0;
  stok_minimum = stok_minimum ? parseInt(stok_minimum) : 0;
  harga = parseInt(harga) || 0;

  if (!id_kategori || !name || stok <= 0) {
    return res.status(400).json({ message: 'Kategori, nama alat, dan stok wajib diisi dengan benar (stok > 0)' });
  }

  if (harga < 0) {
    return res.status(400).json({ message: 'Harga tidak boleh kurang dari 0' });
  }
  if (stok_minimum > stok) {
    return res.status(400).json({ message: 'Stok minimum tidak boleh lebih besar dari stok' });
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const kodeRes = await client.query(
      'SELECT COUNT(*) AS total FROM alat WHERE id_kategori = $1',
      [id_kategori]
    );

    const urutan = Number(kodeRes.rows[0].total) + 1;
    const kategoriRes = await client.query(
      'SELECT name FROM kategori_alat WHERE id_kategori = $1',
      [id_kategori]
    );

    if (!kategoriRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Kategori tidak ditemukan' });
    }

    const prefix = kategoriRes.rows[0].name.substring(0, 3).toUpperCase();
    const kode_alat = prefix + '-' + String(urutan).padStart(3, '0');
    const image = req.file ? `/uploads/alat/${req.file.filename}` : null;

    const result = await client.query(
      `
      INSERT INTO alat 
      (kode_alat, id_kategori, name, stok, stok_minimum, merk, tipe_model, spesifikasi, 
       kondisi, status_aktif, image, harga)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'normal', 1, $9, $10)
      RETURNING id_alat
      `,
      [kode_alat, id_kategori, name, stok, stok_minimum, merk || null, tipe_model || null, spesifikasi || null, image, harga]
    );

    const id_alat = result.rows[0].id_alat;

    for (let i = 1; i <= stok; i++) {
      const kode_unit = `${kode_alat}-${String(i).padStart(3, '0')}`;
      await client.query(
        `INSERT INTO alat_unit (id_alat, kode_unit, status) VALUES ($1, $2, 'tersedia')`,
        [id_alat, kode_unit]
      );
    }

    await client.query('COMMIT');

    await logAktivitas({
      id_user: req.user?.id_user,
      aktivitas: `Menambahkan alat baru: ${name} (${kode_alat}) dengan ${stok} unit`,
    });

    res.json({
      message: 'Alat berhasil ditambahkan',
      id_alat,
      stok,
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error createAlat:', err);
    res.status(500).json({ message: 'Gagal menambahkan alat' });
  } finally {
    client.release();
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
        a.spesifikasi,
        a.kondisi,
        a.status_aktif,
        a.image,
        a.harga,                    
        k.name AS kategori
      FROM alat a
      JOIN kategori_alat k ON a.id_kategori = k.id_kategori
      ORDER BY a.id_alat DESC
    `;

    const result = await db.query(query);

    res.json({
      message: 'Data alat berhasil diambil',
      data: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data alat' });
  }
};

exports.getAlatById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `SELECT * FROM alat WHERE id_alat = $1`;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Alat tidak ditemukan' });
    }

    res.json({
      message: 'Detail alat',
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data alat' });
  }
};

exports.updateAlat = async (req, res) => {
  const { id } = req.params;
  let {
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
    harga,
  } = req.body;

  id_kategori = id_kategori ? parseInt(id_kategori) : null;
  stok = stok ? parseInt(stok) : null;
  stok_minimum = stok_minimum ? parseInt(stok_minimum) : 0;
  harga = harga ? parseInt(harga) : 0;
  status_aktif = status_aktif !== undefined ? parseInt(status_aktif) : 1;

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
        harga = $11,
        image = COALESCE($12, image)
      WHERE id_alat = $13
    `;

    await db.query(query, [
      kode_alat || null,
      id_kategori,
      name,
      stok,
      stok_minimum,
      merk || null,
      tipe_model || null,
      spesifikasi || null,
      kondisi || 'normal',
      status_aktif,
      harga,
      image,
      id,
    ]);

    await logAktivitas({
      id_user: req.user?.id_user,
      aktivitas: `Mengupdate alat ID ${id}`,
    });

    res.json({ message: 'Data alat berhasil diperbarui' });
  } catch (err) {
    console.error('Error updateAlat:', err);
    res.status(500).json({ message: 'Gagal mengubah data alat' });
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
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT id_unit, id_alat, kode_unit, status 
       FROM alat_unit 
       WHERE id_alat = $1 
       ORDER BY kode_unit`,
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('GET UNIT BY ALAT ERROR:', err);
    res.status(500).json({ message: 'Gagal mengambil data unit' });
  }
};

exports.deleteAlat = async (req, res) => {
  const { id } = req.params;
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const alatRes = await client.query('SELECT name FROM alat WHERE id_alat = $1', [id]);
    const namaAlat = alatRes.rows[0]?.name || `ID ${id}`;

    await client.query(`DELETE FROM riwayat_alat WHERE id_alat = $1`, [id]);

    const peminjaman = await client.query(
      `SELECT id_peminjaman FROM peminjaman WHERE id_alat = $1`,
      [id]
    );

    const ids = peminjaman.rows.map(p => p.id_peminjaman);
    const pengembalian = await client.query(
      `SELECT id_pengembalian FROM pengembalian WHERE id_peminjaman = ANY($1)`,
      [ids]
    );
    const pengembalianIds = pengembalian.rows.map(p => p.id_pengembalian);

    if (pengembalianIds.length > 0) {
      await client.query(`DELETE FROM log_aktivitas WHERE id_pengembalian = ANY($1)`, [pengembalianIds]);
    }

    if (ids.length > 0) {
      await client.query(`DELETE FROM log_aktivitas WHERE id_peminjaman = ANY($1)`, [ids]);
      await client.query(`DELETE FROM peminjaman_unit WHERE id_peminjaman = ANY($1)`, [ids]);
      await client.query(`DELETE FROM pengembalian WHERE id_peminjaman = ANY($1)`, [ids]);

      await client.query(`
        DELETE FROM denda 
        WHERE id_pengembalian IN (
          SELECT id_pengembalian FROM pengembalian WHERE id_peminjaman = ANY($1)
        )
      `, [ids]);

      await client.query(`DELETE FROM peminjaman WHERE id_alat = $1`, [id]);
    }

    await client.query(`DELETE FROM alat_unit WHERE id_alat = $1`, [id]);
    await client.query(`DELETE FROM alat WHERE id_alat = $1`, [id]);

    await client.query('COMMIT');

    await logAktivitas({
      id_user: req.user?.id_user,
      aktivitas: `Menghapus alat: ${namaAlat}`,
    });

    res.json({ message: 'Alat dan semua relasinya berhasil dihapus' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Gagal menghapus alat' });
  } finally {
    client.release();
  }
};

exports.updateUnitStatus = async (req, res) => {
  const { id_unit } = req.params;
  const { status } = req.body;
  const id_user = req.user?.id_user;

  const statusValid = ['tersedia', 'rusak', 'maintenance', 'hilang'];

  if (!statusValid.includes(status)) {
    return res.status(400).json({ 
      message: 'Status tidak valid. Gunakan: tersedia, rusak, maintenance, atau hilang' 
    });
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const unitRes = await client.query(
      `SELECT 
         au.id_unit, 
         au.status AS old_status, 
         au.kode_unit, 
         a.id_alat,
         a.stok,
         a.name AS nama_alat 
       FROM alat_unit au 
       JOIN alat a ON au.id_alat = a.id_alat 
       WHERE au.id_unit = $1 
       FOR UPDATE`,
      [id_unit]
    );

    if (unitRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Unit alat tidak ditemukan' });
    }

    const unit = unitRes.rows[0];
    const { old_status, id_alat, stok: currentStok } = unit;

    if (old_status === 'dipinjam') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: 'Unit ini sedang dipinjam. Tidak dapat mengubah status.' 
      });
    }

    let stokChange = 0;

    if (old_status === 'tersedia' && status !== 'tersedia') {
      stokChange = -1;       
    } 
    else if (old_status !== 'tersedia' && status === 'tersedia') {
      stokChange = +1;        
    }

    await client.query(
      `UPDATE alat_unit SET status = $1 WHERE id_unit = $2`,
      [status, id_unit]
    );

    if (stokChange !== 0) {
      const newStok = currentStok + stokChange;
      await client.query(
        `UPDATE alat SET stok = $1 WHERE id_alat = $2`,
        [newStok, id_alat]
      );
    }

    await logAktivitas({
      id_user,
      aktivitas: `Mengubah status unit ${unit.kode_unit} (${unit.nama_alat}) dari "${old_status}" menjadi "${status}"`,
      id_unit: id_unit,
    });

    await client.query('COMMIT');

    res.json({
      message: `Status unit ${unit.kode_unit} berhasil diubah menjadi ${status}`,
      unit: {
        id_unit: unit.id_unit,
        kode_unit: unit.kode_unit,
        status_baru: status,
        stok_baru: stokChange !== 0 ? currentStok + stokChange : undefined
      }
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ERROR UPDATE UNIT STATUS:', err);
    res.status(500).json({ message: 'Gagal mengubah status unit' });
  } finally {
    client.release();
  }
};

exports.getAlatByIdForPeminjam = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT 
        id_alat,
        kode_alat,
        name,
        stok,
        stok_minimum,
        merk,
        tipe_model,
        spesifikasi,
        kondisi,
        status_aktif,
        image,
        harga,
        id_kategori
      FROM alat 
      WHERE id_alat = $1 
        AND status_aktif = 1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Alat tidak ditemukan atau tidak aktif' 
      });
    }

    res.json({
      message: 'Detail alat',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error getAlatByIdForPeminjam:', err);
    res.status(500).json({ message: 'Gagal mengambil detail alat' });
  }
};