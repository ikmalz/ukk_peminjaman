const db = require ('../config/db');
const logAktivitas = require ('../utils/logAktivitas');
const {hitungDenda} = require ('./denda.controller');

exports.createPengembalian = async (req, res) => {
  let client;
  const id_user = req.user.id_user;
  const {id_peminjaman, tgl_kembali, keterangan_user} = req.body;

  if (!id_peminjaman || !tgl_kembali) {
    return res.status (400).json ({message: 'Data pengembalian wajib diisi'});
  }

  try {
    client = await db.connect ();
    await client.query ('BEGIN');

    const cek = await client.query (
      `SELECT status, status_pengambilan 
       FROM peminjaman 
       WHERE id_peminjaman = $1 AND id_user = $2 
       FOR UPDATE`,
      [id_peminjaman, id_user]
    );

    if (cek.rows.length === 0) {
      await client.query ('ROLLBACK');
      return res.status (404).json ({message: 'Peminjaman tidak ditemukan'});
    }

    if (cek.rows[0].status_pengambilan !== 'sudah_diambil') {
      await client.query ('ROLLBACK');
      return res.status (400).json ({
        message: 'Barang belum diambil, tidak bisa dikembalikan',
      });
    }

    const duplikat = await client.query (
      `SELECT 1 FROM pengembalian WHERE id_peminjaman = $1`,
      [id_peminjaman]
    );

    if (duplikat.rows.length > 0) {
      await client.query ('ROLLBACK');
      return res
        .status (409)
        .json ({message: 'Pengembalian sudah diajukan sebelumnya'});
    }

    const insert = await client.query (
      `
      INSERT INTO pengembalian
      (id_peminjaman, tgl_kembali, kondisi_laporan, keterangan_user, status_verifikasi)
      VALUES ($1, $2, 'normal', $3, 'menunggu')
      RETURNING id_pengembalian
      `,
      [id_peminjaman, tgl_kembali, keterangan_user || null]
    );

    // ✅ FIX BUG 2: HAPUS block update alat_unit ke 'tersedia' di sini.
    // Unit tetap berstatus 'dipinjam' sampai petugas memverifikasi pengembalian.
    // Status unit baru diupdate saat verifikasiPengembalian dijalankan.

    await client.query (
      `UPDATE peminjaman SET status = 'menunggu_pengembalian' WHERE id_peminjaman = $1`,
      [id_peminjaman]
    );

    await client.query ('COMMIT');

    await logAktivitas ({
      id_user,
      aktivitas: 'Mengajukan pengembalian alat',
      id_peminjaman,
      id_pengembalian: insert.rows[0].id_pengembalian,
    });

    return res.status (201).json ({
      message: 'Pengembalian berhasil diajukan dan menunggu verifikasi petugas.',
      id_pengembalian: insert.rows[0].id_pengembalian,
    });
  } catch (err) {
    if (client) await client.query ('ROLLBACK');
    console.error ('CREATE PENGEMBALIAN ERROR:', err);
    return res
      .status (500)
      .json ({message: err.message || 'Gagal mengajukan pengembalian'});
  } finally {
    if (client) client.release ();
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

    const result = await db.query (query);

    res.json ({
      message: 'Data pengembalian berhasil diambil',
      data: result.rows,
    });
  } catch (err) {
    console.error (err);
    res.status (500).json ({
      message: 'Gagal mengambil data pengembalian',
    });
  }
};

