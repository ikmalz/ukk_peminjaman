const express = require("express");
const router = express.Router();

const peminjamanController = require("../controllers/peminjaman.controller");
const { verifyToken, isPeminjam, isPetugas } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, isPeminjam, peminjamanController.createPeminjaman);
router.get("/saya", verifyToken, isPeminjam, peminjamanController.getMyPeminjaman);

router.get("/", verifyToken, isPetugas, peminjamanController.getAllPeminjaman);
router.patch("/:id/status", verifyToken, isPetugas, peminjamanController.updateStatusPeminjaman);

router.get("/aktif", verifyToken, isPeminjam, peminjamanController.getPeminjamanAktifUser);
// router.get('/peminjaman/:id/unit', peminjamanController.getDetailUnitPeminjaman)
router.get("/:id/struk", verifyToken, peminjamanController.getStrukPeminjaman);
router.post("/scan", verifyToken, isPetugas, peminjamanController.scanQrPengambilan);

module.exports = router;
