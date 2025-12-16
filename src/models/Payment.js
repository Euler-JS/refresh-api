const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paysuiteId: {
    type: String,
    required: [true, 'ID do PaySuite é obrigatório'],
    unique: true
  },
  amount: {
    type: Number,
    required: [true, 'Valor é obrigatório'],
    min: [0, 'Valor deve ser positivo']
  },
  method: {
    type: String,
    enum: ['credit_card', 'mpesa', 'emola'],
    required: [true, 'Método de pagamento é obrigatório']
  },
  reference: {
    type: String,
    required: [true, 'Referência é obrigatória'],
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed', 'cancelled'],
    default: 'pending'
  },
  checkoutUrl: {
    type: String,
    required: [true, 'URL de checkout é obrigatória']
  },
  returnUrl: {
    type: String
  },
  callbackUrl: {
    type: String
  },
  transactionId: {
    type: String
  },
  paidAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Índices para melhor performance
paymentSchema.index({ paysuiteId: 1 });
paymentSchema.index({ reference: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