exports.verifikasiPengembalian = async (req, res) => {
  const {id} = req.params;
  const {kondisi_final} = req.body;

  const kondisiValid = ['normal', 'rusak_ringan', 'rusak_berat', 'hilang'];

  if (!kondisiValid.includes (kondisi_final)) {
    return res.status (400).json ({message: 'Kondisi tidak valid'});
  }

  const client = await db.connect ();

  try {
    await client.query ('BEGIN');

    const cek = await client.query (
      `
      SELECT 
        pg.id_pengembalian,
        pg.tgl_kembali,
        pg.status_verifikasi,
        p.id_alat,
        p.id_peminjaman,
        p.jumlah,
        p.tgl_jatuh_tempo,
        a.name AS nama_alat
      FROM pengembalian pg
      JOIN peminjaman p ON pg.id_peminjaman = p.id_peminjaman
      JOIN alat a ON p.id_alat = a.id_alat
      WHERE pg.id_pengembalian = $1
      FOR UPDATE
    `,
      [id]
    );

    if (cek.rows.length === 0) {
      await client.query ('ROLLBACK');
      return res
        .status (404)
        .json ({message: 'Data pengembalian tidak ditemukan'});
    }

    const data = cek.rows[0];

    if (data.status_verifikasi !== 'menunggu') {
      await client.query ('ROLLBACK');
      return res
        .status (400)
        .json ({message: 'Pengembalian sudah diverifikasi sebelumnya'});
    }

    let hariTerlambat = 0;
    if (data.tgl_jatuh_tempo) {
      const jatuhTempo = new Date (data.tgl_jatuh_tempo);
      const kembali = new Date (data.tgl_kembali);
      if (kembali > jatuhTempo) {
        const diffMs = kembali - jatuhTempo;
        hariTerlambat = Math.floor (diffMs / (1000 * 60 * 60 * 24));
      }
    }

    const jumlah = parseInt (data.jumlah) || 1;
    const dendaInfo = await hitungDenda (
      kondisi_final,
      hariTerlambat,
      data.id_alat,
      jumlah
    );
    await client.query (
      `UPDATE pengembalian 
       SET status_verifikasi = 'selesai', kondisi_laporan = $1 
       WHERE id_pengembalian = $2`,
      [kondisi_final, id]
    );



    // ✅ FIX BUG 1: Logika stok yang benar.
    // Stok sudah berkurang saat peminjaman dibuat.
    // - normal/rusak_ringan → barang kembali ke inventaris, stok ditambah kembali
    // - rusak_berat/hilang  → barang tidak kembali, stok TIDAK ditambah DAN TIDAK dikurangi lagi
    //                         (sudah dikurangi saat dipinjam, double deduction dihapus)
    if (kondisi_final === 'normal' || kondisi_final === 'rusak_ringan') {
      await client.query (
        `UPDATE alat SET stok = stok + $1 WHERE id_alat = $2`,
        [jumlah, data.id_alat]
      );
    }

    if (kondisi_final === 'rusak_berat') {
      await client.query (
        `UPDATE alat SET status_aktif = 0 WHERE id_alat = $1 AND stok <= 0`,
        [data.id_alat]
      );
    }

    // ✅ FIX BUG 2: Update status setiap unit berdasarkan kondisi final.
    // Baru di sini (saat verifikasi) unit diubah statusnya, bukan saat pengajuan.
    const unitRes = await client.query (
      `SELECT id_unit FROM peminjaman_unit WHERE id_peminjaman = $1`,
      [data.id_peminjaman]
    );

    for (const u of unitRes.rows) {
      try {
        if (kondisi_final === 'normal' || kondisi_final === 'rusak_ringan') {
          await client.query (
            `UPDATE alat_unit SET status = 'tersedia' WHERE id_unit = $1`,
            [u.id_unit]
          );
        } else if (kondisi_final === 'rusak_berat') {
          await client.query (
            `UPDATE alat_unit SET status = 'rusak' WHERE id_unit = $1`,
            [u.id_unit]
          );
        } else if (kondisi_final === 'hilang') {
          await client.query (
            `UPDATE alat_unit SET status = 'hilang' WHERE id_unit = $1`,
            [u.id_unit]
          );
        }
      } catch (unitErr) {
        console.error (`GAGAL UPDATE UNIT ${u.id_unit}:`, unitErr.message);
        throw unitErr;
      }
    }

    if (dendaInfo.total_denda > 0) {
      await client.query (
        `
        INSERT INTO denda 
        (id_pengembalian, hari_terlambat, tarif_per_hari, total_denda, status_bayar, created_at)
        VALUES ($1, $2, $3, $4, 'belum_bayar', NOW())
      `,
        [
          id,
          hariTerlambat,
          dendaInfo.denda_terlambat || 0,
          dendaInfo.total_denda,
        ]
      );
    }

    await client.query (
      `UPDATE peminjaman SET status = 'selesai' WHERE id_peminjaman = $1`,
      [data.id_peminjaman]
    );

    await client.query ('COMMIT');

    const io = req.app.get ('io');
    if (io)
      io.emit ('pengembalian_update', {id_pengembalian: id, status: 'selesai'});

    await logAktivitas ({
      id_user: req.user.id_user,
      aktivitas: `Verifikasi pengembalian ID ${id} dengan kondisi ${kondisi_final}. Total denda: Rp ${dendaInfo.total_denda}`,
      id_pengembalian: id,
      id_peminjaman: data.id_peminjaman,
    });

    res.json ({
      message: 'Pengembalian berhasil diverifikasi',
      totalDenda: dendaInfo.total_denda,
      hariTerlambat,
      detailDenda: dendaInfo,
    });
  } catch (err) {
    await client.query ('ROLLBACK');
    console.error ('ERROR VERIFIKASI PENGEMBALIAN:', err);
    res
      .status (500)
      .json ({message: err.message || 'Gagal memverifikasi pengembalian'});
  } finally {
    client.release ();
  }
};

exports.getAllPengembalianAdmin = async (req, res) => {
  try {
    const result = await db.query (`
      SELECT 
        pg.id_pengembalian,
        u.name AS peminjam,
        a.name AS alat,
        pg.tgl_kembali,
        pg.kondisi_laporan,
        pg.status_verifikasi,
        p.tgl_jatuh_tempo
      FROM pengembalian pg
      JOIN peminjaman p ON pg.id_peminjaman = p.id_peminjaman
      JOIN users u ON p.id_user = u.id_user
      JOIN alat a ON p.id_alat = a.id_alat
      ORDER BY pg.id_pengembalian DESC
    `);

    res.json ({data: result.rows});
  } catch (err) {
    console.error (err);
    res.status (500).json ({message: 'Gagal mengambil data pengembalian'});
  }
};

exports.updateTanggalPengembalian = async (req, res) => {
  const {id} = req.params;
  const {tgl_kembali} = req.body;

  if (!tgl_kembali) {
    return res
      .status (400)
      .json ({message: 'Tanggal pengembalian wajib diisi'});
  }

  try {
    await db.query (
      `
      UPDATE pengembalian 
      SET tgl_kembali = $1 
      WHERE id_pengembalian = $2
    `,
      [tgl_kembali, id]
    );

    await logAktivitas ({
      id_user: req.user.id_user,
      aktivitas: `Mengubah tanggal pengembalian ID ${id}`,
      id_pengembalian: id,
    });

    res.json ({message: 'Tanggal pengembalian berhasil diubah'});
  } catch (err) {
    console.error (err);
    res.status (500).json ({message: 'Gagal mengubah tanggal pengembalian'});
  }
};
