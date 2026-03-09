const express = require("express");
const router = express.Router();

const pengembalianController = require("../controllers/pengembalian.controller");
const { verifyToken, isPeminjam, isPetugas } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, isPeminjam, pengembalianController.createPengembalian);
router.get("/", verifyToken, isPetugas, pengembalianController.getAllPengembalian);
router.post("/:id/verifikasi", verifyToken, isPetugas, pengembalianController.verifikasiPengembalian);
router.patch("/:id/verifikasi", verifyToken, isPetugas, pengembalianController.verifikasiPengembalian);

module.exports = router;
