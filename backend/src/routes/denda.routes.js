const express = require ('express');
const router = express.Router ();
const dendaController = require ('../controllers/denda.controller');
const {
  verifyToken,
  isPeminjam,
  isAdminOrPetugas,
} = require ('../middlewares/auth.middleware');

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

router.post (
  '/proses-blokir',
  verifyToken,
  isAdminOrPetugas,
  dendaController.prosesBlokir
);

router.get ('/saya', verifyToken, isPeminjam, dendaController.getDendaSaya);

router.get ('/:id/struk', verifyToken, dendaController.getStrukPembayaran);

router.get ('/', verifyToken, isAdminOrPetugas, dendaController.getAllDenda);

router.post (
  '/:id/generate-tagihan',
  verifyToken,
  isAdminOrPetugas,
  dendaController.generateTagihan
);

router.post (
  '/:id/konfirmasi-bayar',
  verifyToken,
  isAdminOrPetugas,
  dendaController.konfirmasiPembayaran
);

router.put (
  '/:id/bayar',
  verifyToken,
  isAdminOrPetugas,
  dendaController.bayarDenda
);

module.exports = router;
