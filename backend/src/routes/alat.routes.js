const express = require('express');
const router = express.Router();

const alatController = require('../controllers/alat.controller');
const {
  verifyToken,
  isPeminjam,    
} = require('../middlewares/auth.middleware');

const upload = require('../middlewares/upload.middleware');

const isPetugasOrAdmin = (req, res, next) => {
  if (['petugas', 'admin'].includes(req.user?.role)) {
    return next();
  }
  return res.status(403).json({ 
    message: 'Akses ditolak. Hanya Petugas dan Admin yang diizinkan.' 
  });
};

const isAdminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') {
    return next();
  }
  return res.status(403).json({ 
    message: 'Akses ditolak. Hanya Admin yang diizinkan.' 
  });
};

router.get('/tersedia', verifyToken, isPeminjam, alatController.getAlatTersedia);

router.get('/', verifyToken, isPetugasOrAdmin, alatController.getAllAlat);

router.post(
  '/',
  verifyToken,
  isPetugasOrAdmin,
  upload.single('image'),
  alatController.createAlat
);

router.get('/:id/detail', verifyToken, isPeminjam, alatController.getAlatByIdForPeminjam);

router.get('/:id', verifyToken, isPetugasOrAdmin, alatController.getAlatById);

router.put(
  '/:id',
  verifyToken,
  isPetugasOrAdmin,
  upload.single('image'),
  alatController.updateAlat
);

router.put(
  '/:id/status',
  verifyToken,
  isPetugasOrAdmin,
  alatController.updateStatusAlat
);

router.put(
  '/unit/:id_unit/status',
  verifyToken,
  isPetugasOrAdmin,
  alatController.updateUnitStatus
);
router.get('/:id/unit', verifyToken, isPetugasOrAdmin, alatController.getUnitByAlat);

router.delete('/:id', verifyToken, isAdminOnly, alatController.deleteAlat);

router.post('/import', verifyToken, isAdminOnly, async (req, res) => {
  const { data } = req.body;

  if (!data || !Array.isArray(data)) {
    return res.status(400).json({ message: 'Data import harus berupa array' });
  }

  try {
    for (const item of data) {
      await db.query(
        `INSERT INTO alat (name, id_kategori, stok, merk, tipe_model, spesifikasi)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          item.name,
          item.id_kategori,
          item.stok,
          item.merk || null,
          item.tipe_model || null,
          item.spesifikasi || null,
        ]
      );
    }
    res.json({ message: 'Import data alat berhasil' });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ message: 'Gagal melakukan import data' });
  }
});

module.exports = router; 