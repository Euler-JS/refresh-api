const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Título do plano é obrigatório']
  },
  description: {
    type: String,
    required: [true, 'Descrição do plano é obrigatória']
  },
  price: {
    type: Number,
    required: [true, 'Preço do plano é obrigatório']
  },
  features: {
    type: [String],
    required: [true, 'Características do plano são obrigatórias']
  },
  type: {
    type: String,
    enum: ['monthly', 'quarterly', 'annual'],
    required: [true, 'Tipo do plano é obrigatório']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Plan', planSchema);
