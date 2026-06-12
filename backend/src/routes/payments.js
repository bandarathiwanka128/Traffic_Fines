const router = require('express').Router();
const { getAll, getByFine, confirmManualPayment } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/',                 authorize('ADMIN'), getAll);
router.get('/fine/:fineId',     getByFine);
router.post('/confirm',         authorize('ADMIN'), confirmManualPayment);

module.exports = router;
