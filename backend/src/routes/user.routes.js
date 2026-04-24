const express = require ('express');
const router = express.Router ();
const userController = require ('../controllers/user.controller');
const {verifyToken, isAdmin} = require ('../middlewares/auth.middleware');

router.post ('/', verifyToken, isAdmin, userController.createUser);
router.get ('/', verifyToken, isAdmin, userController.getAllUsers);
router.get('/pending', verifyToken, isAdmin, userController.getPendingUsers)
router.get ('/:id', verifyToken, isAdmin, userController.getUserById);
router.patch('/:id/activate', verifyToken, isAdmin, userController.activateUser)
router.delete('/:id/reject', verifyToken, isAdmin, userController.rejectUser)
router.put ('/:id', verifyToken, isAdmin, userController.updateUser);
router.put (
  '/:id/status',
  verifyToken,
  isAdmin,
  userController.updateStatusUser
);
router.put (
  '/:id/reset-password',
  verifyToken,
  isAdmin,
  userController.resetPassword
);
router.delete ('/:id', verifyToken, isAdmin, userController.deleteUser);

module.exports = router;
