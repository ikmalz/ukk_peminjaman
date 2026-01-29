const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

router.post("/login", authController.login);
router.get("/users", verifyToken, isAdmin, (req, res) => {
  res.json({ message: "Hanya admin bisa akses ini" });
});


module.exports = router