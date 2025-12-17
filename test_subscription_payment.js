#!/usr/bin/env node

/**
 * Script de teste para o fluxo de subscrição com pagamento
 * Execute: node test_subscription_payment.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = ''; // Será preenchido após login

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 1. Login (ou registro)
async function loginUser() {
  try {
    log('\n📝 1. Fazendo login...', 'blue');
    
    const response = await axios.post(`${BASE_URL}/users/login`, {
      email: 'teste@exemplo.com',
      password: 'senha123'
    });

    authToken = response.data.token;
    log('✅ Login realizado com sucesso', 'green');
    log(`Token: ${authToken.substring(0, 20)}...`, 'yellow');
    return true;
  } catch (error) {
    if (error.response?.status === 401) {
      log('⚠️  Usuário não existe, criando novo usuário...', 'yellow');
      return registerUser();
    }
    log('❌ Erro no login: ' + error.message, 'red');
    return false;
  }
}

// Registrar usuário se não existir
async function registerUser() {
  try {
    const response = await axios.post(`${BASE_URL}/users/register`, {
      name: 'Usuário Teste',
      email: 'teste@exemplo.com',
      password: 'senha123'
    });

    authToken = response.data.token;
    log('✅ Usuário criado com sucesso', 'green');
    return true;
  } catch (error) {
    log('❌ Erro ao criar usuário: ' + (error.response?.data?.message || error.message), 'red');
    return false;
  }
}

// 2. Listar planos disponíveis
async function listPlans() {
  try {
    log('\n📋 2. Listando planos disponíveis...', 'blue');
    
    const response = await axios.get(`${BASE_URL}/plans`);
    
    log('✅ Planos encontrados:', 'green');
    response.data.plans.forEach(plan => {
      log(`   - ${plan.title}: ${plan.price} MZN (${plan.type})`, 'yellow');
    });
    
    return response.data.plans;
  } catch (error) {
    log('❌ Erro ao listar planos: ' + error.message, 'red');
    return [];
  }
}

// 3. Criar subscrição com pagamento
async function createSubscriptionWithPayment() {
  try {
    log('\n💳 3. Criando subscrição com pagamento...', 'blue');
    
    const response = await axios.post(
      `${BASE_URL}/subscriptions`,
      { plan: 'monthly' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    log('✅ Subscrição criada com sucesso', 'green');
    log('📄 Detalhes da subscrição:', 'yellow');
    log(`   ID: ${response.data.subscription._id}`, 'yellow');
    log(`   Plano: ${response.data.subscription.plan}`, 'yellow');
    log(`   Status: ${response.data.subscription.status}`, 'yellow');
    
    log('\n💰 Detalhes do pagamento:', 'yellow');
    log(`   ID: ${response.data.payment.id}`, 'yellow');
    log(`   Valor: ${response.data.payment.amount} MZN`, 'yellow');
    log(`   Referência: ${response.data.payment.reference}`, 'yellow');
    log(`   Status: ${response.data.payment.status}`, 'yellow');
    log(`   URL de Checkout: ${response.data.payment.checkoutUrl}`, 'yellow');
    
    log('\n🌐 Próximo passo: Acesse a URL de checkout para completar o pagamento', 'blue');
    
    return response.data;
  } catch (error) {
    log('❌ Erro ao criar subscrição: ' + (error.response?.data?.message || error.message), 'red');
    if (error.response?.data?.error) {
      log('   Detalhes: ' + error.response.data.error, 'red');
    }
    return null;
  }
}

// 4. Verificar status da subscrição
async function checkSubscriptionStatus() {
  try {
    log('\n🔍 4. Verificando status da subscrição...', 'blue');
    
    const response = await axios.get(
      `${BASE_URL}/subscriptions`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    log('✅ Status obtido:', 'green');
    log(`   Status: ${response.data.subscription.status}`, 'yellow');
    log(`   Dias restantes: ${response.data.daysRemaining}`, 'yellow');
    log(`   Válida: ${response.data.isValid}`, 'yellow');
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      log('⚠️  Nenhuma subscrição encontrada', 'yellow');
    } else {
      log('❌ Erro ao verificar status: ' + error.message, 'red');
    }
    return null;
  }
}

// 5. Verificar status do pagamento
async function checkPaymentStatus(subscriptionId) {
  try {
    log(`\n💳 5. Verificando status do pagamento...`, 'blue');
    
    const response = await axios.get(
      `${BASE_URL}/subscriptions/${subscriptionId}/payment-status`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    log('✅ Status do pagamento:', 'green');
    log(`   Status Subscrição: ${response.data.subscription.status}`, 'yellow');
    log(`   Status Pagamento: ${response.data.payment.status}`, 'yellow');
    
    if (response.data.payment.transaction) {
      log('   Transação:', 'yellow');
      log(`     ID: ${response.data.payment.transaction.transaction_id}`, 'yellow');
      log(`     Pago em: ${response.data.payment.transaction.paid_at}`, 'yellow');
    }
    
    return response.data;
  } catch (error) {
    log('❌ Erro ao verificar pagamento: ' + (error.response?.data?.message || error.message), 'red');
    return null;
  }
}

// 6. Simular callback do PaySuite (apenas para testes)
async function simulatePaymentCallback(reference) {
  try {
    log('\n🔔 6. Simulando callback do PaySuite...', 'blue');
    log('⚠️  Isso só deve ser usado em ambiente de desenvolvimento!', 'yellow');
    
    const response = await axios.post(
      `${BASE_URL}/subscriptions/payment-callback`,
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        status: 'paid',
        reference: reference,
        transaction: {
          id: 1,
          status: 'completed',
          transaction_id: 'TEST123456',
          paid_at: new Date().toISOString()
        }
      }
    );

    log('✅ Callback processado:', 'green');
    log(`   Status: ${response.data.status}`, 'yellow');
    log(`   Mensagem: ${response.data.message}`, 'yellow');
    
    return response.data;
  } catch (error) {
    log('❌ Erro ao simular callback: ' + error.message, 'red');
    return null;
  }
}

// Executar todos os testes
async function runAllTests() {
  log('🚀 Iniciando testes de subscrição com pagamento', 'blue');
  log('=' .repeat(60), 'blue');

  // 1. Login
  const loginSuccess = await loginUser();
  if (!loginSuccess) {
    log('\n❌ Testes interrompidos: falha no login', 'red');
    return;
  }

  // 2. Listar planos
  await listPlans();

  // 3. Criar subscrição com pagamento
  const subscriptionData = await createSubscriptionWithPayment();
  if (!subscriptionData) {
    log('\n❌ Testes interrompidos: falha ao criar subscrição', 'red');
    return;
  }

  const subscriptionId = subscriptionData.subscription._id;
  const paymentReference = subscriptionData.payment.reference;

  // Aguardar 2 segundos
  log('\n⏳ Aguardando 2 segundos...', 'blue');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 4. Verificar status da subscrição
  await checkSubscriptionStatus();

  // 5. Verificar status do pagamento
  await checkPaymentStatus(subscriptionId);

  // 6. Simular callback (opcional)
  log('\n❓ Deseja simular o callback de pagamento? (Apenas para testes)', 'yellow');
  log('   Isso ativará a subscrição automaticamente.', 'yellow');
  
  // Em ambiente real, remova isso e aguarde o callback real do PaySuite
  await simulatePaymentCallback(paymentReference);

  // Aguardar 1 segundo
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Verificar status final
  log('\n🔍 Verificando status final...', 'blue');
  await checkSubscriptionStatus();

  log('\n' + '='.repeat(60), 'blue');
  log('✅ Testes concluídos!', 'green');
  log('\n📝 Notas:', 'blue');
  log('   - Em produção, remova a simulação de callback', 'yellow');
  log('   - O PaySuite enviará callbacks reais automaticamente', 'yellow');
  log('   - Use ngrok para expor a API localmente durante testes', 'yellow');
}

// Executar
if (require.main === module) {
  runAllTests().catch(error => {
    log('\n❌ Erro fatal: ' + error.message, 'red');
    process.exit(1);
  });
}

module.exports = {
  loginUser,
  listPlans,
  createSubscriptionWithPayment,
  checkSubscriptionStatus,
  checkPaymentStatus,
  simulatePaymentCallback
};
