const db = require('../config/db');
const logAktivitas = require('../utils/logAktivitas');
const { hitungDendaPerUnit } = require('./denda.controller');

const getUnitPeminjaman = async (client, id_peminjaman) => {
  const result = await client.query(
    `SELECT 
       pu.id_unit,
       au.kode_unit,
       au.status,
       -- cek apakah unit ini sudah masuk batch pengembalian yang diverifikasi
       EXISTS (
         SELECT 1 
         FROM pengembalian_unit pnu
         JOIN pengembalian pg ON pnu.id_pengembalian = pg.id_pengembalian
         WHERE pnu.id_unit = pu.id_unit
           AND pg.id_peminjaman = $1
           AND pg.status_verifikasi = 'selesai'
       ) AS sudah_dikembalikan,
       -- cek apakah unit ini sedang menunggu verifikasi (sudah diajukan tapi belum diverif)
       EXISTS (
         SELECT 1 
         FROM pengembalian_unit pnu
         JOIN pengembalian pg ON pnu.id_pengembalian = pg.id_pengembalian
         WHERE pnu.id_unit = pu.id_unit
           AND pg.id_peminjaman = $1
           AND pg.status_verifikasi = 'menunggu'
       ) AS menunggu_verifikasi
     FROM peminjaman_unit pu
     JOIN alat_unit au ON pu.id_unit = au.id_unit
     WHERE pu.id_peminjaman = $1`,
    [id_peminjaman]
  );
  return result.rows;
};

exports.getUnitBisaDikembalikan = async (req, res) => {
  const { id_peminjaman } = req.params;
  const id_user = req.user.id_user;

  try {
    const cekPeminjaman = await db.query(
      `SELECT id_peminjaman, status, status_pengambilan, id_alat, jumlah,
              tgl_pinjam, tgl_jatuh_tempo
       FROM peminjaman
       WHERE id_peminjaman = $1 AND id_user = $2`,
      [id_peminjaman, id_user]
    );

    if (cekPeminjaman.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Peminjaman tidak ditemukan atau bukan milik Anda' 
      });
    }

    const peminjaman = cekPeminjaman.rows[0];

    if (peminjaman.status_pengambilan !== 'sudah_diambil') {
      return res.status(400).json({ 
        success: false,
        message: 'Barang belum diambil, tidak bisa dikembalikan' 
      });
    }

    if (peminjaman.status === 'selesai') {
      return res.status(400).json({ 
        success: false,
        message: 'Peminjaman sudah selesai' 
      });
    }

    const client = await db.connect();
    try {
      const units = await getUnitPeminjaman(client, id_peminjaman);
      
      const bisaDikembalikan = units.filter(
        u => !u.sudah_dikembalikan && !u.menunggu_verifikasi
      );
      
      return res.json({
        success: true,
        data: bisaDikembalikan, 
        stats: {
          total_dipinjam: units.length,
          sudah_dikembalikan: units.filter(u => u.sudah_dikembalikan).length,
          menunggu_verifikasi: units.filter(u => u.menunggu_verifikasi).length,
          bisa_dikembalikan: bisaDikembalikan.length
        },
        peminjaman: {
          tgl_pinjam: peminjaman.tgl_pinjam,
          tgl_jatuh_tempo: peminjaman.tgl_jatuh_tempo,
          status: peminjaman.status,
          status_pengambilan: peminjaman.status_pengambilan
        }
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('GET UNIT BISA DIKEMBALIKAN ERROR:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil data unit',
      error: err.message 
    });
  }
};

