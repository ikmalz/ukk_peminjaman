const express = require("express");
const router = express.Router();

const kategoriController = require("../controllers/kategori.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, isAdmin, kategoriController.createKategori);
router.get("/", verifyToken, isAdmin, kategoriController.getAllKategori);
router.get("/:id", verifyToken, isAdmin, kategoriController.getKategoriById);
router.put("/:id", verifyToken, isAdmin, kategoriController.updateKategori);
router.delete("/:id", verifyToken, isAdmin, kategoriController.deleteKategori);

module.exports = router;
