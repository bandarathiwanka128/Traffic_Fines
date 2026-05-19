const router = require('express').Router();
const { getAll, update, remove } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('ADMIN'));

router.get('/',       getAll);
router.put('/:id',    update);
router.delete('/:id', remove);

module.exports = router;
