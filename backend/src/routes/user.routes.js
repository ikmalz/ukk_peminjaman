const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");

router.post("/", verifyToken, isAdmin, userController.createUser);
router.get("/", verifyToken, isAdmin, userController.getAllUsers);
router.get("/:id", verifyToken, isAdmin, userController.getUserById);
router.put("/:id", verifyToken, isAdmin, userController.updateUser);
router.patch("/:id/status", verifyToken, isAdmin, userController.updateStatusUser);

module.exports = router;
