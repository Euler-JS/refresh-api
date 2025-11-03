const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Por favor, informe um nome de usuário'],
    trim: true,
    minlength: [3, 'Nome de usuário deve ter pelo menos 3 caracteres']
  },
  email: {
    type: String,
    required: [true, 'Por favor, informe um email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor, informe um email válido']
  },
  password: {
    type: String,
    required: [true, 'Por favor, informe uma senha'],
    minlength: [6, 'Senha deve ter pelo menos 6 caracteres']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true // Adiciona createdAt e updatedAt automaticamente
});

// Método para remover a senha ao retornar o objeto
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