exports.createPengembalian = async (req, res) => {
  let client;
  const id_user = req.user.id_user;
  const { id_peminjaman, tgl_kembali, unit_ids, keterangan_user } = req.body;

  if (!id_peminjaman || !tgl_kembali) {
    return res.status(400).json({ 
      success: false,
      message: 'Data pengembalian wajib diisi' 
    });
  }
  if (!unit_ids || !Array.isArray(unit_ids) || unit_ids.length === 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Pilih minimal 1 unit yang dikembalikan' 
    });
  }

  try {
    client = await db.connect();
    await client.query('BEGIN');

    const cekPeminjaman = await client.query(
      `SELECT p.status, p.status_pengambilan, p.id_alat, p.jumlah, p.tgl_jatuh_tempo
       FROM peminjaman p
       WHERE p.id_peminjaman = $1 AND p.id_user = $2
       FOR UPDATE`,
      [id_peminjaman, id_user]
    );

    if (cekPeminjaman.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false,
        message: 'Peminjaman tidak ditemukan' 
      });
    }

    const peminjaman = cekPeminjaman.rows[0];

    if (peminjaman.status_pengambilan !== 'sudah_diambil') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        message: 'Barang belum diambil, tidak bisa dikembalikan' 
      });
    }

    if (peminjaman.status === 'selesai') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        message: 'Peminjaman sudah selesai' 
      });
    }

    const unitsPeminjaman = await getUnitPeminjaman(client, id_peminjaman);
    const unitMap = new Map(unitsPeminjaman.map(u => [u.id_unit, u]));

    for (const id_unit of unit_ids) {
      const unit = unitMap.get(parseInt(id_unit));
      if (!unit) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Unit ID ${id_unit} tidak termasuk dalam peminjaman ini`
        });
      }
      if (unit.sudah_dikembalikan) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Unit ${unit.kode_unit} sudah dikembalikan sebelumnya`
        });
      }
      if (unit.menunggu_verifikasi) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Unit ${unit.kode_unit} sedang menunggu verifikasi`
        });
      }
    }

    const insertPengembalian = await client.query(
      `INSERT INTO pengembalian
         (id_peminjaman, tgl_kembali, kondisi_laporan, keterangan_user, catatan_peminjam,
          status_verifikasi, jumlah_dikembalikan)
       VALUES ($1, $2, 'normal', $3, $3, 'menunggu', $4)
       RETURNING id_pengembalian`,
      [id_peminjaman, tgl_kembali, keterangan_user || null, unit_ids.length]
    );

    const id_pengembalian = insertPengembalian.rows[0].id_pengembalian;

    for (const id_unit of unit_ids) {
      await client.query(
        `INSERT INTO pengembalian_unit (id_pengembalian, id_unit, kondisi_awal)
         VALUES ($1, $2, 'normal')`,
        [id_pengembalian, id_unit]
      );
    }

    const updatedUnits = await getUnitPeminjaman(client, id_peminjaman);
    const totalUnit = updatedUnits.length;
    const sudahDiajukan = updatedUnits.filter(
      u => u.sudah_dikembalikan || u.menunggu_verifikasi
    ).length;

    let statusBaru;
    if (sudahDiajukan >= totalUnit) {
      statusBaru = 'menunggu_pengembalian';
    } else {
      statusBaru = 'dipinjam';
    }

    await client.query(
      `UPDATE peminjaman SET status = $1 WHERE id_peminjaman = $2`,
      [statusBaru, id_peminjaman]
    );

    await client.query('COMMIT');

    await logAktivitas({
      id_user,
      aktivitas: `Mengajukan pengembalian ${unit_ids.length} unit (batch ID: ${id_pengembalian})`,
      id_peminjaman,
      id_pengembalian,
    });

    return res.status(201).json({
      success: true,
      message: `Pengembalian ${unit_ids.length} unit berhasil diajukan dan menunggu verifikasi petugas.`,
      data: {
        id_pengembalian,
        jumlah_dikembalikan: unit_ids.length,
        status_peminjaman: statusBaru,
        unit_ids: unit_ids
      }
    });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('CREATE PENGEMBALIAN ERROR:', err);
    return res.status(500).json({ 
      success: false,
      message: err.message || 'Gagal mengajukan pengembalian' 
    });
  } finally {
    if (client) client.release();
  }
};

exports.getAllPengembalian = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        pg.id_pengembalian,
        pg.id_peminjaman,
        u.name AS peminjam,
        a.name AS alat,
        a.id_alat,
        pg.tgl_kembali,
        pg.kondisi_laporan,
        pg.status_verifikasi,
        pg.keterangan_user,
        pg.jumlah_dikembalikan,
        p.tgl_jatuh_tempo,
        p.jumlah AS total_dipinjam,
        -- hitung berapa unit dari peminjaman ini yg sudah selesai diverifikasi (di luar batch ini)
        (
          SELECT COUNT(DISTINCT pnu2.id_unit)
          FROM pengembalian_unit pnu2
          JOIN pengembalian pg2 ON pnu2.id_pengembalian = pg2.id_pengembalian
          WHERE pg2.id_peminjaman = p.id_peminjaman
            AND pg2.status_verifikasi = 'selesai'
        ) AS total_unit_selesai
      FROM pengembalian pg
      JOIN peminjaman p ON pg.id_peminjaman = p.id_peminjaman
      JOIN users u ON p.id_user = u.id_user
      JOIN alat a ON p.id_alat = a.id_alat
      ORDER BY pg.id_pengembalian DESC
    `);

    const pengembalianWithUnits = await Promise.all(
      result.rows.map(async (row) => {
        const units = await db.query(
          `SELECT 
             pnu.id_pengembalian_unit,
             pnu.id_unit,
             au.kode_unit,
             pnu.kondisi_awal,
             pnu.kondisi_final,
             pnu.catatan_petugas
           FROM pengembalian_unit pnu
           JOIN alat_unit au ON pnu.id_unit = au.id_unit
           WHERE pnu.id_pengembalian = $1
           ORDER BY au.kode_unit`,
          [row.id_pengembalian]
        );
        return { ...row, units: units.rows };
      })
    );

    res.json({
      success: true,
      message: 'Data pengembalian berhasil diambil',
      data: pengembalianWithUnits,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil data pengembalian' 
    });
  }
};

