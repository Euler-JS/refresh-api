const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const Plan = require('./src/models/Plan');

const plans = [
  {
    title: "Plano Mensal",
    description: "Perfeito para testar o aplicativo",
    price: 230.0,
    features: [
      "Acesso a todas as funcionalidades",
      "Suporte técnico por email",
      "Atualizações gratuitas"
    ],
    type: "monthly"
  },
  {
    title: "Plano Anual",
    description: "Ideal para uso contínuo, com desconto",
    price: 990.0,
    features: [
      "Acesso a todas as funcionalidades",
      "Suporte técnico prioritário",
      "Atualizações gratuitas",
      "2 meses grátis em comparação ao plano mensal"
    ],
    type: "annual"
  }
];

const seedPlans = async () => {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Limpar planos existentes
    await Plan.deleteMany({});
    console.log('🗑️  Planos antigos removidos');

    // Inserir novos planos
    const createdPlans = await Plan.insertMany(plans);
    console.log('✅ Planos criados com sucesso:');
    
    createdPlans.forEach(plan => {
      console.log(`   - ${plan.title} (${plan.type}) - MZN ${plan.price}`);
    });

    console.log('\n📊 Total de planos criados:', createdPlans.length);

    // Desconectar
    await mongoose.disconnect();
    console.log('✅ Desconectado do MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao popular planos:', error);
    process.exit(1);
  }
};

seedPlans();
