const router = require('express').Router();
const {
  getAllFines, getFineById, createFine, updateFine, deleteFine, getStats
} = require('../controllers/fineController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats', authorize('ADMIN'), getStats);
router.get('/',      getAllFines);
router.get('/:id',   getFineById);
router.post('/',     authorize('ADMIN', 'POLICE'), createFine);
router.put('/:id',   authorize('ADMIN', 'POLICE'), updateFine);
router.delete('/:id', authorize('ADMIN'), deleteFine);

module.exports = router;
