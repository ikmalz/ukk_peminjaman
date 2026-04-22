const express = require("express");
const router = express.Router();

const pengembalianController = require("../controllers/pengembalian.controller");
const { verifyToken, isPeminjam, isPetugas, isAdmin, isAdminOrPetugas } = require("../middlewares/auth.middleware");   

router.post("/", verifyToken, isPeminjam, pengembalianController.createPengembalian);

router.get("/", verifyToken, isAdminOrPetugas, pengembalianController.getAllPengembalian);

router.patch("/:id/verifikasi", verifyToken, isAdminOrPetugas, 
  pengembalianController.verifikasiPengembalian);

router.get("/admin", verifyToken, isAdmin, pengembalianController.getAllPengembalianAdmin);
router.put("/:id/tanggal", verifyToken, isAdmin, pengembalianController.updateTanggalPengembalian);

module.exports = router;