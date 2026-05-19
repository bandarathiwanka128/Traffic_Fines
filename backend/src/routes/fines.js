const router = require('express').Router();
const {
  getAllFines, getFineById, createFine, updateFine, payFine, deleteFine, getStats
} = require('../controllers/fineController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats', authorize('admin'), getStats);
router.get('/', getAllFines);
router.get('/:id', getFineById);
router.post('/', authorize('admin', 'officer'), createFine);
router.put('/:id', authorize('admin', 'officer'), updateFine);
router.patch('/:id/pay', payFine);
router.delete('/:id', authorize('admin'), deleteFine);

module.exports = router;
