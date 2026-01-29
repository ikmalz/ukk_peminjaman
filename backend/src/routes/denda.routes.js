const express = require("express");
const router = express.Router();
const dendaController = require("../controllers/denda.controller");
const { verifyToken, isPetugas, isPeminjam } = require("../middlewares/auth.middleware");

router.get("/", verifyToken, isPetugas, dendaController.getAllDenda);
router.get("/pengembalian/:id", verifyToken, dendaController.getByPengembalian);
router.put("/:id/bayar", verifyToken, isPetugas, dendaController.bayarDenda);

module.exports = router;
