const mongoose = require('mongoose');
const Plan = require('./src/models/Plan');
require('dotenv').config();

const plans = [
  {
    title: 'Plano Mensal',
    description: 'Acesso completo por 30 dias',
    price: 500,
    features: [
      'Agendamento ilimitado',
      'Gestão de clientes',
      'Relatórios básicos',
      'Suporte por email'
    ],
    type: 'monthly',
    isActive: true
  },
  {
    title: 'Plano Trimestral',
    description: 'Acesso completo por 90 dias',
    price: 1350,
    features: [
      'Agendamento ilimitado',
      'Gestão de clientes',
      'Relatórios avançados',
      'Suporte prioritário',
      '15% de desconto'
    ],
    type: 'quarterly',
    isActive: true
  },
  {
    title: 'Plano Anual',
    description: 'Acesso completo por 365 dias',
    price: 4800,
    features: [
      'Agendamento ilimitado',
      'Gestão de clientes',
      'Relatórios avançados',
      'Suporte prioritário 24/7',
      'Backup automático',
      '20% de desconto'
    ],
    type: 'annual',
    isActive: true
  }
];

async function seedPlans() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Limpar planos existentes
    await Plan.deleteMany({});
    console.log('🗑️  Planos existentes removidos');

    // Inserir novos planos
    const createdPlans = await Plan.insertMany(plans);
    console.log(`✅ ${createdPlans.length} planos criados com sucesso:\n`);

    createdPlans.forEach(plan => {
      console.log(`📋 ${plan.title} (${plan.type})`);
      console.log(`   Preço: ${plan.price} MZN`);
      console.log(`   ID: ${plan._id}\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar planos:', error);
    process.exit(1);
  }
}

seedPlans();
