const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID do usuário é obrigatório']
  },
  plan: {
    type: String,
    enum: ['monthly', 'annual'],
    required: [true, 'Plano é obrigatório']
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending_payment', 'active', 'expired', 'cancelled'],
    default: 'pending_payment'
  },
  paymentId: {
    type: String,
    sparse: true
  },
  paymentReference: {
    type: String,
    sparse: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'cancelled'],
    default: 'pending'
  },
  checkoutUrl: {
    type: String
  }
}, {
  timestamps: true
});

// Método para verificar se a subscrição está válida
subscriptionSchema.methods.isValid = function() {
  return this.endDate > new Date() && this.status === 'active';
};

// Método para calcular dias restantes
subscriptionSchema.methods.daysRemaining = function() {
  const diff = this.endDate - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
