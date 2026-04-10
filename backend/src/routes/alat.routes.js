const express = require("express");
const router = express.Router();
const alatController = require("../controllers/alat.controller");
const { verifyToken, isAdmin, isPeminjam } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware")

router.get("/tersedia", verifyToken, isPeminjam, alatController.getAlatTersedia);
router.get(
  "/",
  verifyToken,
  isAdmin,
  alatController.getAllAlat
);
router.post(
  "/",
  verifyToken,
  isAdmin,
  upload.single("image"),
  alatController.createAlat
);
router.get("/:id", verifyToken, alatController.getAlatById);
router.get('/:id/unit', verifyToken, alatController.getUnitByAlat);
router.get("/:id", verifyToken, isAdmin, alatController.getAlatById);
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.single("image"),
  alatController.updateAlat
);
router.put('/:id/status', verifyToken, isAdmin, alatController.updateStatusAlat);
router.delete(
  "/:id",
  verifyToken,
  isAdmin,
  alatController.deleteAlat
);

module.exports = router;