exports.verifikasiPengembalian = async (req, res) => {
  const { id } = req.params; 
  const { kondisi_units } = req.body;

  const kondisiValid = ['normal', 'rusak_ringan', 'rusak_berat', 'hilang'];

  if (!kondisi_units || !Array.isArray(kondisi_units) || kondisi_units.length === 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Data kondisi unit wajib diisi' 
    });
  }

  for (const ku of kondisi_units) {
    if (!kondisiValid.includes(ku.kondisi_final)) {
      return res.status(400).json({
        success: false,
        message: `Kondisi '${ku.kondisi_final}' tidak valid untuk unit ID ${ku.id_unit}`
      });
    }
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const cekBatch = await client.query(
      `SELECT 
         pg.id_pengembalian,
         pg.tgl_kembali,
         pg.status_verifikasi,
         pg.id_peminjaman,
         p.id_alat,
         p.jumlah AS total_dipinjam,
         p.tgl_jatuh_tempo,
         a.name AS nama_alat
       FROM pengembalian pg
       JOIN peminjaman p ON pg.id_peminjaman = p.id_peminjaman
       JOIN alat a ON p.id_alat = a.id_alat
       WHERE pg.id_pengembalian = $1
       FOR UPDATE`,
      [id]
    );

    if (cekBatch.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false,
        message: 'Data pengembalian tidak ditemukan' 
      });
    }

    const batch = cekBatch.rows[0];

    if (batch.status_verifikasi !== 'menunggu') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        message: 'Pengembalian sudah diverifikasi sebelumnya' 
      });
    }

    const unitDiBatch = await client.query(
      `SELECT pnu.id_pengembalian_unit, pnu.id_unit, au.kode_unit
       FROM pengembalian_unit pnu
       JOIN alat_unit au ON pnu.id_unit = au.id_unit
       WHERE pnu.id_pengembalian = $1`,
      [id]
    );

    const unitBatchIds = new Set(unitDiBatch.rows.map(u => u.id_unit));
    const kondisiMap = new Map(kondisi_units.map(ku => [ku.id_unit, ku]));

    for (const unitBatch of unitDiBatch.rows) {
      if (!kondisiMap.has(unitBatch.id_unit)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Kondisi untuk unit ${unitBatch.kode_unit} (ID: ${unitBatch.id_unit}) belum diisi`
        });
      }
    }

    let hariTerlambat = 0;
    if (batch.tgl_jatuh_tempo) {
      const jatuhTempo = new Date(batch.tgl_jatuh_tempo);
      const kembali = new Date(batch.tgl_kembali);
      if (kembali > jatuhTempo) {
        const diffMs = kembali - jatuhTempo;
        hariTerlambat = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }
    }

    let totalDendaBatch = 0;
    const dendaPerUnit = [];
    const ringkasanKondisi = { normal: 0, rusak_ringan: 0, rusak_berat: 0, hilang: 0 };

    for (const unitBatch of unitDiBatch.rows) {
      const kondisiData = kondisiMap.get(unitBatch.id_unit);
      const kondisi = kondisiData.kondisi_final;
      const catatan = kondisiData.catatan || null;

      await client.query(
        `UPDATE pengembalian_unit
         SET kondisi_final = $1, catatan_petugas = $2
         WHERE id_pengembalian = $3 AND id_unit = $4`,
        [kondisi, catatan, id, unitBatch.id_unit]
      );

      const dendaUnit = await hitungDendaPerUnit(kondisi, hariTerlambat, batch.id_alat, 1);
      totalDendaBatch += dendaUnit.total_denda;

      dendaPerUnit.push({
        id_unit: unitBatch.id_unit,
        kode_unit: unitBatch.kode_unit,
        kondisi,
        ...dendaUnit,
      });

      ringkasanKondisi[kondisi] = (ringkasanKondisi[kondisi] || 0) + 1;

      let statusUnit;
      switch (kondisi) {
        case 'normal':
        case 'rusak_ringan':
          statusUnit = 'tersedia';
          break;
        case 'rusak_berat':
          statusUnit = 'rusak';
          break;
        case 'hilang':
          statusUnit = 'hilang';
          break;
      }

      await client.query(
        `UPDATE alat_unit SET status = $1 WHERE id_unit = $2`,
        [statusUnit, unitBatch.id_unit]
      );
    }

    const unitKembali = ringkasanKondisi.normal + ringkasanKondisi.rusak_ringan;
    if (unitKembali > 0) {
      await client.query(
        `UPDATE alat SET stok = stok + $1 WHERE id_alat = $2`,
        [unitKembali, batch.id_alat]
      );
    }

    if (ringkasanKondisi.rusak_berat > 0) {
      await client.query(
        `UPDATE alat SET status_aktif = 0 WHERE id_alat = $1 AND stok <= 0`,
        [batch.id_alat]
      );
    }

    let id_denda = null;
    if (totalDendaBatch > 0) {
      const insertDenda = await client.query(
        `INSERT INTO denda
           (id_pengembalian, hari_terlambat, tarif_per_hari, total_denda, status_bayar,
            jenis_denda, created_at)
         VALUES ($1, $2, $3, $4, 'belum_bayar', 'gabungan', NOW())
         RETURNING id_denda`,
        [
          id,
          hariTerlambat,
          dendaPerUnit[0]?.tarif_per_hari || 0,
          Math.round(totalDendaBatch),
        ]
      );
      id_denda = insertDenda.rows[0].id_denda;
    }

    await client.query(
      `UPDATE pengembalian
       SET status_verifikasi = 'selesai',
           kondisi_laporan = $1
       WHERE id_pengembalian = $2`,
      [
        ringkasanKondisi.hilang > 0 ? 'hilang'
          : ringkasanKondisi.rusak_berat > 0 ? 'rusak_berat'
          : ringkasanKondisi.rusak_ringan > 0 ? 'rusak_ringan'
          : 'normal',
        id
      ]
    );

    const allUnits = await getUnitPeminjaman(client, batch.id_peminjaman);
    const unitSelesaiCount = await client.query(
      `SELECT COUNT(DISTINCT pnu.id_unit) AS cnt
      FROM pengembalian_unit pnu
      JOIN pengembalian pg ON pnu.id_pengembalian = pg.id_pengembalian
      WHERE pg.id_peminjaman = $1 AND pg.status_verifikasi = 'selesai'`,
      [batch.id_peminjaman]
    );
    const jumlahUnitSelesai = parseInt(unitSelesaiCount.rows[0].cnt);
    const totalUnitPeminjaman = allUnits.length;
    const statusPeminjaman = jumlahUnitSelesai >= totalUnitPeminjaman ? 'selesai' : 'dipinjam';

    await client.query(
      `UPDATE peminjaman SET status = $1 WHERE id_peminjaman = $2`,
      [statusPeminjaman, batch.id_peminjaman]
    );

    await client.query('COMMIT');

    const io = req.app.get('io');
    if (io) {
      io.emit('pengembalian_update', {
        id_pengembalian: id,
        status: 'selesai',
        status_peminjaman: statusPeminjaman,
      });
    }

    await logAktivitas({
      id_user: req.user.id_user,
      aktivitas: `Verifikasi pengembalian batch ID ${id}: ${JSON.stringify(ringkasanKondisi)}. Total denda: Rp ${Math.round(totalDendaBatch)}`,
      id_pengembalian: id,
      id_peminjaman: batch.id_peminjaman,
    });

    return res.json({
      success: true,
      message: 'Pengembalian berhasil diverifikasi',
      data: {
        totalDenda: Math.round(totalDendaBatch),
        hariTerlambat,
        ringkasanKondisi,
        dendaPerUnit,
        statusPeminjaman,
        peminjaman_selesai: statusPeminjaman === 'selesai',
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('ERROR VERIFIKASI PENGEMBALIAN:', err);
    return res.status(500).json({ 
      success: false,
      message: err.message || 'Gagal memverifikasi pengembalian' 
    });
  } finally {
    client.release();
  }
};

exports.getAllPengembalianAdmin = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        pg.id_pengembalian,
        pg.id_peminjaman,
        u.name AS peminjam,
        a.name AS alat,
        pg.tgl_kembali,
        pg.kondisi_laporan,
        pg.status_verifikasi,
        pg.jumlah_dikembalikan,
        p.tgl_jatuh_tempo,
        p.jumlah AS total_dipinjam
      FROM pengembalian pg
      JOIN peminjaman p ON pg.id_peminjaman = p.id_peminjaman
      JOIN users u ON p.id_user = u.id_user
      JOIN alat a ON p.id_alat = a.id_alat
      ORDER BY pg.id_pengembalian DESC
    `);

    const withUnits = await Promise.all(
      result.rows.map(async (row) => {
        const units = await db.query(
          `SELECT 
             pnu.id_unit,
             au.kode_unit,
             pnu.kondisi_awal,
             pnu.kondisi_final,
             pnu.catatan_petugas
           FROM pengembalian_unit pnu
           JOIN alat_unit au ON pnu.id_unit = au.id_unit
           WHERE pnu.id_pengembalian = $1`,
          [row.id_pengembalian]
        );
        return { ...row, units: units.rows };
      })
    );

    res.json({ 
      success: true,
      data: withUnits 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: 'Gagal mengambil data pengembalian' 
    });
  }
};

exports.updateTanggalPengembalian = async (req, res) => {
  const { id } = req.params;
  const { tgl_kembali } = req.body;

  if (!tgl_kembali) {
    return res.status(400).json({ 
      success: false,
      message: 'Tanggal pengembalian wajib diisi' 
    });
  }

  try {
    const cek = await db.query(
      `SELECT status_verifikasi FROM pengembalian WHERE id_pengembalian = $1`,
      [id]
    );

    if (cek.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Pengembalian tidak ditemukan' 
      });
    }
    if (cek.rows[0].status_verifikasi !== 'menunggu') {
      return res.status(400).json({ 
        success: false,
        message: 'Tidak bisa ubah tanggal, sudah diverifikasi' 
      });
    }

    await db.query(
      `UPDATE pengembalian SET tgl_kembali = $1 WHERE id_pengembalian = $2`,
      [tgl_kembali, id]
    );

    await logAktivitas({
      id_user: req.user.id_user,
      aktivitas: `Mengubah tanggal pengembalian batch ID ${id}`,
      id_pengembalian: id,
    });

    res.json({ 
      success: true,
      message: 'Tanggal pengembalian berhasil diubah' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: 'Gagal mengubah tanggal pengembalian' 
    });
  }
};