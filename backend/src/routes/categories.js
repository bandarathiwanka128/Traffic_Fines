const router = require('express').Router();
const { getAll, create, update, remove } = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/',       getAll);
router.post('/',      authorize('ADMIN'), create);
router.put('/:id',    authorize('ADMIN'), update);
router.delete('/:id', authorize('ADMIN'), remove);

module.exports = router;
