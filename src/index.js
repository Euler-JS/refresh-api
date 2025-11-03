const dotenv = require('dotenv');

// Configuração
dotenv.config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const userRoutes = require('./routes/userRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

// Conectar ao MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;
console.log(`Server will start on port: ${PORT}`);

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/users', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Rota de status
app.get('/api/status', (req, res) => {
  res.json({ status: 'API is running' });
});

// Handler para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});