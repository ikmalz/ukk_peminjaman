const express = require("express");
const router = express.Router();
const logController = require("../controllers/log.controller");
const { verifyToken, isPetugas } = require("../middlewares/auth.middleware");

router.get("/", verifyToken, isPetugas, logController.getAllLog);

module.exports = router;
