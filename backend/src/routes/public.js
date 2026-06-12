const router = require('express').Router();
const { lookupFine, getPublicCategories } = require('../controllers/publicController');
const { createCheckoutSession, getCheckoutStatus } = require('../controllers/paymentController');

router.get('/categories', getPublicCategories);
router.post('/fines/lookup', lookupFine);
router.post('/payments/checkout', createCheckoutSession);
router.get('/payments/session/:sessionId', getCheckoutStatus);

module.exports = router;
