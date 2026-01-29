const express = require("express");
const router = express.Router();

const alatController = require("../controllers/alat.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, isAdmin, alatController.createAlat);
router.get("/", verifyToken, isAdmin, alatController.getAllAlat);
router.get("/:id", verifyToken, isAdmin, alatController.getAlatById);
router.put("/:id", verifyToken, isAdmin, alatController.updateAlat);
router.patch("/:id/status", verifyToken, isAdmin, alatController.updateStatusAlat);

module.exports = router;
