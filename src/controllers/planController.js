const Plan = require('../models/Plan');

exports.getAllPlans = async (req, res) => {
  try {
    // Buscar todos os planos ativos
    const plans = await Plan.find({ isActive: true }).sort({ type: 1 });

    res.json({
      success: true,
      plans: plans.map(plan => ({
        id: plan._id,
        title: plan.title,
        description: plan.description,
        price: plan.price,
        features: plan.features,
        type: plan.type
      }))
    });
  } catch (error) {
    console.error('Error getting plans:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar planos de subscrição' 
    });
  }
};

exports.getPlanById = async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await Plan.findById(planId);

    if (!plan) {
      return res.status(404).json({ 
        success: false,
        message: 'Plano não encontrado' 
      });
    }

    res.json({
      success: true,
      plan: {
        id: plan._id,
        title: plan.title,
        description: plan.description,
        price: plan.price,
        features: plan.features,
        type: plan.type
      }
    });
  } catch (error) {
    console.error('Error getting plan:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao buscar plano' 
    });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const { title, description, price, features, type } = req.body;

    // Validações
    if (!title || !description || !price || !features || !type) {
      return res.status(400).json({ 
        success: false,
        message: 'Todos os campos são obrigatórios' 
      });
    }

    if (!['monthly', 'quarterly', 'annual'].includes(type)) {
      return res.status(400).json({ 
        success: false,
        message: 'Tipo de plano inválido. Use "monthly", "quarterly" ou "annual"' 
      });
    }

    if (!Array.isArray(features) || features.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Características devem ser uma lista não vazia' 
      });
    }

    // Criar o plano
    const newPlan = await Plan.create({
      title,
      description,
      price,
      features,
      type
    });

    res.status(201).json({
      success: true,
      message: 'Plano criado com sucesso',
      plan: {
        id: newPlan._id,
        title: newPlan.title,
        description: newPlan.description,
        price: newPlan.price,
        features: newPlan.features,
        type: newPlan.type
      }
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro ao criar plano',
      error: error.message 
    });
  }
};
