const express = require ('express');
const router = express.Router ();

const peminjamanController = require ('../controllers/peminjaman.controller');
const {
  verifyToken,
  isPeminjam,
  isPetugas,
  isAdmin,
} = require ('../middlewares/auth.middleware');

router.post (
  '/',
  verifyToken,
  isPeminjam,
  peminjamanController.createPeminjaman
);

router.get (
  '/saya',
  verifyToken,
  isPeminjam,
  peminjamanController.getMyPeminjaman
);

router.get('/history', verifyToken, isPeminjam, peminjamanController.getMyHistory);

router.get (
  '/',
  verifyToken,
  (req, res, next) => {
    if (req.user.role === 'petugas' || req.user.role === 'admin') {
      return next ();
    }
    return res.status (403).json ({message: 'Akses ditolak'});
  },
  peminjamanController.getAllPeminjaman
);

router.get (
  '/admin',
  verifyToken,
  isAdmin,
  peminjamanController.getAllPeminjamanAdmin
);

router.put (
  '/:id/tanggal',
  verifyToken,
  isAdmin,
  peminjamanController.updateTanggalPeminjaman
);

router.patch (
  '/:id/status',
  verifyToken,
  (req, res, next) => {
    if (req.user.role === 'petugas' || req.user.role === 'admin') {
      return next ();
    }
    return res.status (403).json ({message: 'Akses ditolak'});
  },
  peminjamanController.updateStatusPeminjaman
);

router.get (
  '/aktif',
  verifyToken,
  isPeminjam,
  peminjamanController.getPeminjamanAktifUser
);

router.get ('/:id/struk', verifyToken, peminjamanController.getStrukPeminjaman);

router.post (
  '/scan',
  verifyToken,
  (req, res, next) => {
    if (req.user.role === 'petugas' || req.user.role === 'admin') {
      return next ();
    }
    return res.status (403).json ({message: 'Akses ditolak'});
  },
  peminjamanController.scanQrPengambilan
);
module.exports = router;
