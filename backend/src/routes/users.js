const router = require('express').Router();
const { getAllUsers, updateUser, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/', getAllUsers);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
