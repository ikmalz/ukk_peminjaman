const express = require ('express');
const router = express.Router ();
const dendaController = require ('../controllers/denda.controller');
const {
  verifyToken,
  isPeminjam,
  isAdminOrPetugas, 
} = require ('../middlewares/auth.middleware');

router.get ('/', verifyToken, isAdminOrPetugas, dendaController.getAllDenda);
router.put (
  '/:id/bayar',
  verifyToken,
  isAdminOrPetugas,
  dendaController.bayarDenda
);

router.get (
  '/konfigurasi',
  verifyToken,
  isAdminOrPetugas,
  dendaController.getKonfigurasiDenda
);
router.put (
  '/konfigurasi',
  verifyToken,
  isAdminOrPetugas,
  dendaController.updateKonfigurasiDenda
);

router.get ('/saya', verifyToken, isPeminjam, async (req, res) => {
  const db = require ('../config/db');
  const id_user = req.user.id_user;

  try {
    const result = await db.query (
      `
      SELECT 
        d.id_denda, d.total_denda, d.hari_terlambat, d.status_bayar, d.created_at,
        a.name AS alat, pg.kondisi_laporan
      FROM denda d
      JOIN pengembalian pg ON d.id_pengembalian = pg.id_pengembalian
      JOIN peminjaman p ON pg.id_peminjaman = p.id_peminjaman
      JOIN alat a ON p.id_alat = a.id_alat
      WHERE p.id_user = $1
      ORDER BY d.created_at DESC
    `,
      [id_user]
    );

    res.json ({data: result.rows});
  } catch (err) {
    console.error (err);
    res.status (500).json ({message: 'Gagal mengambil data denda saya'});
  }
});

module.exports = router;
