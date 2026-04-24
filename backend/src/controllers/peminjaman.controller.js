const db = require ('../config/db');
const logAktivitas = require ('../utils/logAktivitas');

exports.createPeminjaman = async (req, res) => {
  const id_user = req.user.id_user;
  const {
    id_alat,
    tgl_pinjam,
    tgl_rencana_kembali,
    jumlah,
    deskripsi,
  } = req.body;

  if (!id_alat || !tgl_pinjam || !tgl_rencana_kembali || !jumlah) {
    return res.status(400).json({ message: 'Data peminjaman wajib diisi' });
  }

  const jumlahNum = parseInt(jumlah);
  if (isNaN(jumlahNum) || jumlahNum <= 0 || jumlahNum > 5) {
    return res.status(400).json({ message: 'Jumlah harus antara 1 sampai 5' });
  }

  if (new Date(tgl_rencana_kembali) <= new Date(tgl_pinjam)) {
    return res.status(400).json({ message: 'Tanggal kembali harus setelah tanggal pinjam' });
  }

  const diffDays = Math.ceil(
    Math.abs(new Date(tgl_rencana_kembali) - new Date(tgl_pinjam)) /
      (1000 * 60 * 60 * 24)
  );

   if (diffDays > 7) {
      return res.status(400).json({
        message: 'Durasi peminjaman maksimal 7 hari',
      });
    }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const dendaRes = await client.query(
      `SELECT 1 FROM denda d 
       JOIN pengembalian pg ON d.id_pengembalian = pg.id_pengembalian 
       JOIN peminjaman p ON pg.id_peminjaman = p.id_peminjaman
       WHERE p.id_user = $1 AND d.status_bayar = 'belum_bayar'`,
      [id_user]
    );

    if (dendaRes.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Anda memiliki denda yang belum dibayar' });
    }

    const aktifRes = await client.query(
      `SELECT COUNT(*) AS total FROM peminjaman 
       WHERE id_user = $1 AND status IN ('menunggu','disetujui','dipinjam')`,
      [id_user]
    );

    if (parseInt(aktifRes.rows[0]?.total || 0) >= 5) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Kamu sudah memiliki 5 peminjaman aktif' });
    }

    const alatRes = await client.query(
      'SELECT stok, status_aktif FROM alat WHERE id_alat = $1',
      [id_alat]
    );

    const alat = alatRes.rows[0];
    if (!alat) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Alat tidak ditemukan' });
    }
    if (alat.status_aktif !== 1) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Alat tidak aktif' });
    }
    if (alat.stok < jumlahNum) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Stok tidak mencukupi. Tersedia: ${alat.stok}` });
    }

    const qr_token = require('uuid').v4();

    const insert = await client.query(
      `INSERT INTO peminjaman 
       (id_user, id_alat, tgl_pinjam, tgl_rencana_kembali, tgl_jatuh_tempo, jumlah, status, qr_token, deskripsi, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'menunggu', $7, $8, NOW())
       RETURNING id_peminjaman, qr_token`,
      [
        id_user,
        id_alat,
        tgl_pinjam,
        tgl_rencana_kembali,
        new Date(tgl_rencana_kembali),
        jumlahNum,
        qr_token,
        deskripsi || null,
      ]
    );

    await client.query('COMMIT');

    await logAktivitas({
      id_user,
      aktivitas: diffDays > 7
        ? `Mengajukan peminjaman ${jumlahNum} unit (${diffDays} hari - persetujuan khusus)`
        : `Mengajukan peminjaman ${jumlahNum} unit alat`,
      id_peminjaman: insert.rows[0].id_peminjaman,
    });

    res.json({
      message: 'Peminjaman berhasil diajukan',
      id_peminjaman: insert.rows[0].id_peminjaman,
      qr_token: insert.rows[0].qr_token,
      perlu_persetujuan_khusus: diffDays > 7,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('CREATE PEMINJAMAN ERROR:', err);
    res.status(500).json({
      message: 'Gagal mengajukan peminjaman. Silakan coba lagi.',
    });
  } finally {
    client.release();
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
        p.status,
        p.deskripsi,
        p.keterangan_batal,                         
        (p.tgl_rencana_kembali::date - p.tgl_pinjam::date) AS durasi_hari
      FROM peminjaman p
      JOIN users u ON p.id_user = u.id_user
      JOIN alat a ON p.id_alat = a.id_alat
      ORDER BY p.id_peminjaman DESC
    `;

    const result = await db.query(query);

    res.json({
      message: 'Data peminjaman berhasil diambil',
      data: result.rows,
    });
  } catch (err) {
    console.error('GET ALL PEMINJAMAN ERROR:', err);
    res.status(500).json({
      message: 'Gagal mengambil data peminjaman',
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
        p.tgl_jatuh_tempo,
        p.status
      FROM peminjaman p
      JOIN alat a ON p.id_alat = a.id_alat
      WHERE p.id_user = $1
      ORDER BY p.id_peminjaman DESC
    `;

    const result = await db.query (query, [id_user]);

    res.json ({
      data: result.rows,
    });
  } catch (err) {
    console.error (err);
    res.status (500).json ({
      message: 'Gagal mengambil data peminjaman',
    });
  }
};

exports.updateStatusPeminjaman = async (req, res) => {
  const { id } = req.params;
  let { status, keterangan_batal } = req.body; 

  console.log('[DEBUG] body diterima:', { status, keterangan_batal })
  console.log('==========================================')
  console.log('[PATCH /:id/status] REQUEST MASUK')
  console.log('Params id:', id)
  console.log('Headers Content-Type:', req.headers['content-type'])
  console.log('Body raw:', JSON.stringify(req.body))
  console.log('status:', status)
  console.log('keterangan_batal:', keterangan_batal)
  console.log('keterangan_batal type:', typeof keterangan_batal)
  console.log('==========================================')

  if (typeof status === 'string') status = status.toLowerCase().trim();

  if (!['disetujui', 'ditolak'].includes(status)) {
    return res.status(400).json({ message: 'Status harus "disetujui" atau "ditolak"' });
  }

  if (status === 'ditolak' && (!keterangan_batal || !keterangan_batal.trim())) {
    return res.status(400).json({ message: 'Alasan penolakan wajib diisi' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const cek = await client.query(
      `SELECT id_alat, status, jumlah, id_user 
       FROM peminjaman WHERE id_peminjaman = $1 FOR UPDATE`,
      [id]
    );

    if (cek.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Peminjaman tidak ditemukan' });
    }

    const p = cek.rows[0];

    if (p.status !== 'menunggu') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: `Status saat ini: ${p.status}. Tidak bisa diubah lagi.`,
      });
    }

    await client.query(
      `UPDATE peminjaman 
       SET status = $1, 
           status_pengambilan = $2,
           keterangan_batal = $3,
           updated_at = NOW()
       WHERE id_peminjaman = $4`,
      [
        status,
        status === 'disetujui' ? 'belum_diambil' : null,
        status === 'ditolak' ? keterangan_batal.trim() : null,
        id,
      ]
    );

    if (status === 'disetujui') {
      const unitRes = await client.query(
        `SELECT id_unit FROM alat_unit 
         WHERE id_alat = $1 AND status = 'tersedia' 
         LIMIT $2 FOR UPDATE`,
        [p.id_alat, p.jumlah]
      );

      if (unitRes.rows.length < p.jumlah) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Stok unit tidak mencukupi' });
      }

      for (const u of unitRes.rows) {
        await client.query(
          `INSERT INTO peminjaman_unit (id_peminjaman, id_unit) VALUES ($1, $2)`,
          [id, u.id_unit]
        );
        await client.query(
          `UPDATE alat_unit SET status = 'dipinjam' WHERE id_unit = $1`,
          [u.id_unit]
        );
      }

      await client.query(
        `UPDATE alat SET stok = stok - $1 WHERE id_alat = $2`,
        [p.jumlah, p.id_alat]
      );
    }

    await client.query('COMMIT');

    const io = req.app.get('io');
    if (io) io.emit('peminjaman_update', { id_peminjaman: id, status });

    await logAktivitas({
      id_user: req.user.id_user,
      aktivitas: status === 'ditolak'
        ? `Menolak peminjaman ID ${id}. Alasan: ${keterangan_batal}`
        : `Menyetujui peminjaman ID ${id}`,
      id_peminjaman: id,
    });

    res.json({
      message: status === 'disetujui'
        ? 'Peminjaman berhasil disetujui'
        : 'Peminjaman berhasil ditolak',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('UPDATE STATUS ERROR:', err);
    res.status(500).json({ message: 'Gagal memproses perubahan status' });
  } finally {
    client.release();
  }
};

exports.getPeminjamanAktifUser = async (req, res) => {
  const id_user = req.user.id_user;

  try {
    const result = await db.query (
      `
    SELECT id_peminjaman, id_alat, status, status_pengambilan
    FROM peminjaman
    WHERE id_user = $1
    AND status IN ('menunggu','disetujui','dipinjam')
      `,
      [id_user]
    );

    res.json ({
      data: result.rows,
      total_aktif: result.rows.length,
      is_blocked: result.rows.length >= 5,
    });
  } catch (err) {
    console.error (err);
    res.status (500).json ({
      message: 'Gagal mengambil peminjaman aktif',
    });
  }
};

exports.getStrukPeminjaman = async (req, res) => {
  const {id} = req.params;

  try {
    const result = await db.query (
      `
      SELECT 
        p.id_peminjaman,
        p.qr_token,
        a.name AS alat,
        p.tgl_pinjam,
        p.tgl_rencana_kembali,
        u.kode_unit
      FROM peminjaman p
      JOIN alat a ON p.id_alat = a.id_alat
      JOIN peminjaman_unit pu ON pu.id_peminjaman = p.id_peminjaman
      JOIN alat_unit u ON pu.id_unit = u.id_unit
      WHERE p.id_peminjaman = $1
    `,
      [id]
    );

    res.json ({
      data: result.rows,
    });
  } catch (err) {
    console.error (err);
    res.status (500).json ({message: 'Gagal ambil struk'});
  }
};

exports.scanQrPengambilan = async (req, res) => {
  const {token} = req.body;

  if (!token) {
    return res.status (400).json ({message: 'Token QR wajib dikirim'});
  }

  const client = await db.connect ();

  try {
    await client.query ('BEGIN');

    const result = await client.query (
      `
      SELECT 
        p.id_peminjaman,
        p.status,
        p.status_pengambilan,
        p.tgl_pinjam,
        p.tgl_jatuh_tempo,
        u.name AS peminjam,
        a.name AS alat,
        a.kode_alat
      FROM peminjaman p
      JOIN users u ON p.id_user = u.id_user
      JOIN alat a ON p.id_alat = a.id_alat
      WHERE p.qr_token = $1
      FOR UPDATE
      `,
      [token]
    );

    if (result.rows.length === 0) {
      await client.query ('ROLLBACK');
      return res
        .status (404)
        .json ({message: 'QR Code tidak valid atau tidak ditemukan'});
    }

    const peminjaman = result.rows[0];

    if (peminjaman.status_pengambilan === 'sudah_diambil') {
      await client.query ('ROLLBACK');
      return res
        .status (400)
        .json ({message: 'Barang ini sudah diambil sebelumnya'});
    }

    if (peminjaman.status !== 'disetujui') {
      await client.query ('ROLLBACK');
      return res.status (400).json ({message: 'Peminjaman belum disetujui'});
    }

    await client.query (
      `
      UPDATE peminjaman
      SET 
        status_pengambilan = 'sudah_diambil',
        waktu_pengambilan = NOW(),
        status = 'dipinjam',
        updated_at = NOW()
      WHERE id_peminjaman = $1
      `,
      [peminjaman.id_peminjaman]
    );

    await client.query ('COMMIT');

    const io = req.app.get ('io');
    if (io) {
      io.emit ('peminjaman_update', {
        id_peminjaman: peminjaman.id_peminjaman,
        status: 'dipinjam',
        status_pengambilan: 'sudah_diambil',
      });
    }

    await logAktivitas ({
      id_user: req.user.id_user || peminjaman.id_user,
      aktivitas: `Scan QR berhasil - Pengambilan alat ${peminjaman.alat}`,
      id_peminjaman: peminjaman.id_peminjaman,
    });

    res.json ({
      success: true,
      message: 'Pengambilan berhasil dicatat',
      peminjam: peminjaman.peminjam,
      alat: peminjaman.alat,
      kode_alat: peminjaman.kode_alat,
      tgl_pinjam: peminjaman.tgl_pinjam,
      tgl_jatuh_tempo: peminjaman.tgl_jatuh_tempo,
      id_peminjaman: peminjaman.id_peminjaman,
    });
  } catch (err) {
    await client.query ('ROLLBACK');
    console.error ('SCAN QR ERROR:', err);
    res
      .status (500)
      .json ({message: 'Terjadi kesalahan saat memproses scan QR'});
  } finally {
    client.release ();
  }
};

exports.getAllPeminjamanAdmin = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.id_peminjaman,
        u.name AS peminjam,
        a.name AS alat,
        p.tgl_pinjam,
        p.tgl_rencana_kembali,
        p.tgl_jatuh_tempo,
        p.status,
        p.jumlah,
        p.status_pengambilan,
        p.deskripsi,
        p.keterangan_batal,                       
        (p.tgl_rencana_kembali::date - p.tgl_pinjam::date) AS durasi_hari
      FROM peminjaman p
      JOIN users u ON p.id_user = u.id_user
      JOIN alat a ON p.id_alat = a.id_alat
      ORDER BY p.id_peminjaman DESC
    `);

    res.json({ data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data peminjaman' });
  }
};

exports.updateTanggalPeminjaman = async (req, res) => {
  const {id} = req.params;
  const {tgl_pinjam, tgl_rencana_kembali} = req.body;

  if (!tgl_pinjam || !tgl_rencana_kembali) {
    return res.status (400).json ({
      message: 'Tanggal pinjam dan tanggal rencana kembali wajib diisi',
    });
  }

  const tglPinjamDate = new Date (tgl_pinjam);
  const tglKembaliDate = new Date (tgl_rencana_kembali);

  if (tglKembaliDate <= tglPinjamDate) {
    return res.status (400).json ({
      message: 'Tanggal rencana kembali harus setelah tanggal pinjam',
    });
  }

  try {
    const result = await db.query (
      `
      UPDATE peminjaman 
      SET 
        tgl_pinjam = $1, 
        tgl_rencana_kembali = $2,
        tgl_jatuh_tempo = $2,
        updated_at = NOW()
      WHERE id_peminjaman = $3
      RETURNING id_peminjaman, status
      `,
      [tgl_pinjam, tgl_rencana_kembali, id]
    );

    if (result.rows.length === 0) {
      return res.status (404).json ({message: 'Peminjaman tidak ditemukan'});
    }

    await logAktivitas ({
      id_user: req.user.id_user,
      aktivitas: `Mengubah tanggal peminjaman ID ${id} menjadi ${tgl_pinjam} s/d ${tgl_rencana_kembali}`,
      id_peminjaman: id,
    });

    res.json ({
      message: 'Tanggal peminjaman berhasil diubah',
      data: result.rows[0],
    });
  } catch (err) {
    console.error ('UPDATE TANGGAL ERROR:', err);
    res.status (500).json ({message: 'Gagal mengubah tanggal peminjaman'});
  }
};

exports.getMyHistory = async (req, res) => {
  const id_user = req.user.id_user;

  try {
    const query = `
      SELECT 
        p.id_peminjaman,
        a.name AS alat,
        p.tgl_pinjam,
        p.tgl_rencana_kembali,
        p.tgl_jatuh_tempo,
        p.status,
        p.status_pengambilan,
        p.jumlah,
        p.keterangan_batal,   
        p.deskripsi,
        pu.id_unit,
        au.kode_unit
      FROM peminjaman p
      JOIN alat a ON p.id_alat = a.id_alat
      LEFT JOIN peminjaman_unit pu ON pu.id_peminjaman = p.id_peminjaman
      LEFT JOIN alat_unit au ON pu.id_unit = au.id_unit
      WHERE p.id_user = $1
      ORDER BY p.id_peminjaman DESC
    `;

    const result = await db.query(query, [id_user]);

    res.json({
      data: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil riwayat peminjaman' });
  }
};
