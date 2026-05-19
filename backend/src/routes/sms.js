const router = require('express').Router();
const { getLogs, send } = require('../controllers/smsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/',  authorize('ADMIN'), getLogs);
router.post('/', authorize('ADMIN', 'POLICE'), send);

module.exports = router;
