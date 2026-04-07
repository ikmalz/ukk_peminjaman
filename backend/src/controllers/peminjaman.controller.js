const db = require ('../config/db');
const logAktivitas = require ('../utils/logAktivitas');

exports.createPeminjaman = async (req, res) => {
  const id_user = req.user.id_user;

  const {id_alat, tgl_pinjam, tgl_rencana_kembali, jumlah} = req.body;

  if (!id_alat || !tgl_pinjam || !tgl_rencana_kembali || !jumlah) {
    return res.status (400).json ({
      message: 'Data peminjaman wajib diisi',
    });
  }

  if (jumlah <= 0) {
    return res.status (400).json ({
      message: 'Jumlah tidak valid',
    });
  }

  if (new Date (tgl_rencana_kembali) < new Date (tgl_pinjam)) {
    return res.status (400).json ({
      message: 'Tanggal kembali tidak valid',
    });
  }

  const jatuhTempo = new Date (tgl_rencana_kembali);

  try {
    const cekDenda = await db.query (
      `
      SELECT 1
      FROM denda d
      JOIN pengembalian pg ON d.id_pengembalian = pg.id_pengembalian
      JOIN peminjaman p ON pg.id_peminjaman = p.id_peminjaman
      WHERE p.id_user = $1
      AND d.status_bayar = 'belum_bayar'
    `,
      [id_user]
    );

    if (cekDenda.rows.length > 0) {
      return res.status (403).json ({
        message: 'Anda memiliki denda yang belum dibayar',
      });
    }

    const cekAlat = await db.query (
      'SELECT stok, status_aktif FROM alat WHERE id_alat = $1',
      [id_alat]
    );

    if (cekAlat.rows.length === 0) {
      return res.status (404).json ({message: 'Alat tidak ditemukan'});
    }

    const alat = cekAlat.rows[0];

    if (alat.status_aktif !== 1) {
      return res.status (400).json ({message: 'Alat tidak aktif'});
    }

    if (alat.stok < jumlah) {
      return res.status (400).json ({message: 'Stok alat tidak mencukupi'});
    }

    const insert = await db.query (
      `
      INSERT INTO peminjaman
      (id_user, id_alat, tgl_pinjam, tgl_rencana_kembali, tgl_jatuh_tempo, jumlah, status)
      VALUES ($1,$2,$3,$4,$5,$6,'menunggu')
      RETURNING id_peminjaman
    `,
      [id_user, id_alat, tgl_pinjam, tgl_rencana_kembali, jatuhTempo, jumlah]
    );

    console.log ('CREATE PEMINJAMAN:', {
      id_alat,
      jumlah,
      id_peminjaman: insert.rows[0].id_peminjaman,
    });

    await logAktivitas ({
      id_user,
      aktivitas: 'Mengajukan peminjaman alat',
      id_peminjaman: insert.rows[0].id_peminjaman,
    });

    res.json ({
      message: 'Peminjaman berhasil diajukan',
      id_peminjaman: insert.rows[0].id_peminjaman,
    });
  } catch (err) {
    console.error ('CREATE PEMINJAMAN ERROR:', err);
    res.status (500).json ({
      message: 'Gagal mengajukan peminjaman',
    });
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
        p.status
      FROM peminjaman p
      JOIN users u ON p.id_user = u.id_user
      JOIN alat a ON p.id_alat = a.id_alat
      ORDER BY p.id_peminjaman DESC
    `;

    const result = await db.query (query);

    res.json ({
      message: 'Data peminjaman berhasil diambil',
      data: result.rows,
    });
  } catch (err) {
    console.error (err);
    res.status (500).json ({
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
  const {id} = req.params;
  const {status} = req.body;

  const statusValid = ['disetujui', 'ditolak'];
  if (!statusValid.includes (status)) {
    return res.status (400).json ({
      message: 'Status tidak valid',
    });
  }

  const client = await db.connect ();

  try {
    await client.query ('BEGIN');

    const cek = await client.query (
      'SELECT id_alat, status, jumlah FROM peminjaman WHERE id_peminjaman = $1 FOR UPDATE',
      [id]
    );

    if (cek.rows.length === 0) {
      await client.query ('ROLLBACK');
      return res.status (404).json ({
        message: 'Data peminjaman tidak ditemukan',
      });
    }

    const peminjaman = cek.rows[0];

    if (peminjaman.status !== 'menunggu') {
      await client.query ('ROLLBACK');
      return res.status (400).json ({
        message: 'Peminjaman sudah diproses sebelumnya',
      });
    }

    await client.query (
      'UPDATE peminjaman SET status = $1 WHERE id_peminjaman = $2',
      [status, id]
    );

    if (status === 'disetujui') {
      const unitRes = await client.query (
        `SELECT id_unit FROM alat_unit
     WHERE id_alat = $1 AND status = 'tersedia'
     LIMIT $2
     FOR UPDATE`,
        [peminjaman.id_alat, peminjaman.jumlah]
      );

      if (unitRes.rows.length < peminjaman.jumlah) {
        await client.query ('ROLLBACK');
        return res.status (400).json ({message: 'Unit tidak cukup'});
      }

      for (const u of unitRes.rows) {
        await client.query (
          `INSERT INTO peminjaman_unit (id_peminjaman, id_unit)
       VALUES ($1, $2)`,
          [id, u.id_unit]
        );

        await client.query (
          `UPDATE alat_unit SET status = 'dipinjam'
       WHERE id_unit = $1`,
          [u.id_unit]
        );
      }

      await client.query (
        'UPDATE alat SET stok = stok - $1 WHERE id_alat = $2',
        [peminjaman.jumlah, peminjaman.id_alat]
      );

      const io = req.app.get ('io');

      io.emit ('peminjaman_disetujui', {
        id_peminjaman: id,
      });
    }

    await client.query ('COMMIT');

    res.json ({
      message: status === 'disetujui'
        ? 'Peminjaman disetujui'
        : 'Peminjaman ditolak',
    });
  } catch (err) {
    await client.query ('ROLLBACK');
    console.error ('UPDATE STATUS ERROR:', err);
    res.status (500).json ({
      message: 'Gagal memproses peminjaman',
    });
  } finally {
    client.release ();
  }
};

exports.getPeminjamanAktifUser = async (req, res) => {
  const id_user = req.user.id_user;

  try {
    const result = await db.query (
      `
    SELECT id_alat, status
    FROM peminjaman
    WHERE id_user = $1
    AND status IN ('menunggu','disetujui','dipinjam')
      `,
      [id_user]
    );

    res.json ({
      data: result.rows,
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
