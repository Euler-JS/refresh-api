const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middlewares/auth');

// Criar uma solicitação de pagamento
router.post('/request', auth, paymentController.createPaymentRequest);

// Obter status de uma solicitação de pagamento
router.get('/request/:reference', auth, paymentController.getPaymentRequest);

// Criar pagamento para assinatura
router.post('/subscription', auth, paymentController.createSubscriptionPayment);

// Callback do PaySuite (não requer autenticação)
router.post('/callback', paymentController.paymentCallback);

// Obter pagamentos do usuário (opcional - para histórico)
router.get('/history', auth, async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const payments = await Payment.find({}).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico de pagamentos',
      error: error.message
    });
  }
});

module.exports = router;
