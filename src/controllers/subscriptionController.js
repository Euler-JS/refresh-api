const Subscription = require('../models/Subscription');
const moment = require('moment');

exports.getSubscription = async (req, res) => {
  try {
    const userId = req.user.userId; // Obtido do middleware de autenticação

    // Buscar a subscrição ativa do usuário
    const subscription = await Subscription.findOne({ 
      userId, 
      status: 'active' 
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Nenhuma subscrição encontrada' });
    }

    res.json({
      subscription: {
        _id: subscription._id,
        plan: subscription.plan,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
        userId: subscription.userId
      },
      isValid: subscription.isValid(),
      daysRemaining: subscription.daysRemaining()
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    res.status(500).json({ message: 'Erro ao buscar informações de subscrição' });
  }
};

exports.createSubscription = async (req, res) => {
  try {
    const userId = req.user.userId; // Obtido do middleware de autenticação
    const { plan } = req.body;

    // Validar o plano
    if (!['monthly', 'annual'].includes(plan)) {
      return res.status(400).json({ message: 'Plano inválido. Escolha "monthly" ou "annual"' });
    }

    // Verificar se já existe uma subscrição ativa
    const existingSubscription = await Subscription.findOne({ 
      userId, 
      status: 'active' 
    });

    if (existingSubscription) {
      return res.status(400).json({ message: 'Usuário já possui uma subscrição ativa' });
    }

    // Determinar a data de término baseada no plano escolhido
    const startDate = new Date();
    const endDate = moment().add(plan === 'monthly' ? 1 : 12, 'months').toDate();

    // Criar a nova subscrição
    const newSubscription = await Subscription.create({
      userId,
      plan,
      startDate,
      endDate
    });

    res.status(201).json({
      message: 'Subscrição criada com sucesso',
      subscription: {
        _id: newSubscription._id,
        plan: newSubscription.plan,
        startDate: newSubscription.startDate,
        endDate: newSubscription.endDate,
        status: newSubscription.status,
        userId: newSubscription.userId
      },
      isValid: newSubscription.isValid(),
      daysRemaining: newSubscription.daysRemaining()
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ 
      message: 'Erro ao criar subscrição',
      error: error.message 
    });
  }
};

exports.renewSubscription = async (req, res) => {
  try {
    const userId = req.user.userId; // Obtido do middleware de autenticação
    const { subscriptionId } = req.params;

    // Verificar se a subscrição existe e pertence ao usuário
    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscrição não encontrada' });
    }

    if (subscription.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Acesso não autorizado a esta subscrição' });
    }

    // Calcular nova data de término
    const currentEndDate = subscription.endDate;
    const monthsToAdd = subscription.plan === 'monthly' ? 1 : 12;
    const newEndDate = moment(currentEndDate).add(monthsToAdd, 'months').toDate();

    // Atualizar a subscrição
    subscription.endDate = newEndDate;
    subscription.status = 'active';
    await subscription.save();

    res.json({
      message: 'Subscrição renovada com sucesso',
      subscription: {
        _id: subscription._id,
        plan: subscription.plan,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
        userId: subscription.userId
      },
      isValid: subscription.isValid(),
      daysRemaining: subscription.daysRemaining()
    });
  } catch (error) {
    console.error('Error renewing subscription:', error);
    res.status(500).json({ message: 'Erro ao renovar subscrição' });
  }
};