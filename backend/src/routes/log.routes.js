const express = require("express");
const router = express.Router();
const logController = require("../controllers/log.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

router.get("/", verifyToken, isAdmin, logController.getAllLog);

module.exports = router;
