const express = require ('express');
const router = express.Router ();

const kategoriController = require ('../controllers/kategori.controller');
const {verifyToken} = require ('../middlewares/auth.middleware'); 

router.post (
  '/',
  verifyToken,
  (req, res, next) => {
    if (['petugas', 'admin'].includes (req.user.role)) return next ();
    return res.status (403).json ({message: 'Akses ditolak'});
  },
  kategoriController.createKategori
);

router.get (
  '/',
  verifyToken,
  (req, res, next) => {
    if (['petugas', 'admin'].includes (req.user.role)) return next ();
    return res.status (403).json ({message: 'Akses ditolak'});
  },
  kategoriController.getAllKategori
);

router.get (
  '/:id',
  verifyToken,
  (req, res, next) => {
    if (['petugas', 'admin'].includes (req.user.role)) return next ();
    return res.status (403).json ({message: 'Akses ditolak'});
  },
  kategoriController.getKategoriById
);

router.put (
  '/:id',
  verifyToken,
  (req, res, next) => {
    if (['petugas', 'admin'].includes (req.user.role)) return next ();
    return res.status (403).json ({message: 'Akses ditolak'});
  },
  kategoriController.updateKategori
);

router.delete (
  '/:id',
  verifyToken,
  (req, res, next) => {
    if (['petugas', 'admin'].includes (req.user.role)) return next ();
    return res.status (403).json ({message: 'Akses ditolak'});
  },
  kategoriController.deleteKategori
);

module.exports = router;
