// Teste dos endpoints de pagamento
// Execute este arquivo com: node test_payments.js

const axios = require('axios');

// Configurações
const BASE_URL = 'http://localhost:3000/api';
const TEST_TOKEN = 'seu_token_jwt_aqui'; // Substitua pelo token real

// Headers de autenticação
const headers = {
  'Authorization': `Bearer ${TEST_TOKEN}`,
  'Content-Type': 'application/json'
};

// Teste 1: Criar solicitação de pagamento
async function testCreatePaymentRequest() {
  try {
    console.log('🧪 Testando criação de solicitação de pagamento...');

    const response = await axios.post(`${BASE_URL}/payments/request`, {
      amount: 100.00,
      method: 'credit_card',
      reference: `TEST-${Date.now()}`,
      description: 'Teste de pagamento',
      returnUrl: 'https://seusite.com/success',
      callbackUrl: 'http://localhost:3000/api/payments/callback'
    }, { headers });

    console.log('✅ Solicitação criada:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ Erro ao criar solicitação:', error.response?.data || error.message);
  }
}

// Teste 2: Obter status de pagamento
async function testGetPaymentStatus(reference) {
  try {
    console.log('🧪 Testando obtenção de status...');

    const response = await axios.get(`${BASE_URL}/payments/request/${reference}`, { headers });

    console.log('✅ Status obtido:', response.data);
  } catch (error) {
    console.error('❌ Erro ao obter status:', error.response?.data || error.message);
  }
}

// Teste 3: Simular callback do PaySuite
async function testPaymentCallback(paymentData) {
  try {
    console.log('🧪 Testando callback...');

    const callbackData = {
      paysuiteId: paymentData.paysuiteId,
      status: 'paid',
      transactionId: `txn_${Date.now()}`,
      paidAt: new Date().toISOString()
    };

    const response = await axios.post(`${BASE_URL}/payments/callback`, callbackData);

    console.log('✅ Callback processado:', response.data);
  } catch (error) {
    console.error('❌ Erro no callback:', error.response?.data || error.message);
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 Iniciando testes de pagamento...\n');

  // Teste 1
  const paymentData = await testCreatePaymentRequest();
  console.log('');

  if (paymentData) {
    // Teste 2
    await testGetPaymentStatus(paymentData.reference);
    console.log('');

    // Teste 3
    await testPaymentCallback(paymentData);
    console.log('');
  }

  console.log('🏁 Testes concluídos!');
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testCreatePaymentRequest, testGetPaymentStatus, testPaymentCallback };
