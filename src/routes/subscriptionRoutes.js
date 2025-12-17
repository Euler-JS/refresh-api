const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const auth = require('../middlewares/auth');

const router = express.Router();

router.get('/', auth, subscriptionController.getSubscription);
router.post('/', auth, subscriptionController.createSubscription);
router.patch('/:subscriptionId/renew', auth, subscriptionController.renewSubscription);

// Verificar status do pagamento
router.get('/:subscriptionId/payment-status', auth, subscriptionController.checkPaymentStatus);

// Callback do PaySuite (não requer autenticação)
router.post('/payment-callback', subscriptionController.paymentCallback);

module.exports = router;