const db = require ('../config/db');
const logAktivitas = require ('../utils/logAktivitas');

exports.createPengembalian = async (req, res) => {
  let client;
  const id_user = req.user.id_user;
  const {
    id_peminjaman,
    tgl_kembali,
    kondisi_laporan,
    keterangan_user,
  } = req.body;

  if (!id_peminjaman || !tgl_kembali) {
    return res.status (400).json ({message: 'Data pengembalian wajib diisi'});
  }

  try {
    client = await db.connect ();
    await client.query ('BEGIN');

    const cek = await client.query (
      `SELECT status, status_pengambilan 
   FROM peminjaman 
   WHERE id_peminjaman=$1 AND id_user=$2 
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
      `SELECT 1 FROM pengembalian WHERE id_peminjaman=$1`,
      [id_peminjaman]
    );

    if (duplikat.rows.length > 0) {
      await client.query ('ROLLBACK');
      return res
        .status (409)
        .json ({message: 'Pengembalian sudah diajukan sebelumnya'});
    }

    const kondisiValid = ['normal', 'rusak_ringan', 'rusak_berat', 'hilang'];

    if (!kondisiValid.includes (kondisi_laporan)) {
      throw new Error ('Nilai kondisi_laporan tidak valid');
    }

    const insert = await client.query (
      `
      INSERT INTO pengembalian
      (id_peminjaman, tgl_kembali, kondisi_laporan, keterangan_user, status_verifikasi)
      VALUES ($1,$2,$3,$4,'menunggu')
      RETURNING id_pengembalian
      `,
      [
        id_peminjaman,
        tgl_kembali,
        kondisi_laporan || 'normal',
        keterangan_user || null,
      ]
    );

    const unitRes = await db.query (
      `SELECT id_unit FROM peminjaman_unit WHERE id_peminjaman = $1`,
      [id_peminjaman]
    );

    for (const u of unitRes.rows) {
      await db.query (
        `UPDATE alat_unit SET status = 'tersedia' WHERE id_unit = $1`,
        [u.id_unit]
      );
    }

    await client.query (
      `UPDATE peminjaman SET status='menunggu_pengembalian' WHERE id_peminjaman=$1`,
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
      message: 'Pengembalian berhasil diajukan',
      id_pengembalian: insert.rows[0].id_pengembalian,
    });
  } catch (err) {
    if (client) await client.query ('ROLLBACK');
    console.error ('CREATE PENGEMBALIAN ERROR:', err);
    return res.status (500).json ({message: err.message});
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
    return res.status (400).json ({
      message: 'Kondisi tidak valid',
    });
  }

  const client = await db.connect ();

  try {
    await client.query ('BEGIN');

    console.log ('=== DEBUG VERIFIKASI START ===');
    console.log ('ID PENGEMBALIAN:', id);

    const cek = await client.query (
      `
      SELECT 
        pg.status_verifikasi,
        pg.tgl_kembali,
        p.id_alat,
        p.id_peminjaman,
        p.jumlah,
        p.tgl_jatuh_tempo
      FROM pengembalian pg
      JOIN peminjaman p ON pg.id_peminjaman = p.id_peminjaman
      WHERE pg.id_pengembalian = $1
      FOR UPDATE
      `,
      [id]
    );

    if (cek.rows.length === 0) {
      await client.query ('ROLLBACK');
      return res.status (404).json ({message: 'Data tidak ditemukan'});
    }

    const data = cek.rows[0];
    const id_alat = data.id_alat;

    console.log ('DATA:', data);

    if (data.status_verifikasi !== 'menunggu') {
      await client.query ('ROLLBACK');
      return res.status (400).json ({
        message: 'Sudah diverifikasi sebelumnya',
      });
    }

    const updateStatus = await client.query (
      `
      UPDATE pengembalian
      SET status_verifikasi = 'selesai'
      WHERE id_pengembalian = $1
      AND status_verifikasi = 'menunggu'
      RETURNING *
      `,
      [id]
    );

    if (updateStatus.rowCount === 0) {
      await client.query ('ROLLBACK');
      return res.status (400).json ({
        message: 'Sudah diproses sebelumnya',
      });
    }

    const alatLock = await client.query (
      `SELECT stok FROM alat WHERE id_alat = $1 FOR UPDATE`,
      [id_alat]
    );

    const stokSebelum = alatLock.rows[0].stok;

    console.log ('STOK SEBELUM:', stokSebelum);
    console.log ('JUMLAH DIKEMBALIKAN:', data.jumlah);

    let stokBaru;

    const cekFinal = await client.query (
      `SELECT status_verifikasi FROM pengembalian WHERE id_pengembalian = $1`,
      [id]
    );

    if (cekFinal.rows[0].status_verifikasi !== 'selesai') {
      throw new Error ('Status tidak valid saat update stok');
    }

    if (kondisi_final === 'normal' || kondisi_final === 'rusak_ringan') {
      await client.query (
        `UPDATE alat SET stok = stok + $1 WHERE id_alat = $2`,
        [data.jumlah, id_alat]
      );
    } else if (kondisi_final === 'rusak_berat') {
      await client.query (
        `UPDATE alat SET stok = stok + $1, status_aktif = 0 WHERE id_alat = $2`,
        [data.jumlah, id_alat]
      );
    } else if (kondisi_final === 'hilang') {
      await client.query (
        `UPDATE alat SET stok = stok - $1 WHERE id_alat = $2`,
        [data.jumlah, id_alat]
      );
    }

    console.log ('STOK SESUDAH:', stokBaru);

    let hariTerlambat = 0;
    const tarif = 5000;

    if (data.tgl_jatuh_tempo) {
      const jatuhTempo = new Date (data.tgl_jatuh_tempo);
      const kembali = new Date (data.tgl_kembali);

      if (kembali > jatuhTempo) {
        const diffMs = kembali - jatuhTempo;
        hariTerlambat = Math.floor (diffMs / (1000 * 60 * 60 * 24));
      }
    }

    let totalDenda = 0;

    if (hariTerlambat > 0) totalDenda += hariTerlambat * tarif;
    if (kondisi_final === 'rusak_ringan') totalDenda += 20000;
    if (kondisi_final === 'rusak_berat') totalDenda += 50000;
    if (kondisi_final === 'hilang') totalDenda += 100000;

    if (totalDenda > 0) {
      await client.query (
        `
        INSERT INTO denda
        (id_pengembalian, hari_terlambat, tarif_per_hari, total_denda, status_bayar)
        VALUES ($1,$2,$3,$4,'belum_bayar')
        `,
        [id, hariTerlambat, tarif, totalDenda]
      );
    }

    await client.query (
      `UPDATE peminjaman SET status = 'selesai' WHERE id_peminjaman = $1`,
      [data.id_peminjaman]
    );

    await client.query ('COMMIT');

    const io = req.app.get ('io');

    io.emit ('pengembalian_update', {
      id_pengembalian: id,
      status: 'selesai',
    });

    console.log ('=== DEBUG VERIFIKASI END ===');

    res.json ({
      message: 'Pengembalian berhasil diverifikasi',
      totalDenda,
      hariTerlambat,
    });
  } catch (err) {
    await client.query ('ROLLBACK');
    console.error ('ERROR VERIFIKASI:', err);

    res.status (500).json ({
      message: 'Gagal verifikasi',
    });
  } finally {
    client.release ();
  }
};
