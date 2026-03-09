const express = require("express");
const router = express.Router();
const dendaController = require("../controllers/denda.controller");
const { verifyToken, isPetugas, isPeminjam } = require("../middlewares/auth.middleware");

router.get("/", verifyToken, isPetugas, dendaController.getAllDenda);
router.put("/:id/bayar", verifyToken, isPetugas, dendaController.bayarDenda);

router.get("/saya", verifyToken, isPeminjam, async (req, res) => {
  const db = require("../config/db");
  const id_user = req.user.id_user;

  const result = await db.query(`
    SELECT d.*
    FROM denda d
    JOIN pengembalian pg ON d.id_pengembalian = pg.id_pengembalian
    JOIN peminjaman p ON pg.id_peminjaman = p.id_peminjaman
    WHERE p.id_user = $1
    ORDER BY d.created_at DESC
  `, [id_user]);

  res.json(result.rows);
});

module.exports = router;
