const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const axios = require('axios');
const moment = require('moment');

// Configuração PaySuite
const PAYSUITE_BASE_URL = process.env.PAYSUITE_BASE_URL || 'https://paysuite.tech/api/v1';
const PAYSUITE_TOKEN = process.env.PAYSUITE_TOKEN;

exports.getSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Buscar subscrição ativa ou pendente (mais recente)
    const subscription = await Subscription.findOne({ 
      userId,
      status: { $in: ['active', 'pending_payment'] }
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(404).json({ 
        message: 'Nenhuma subscrição encontrada' 
      });
    }

    // Buscar informações do plano
    const planData = await Plan.findOne({ type: subscription.plan });

    res.json({
      subscription: {
        _id: subscription._id,
        plan: subscription.plan,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status
      },
      payment: {
        id: subscription.paymentId,
        reference: subscription.paymentReference,
        status: subscription.paymentStatus,
        checkoutUrl: subscription.checkoutUrl
      },
      planDetails: planData ? {
        title: planData.title,
        description: planData.description,
        price: planData.price,
        features: planData.features
      } : null,
      daysRemaining: subscription.daysRemaining(),
      isValid: subscription.isValid()
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    res.status(500).json({ 
      message: 'Erro ao buscar informações de subscrição',
      error: error.message 
    });
  }
};

exports.createSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { plan } = req.body;

    // Validar o plano
    if (!['monthly', 'quarterly', 'annual'].includes(plan)) {
      return res.status(400).json({ message: 'Plano inválido. Escolha "monthly", "quarterly" ou "annual"' });
    }

    // Verificar se já existe uma subscrição ativa ou pendente
    const existingSubscription = await Subscription.findOne({ 
      userId, 
      status: { $in: ['active', 'pending_payment'] }
    });

    if (existingSubscription) {
      // Se já está ativa, não pode criar outra
      if (existingSubscription.status === 'active') {
        return res.status(400).json({ 
          message: 'Usuário já possui uma subscrição ativa' 
        });
      }

      // Se está pending_payment, verificar status real no PaySuite
      if (existingSubscription.status === 'pending_payment' && existingSubscription.paymentId) {
        try {
          const paymentResponse = await axios.get(
            `${PAYSUITE_BASE_URL}/payments/${existingSubscription.paymentId}`,
            {
              headers: {
                'Authorization': `Bearer ${PAYSUITE_TOKEN}`,
                'Accept': 'application/json'
              }
            }
          );

          if (paymentResponse.data.status === 'success') {
            const paymentData = paymentResponse.data.data;
            
            // Se o pagamento foi concluído, ativar a subscrição
            if (paymentData.status === 'paid') {
              existingSubscription.status = 'active';
              existingSubscription.paymentStatus = 'paid';
              await existingSubscription.save();
              
              return res.status(200).json({ 
                message: 'Subscrição já foi paga e está ativa',
                subscription: {
                  _id: existingSubscription._id,
                  plan: existingSubscription.plan,
                  status: existingSubscription.status,
                  startDate: existingSubscription.startDate,
                  endDate: existingSubscription.endDate
                }
              });
            }
          }
        } catch (error) {
          console.log('Erro ao verificar pagamento anterior:', error.message);
          // Continuar para cancelar e criar novo
        }
      }

      // Se chegou aqui, o pagamento ainda está pendente - cancelar e criar novo
      existingSubscription.status = 'cancelled';
      await existingSubscription.save();
      console.log(`Subscrição anterior ${existingSubscription._id} cancelada para criar nova`);
    }

    // Buscar informações do plano
    const planData = await Plan.findOne({ type: plan, isActive: true });
    if (!planData) {
      return res.status(404).json({ message: 'Plano não encontrado' });
    }

    // Determinar datas
    const startDate = new Date();
    let endDate;
    switch(plan) {
      case 'monthly':
        endDate = moment().add(1, 'months').toDate();
        break;
      case 'quarterly':
        endDate = moment().add(3, 'months').toDate();
        break;
      case 'annual':
        endDate = moment().add(12, 'months').toDate();
        break;
    }

    // Gerar referência única para o pagamento (apenas alfanuméricos)
    const paymentReference = `SUB${userId}${Date.now()}`;

    // Criar a subscrição com status pending_payment
    const newSubscription = await Subscription.create({
      userId,
      plan,
      startDate,
      endDate,
      status: 'pending_payment',
      paymentReference
    });

    // Criar solicitação de pagamento no PaySuite
    try {
      const paymentResponse = await axios.post(
        `${PAYSUITE_BASE_URL}/payments`,
        {
          amount: planData.price.toString(),
          reference: paymentReference,
          description: `Subscrição ${planData.title}`,
          return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/success`,
          callback_url: `${process.env.API_URL || 'http://localhost:3000'}/api/subscriptions/payment-callback`
        },
        {
          headers: {
            'Authorization': `Bearer ${PAYSUITE_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      if (paymentResponse.data.status === 'success') {
        // Atualizar subscrição com dados do pagamento
        newSubscription.paymentId = paymentResponse.data.data.id;
        newSubscription.checkoutUrl = paymentResponse.data.data.checkout_url;
        await newSubscription.save();

        res.status(201).json({
          subscription: {
            _id: newSubscription._id,
            plan: newSubscription.plan,
            startDate: newSubscription.startDate,
            endDate: newSubscription.endDate,
            status: newSubscription.status
          },
          payment: {
            id: paymentResponse.data.data.id,
            amount: planData.price,
            reference: paymentReference,
            checkoutUrl: paymentResponse.data.data.checkout_url,
            status: paymentResponse.data.data.status
          },
          daysRemaining: newSubscription.daysRemaining(),
          isValid: newSubscription.isValid()
        });
      } else {
        throw new Error('Falha ao criar pagamento no PaySuite');
      }
    } catch (paymentError) {
      // Se falhar ao criar pagamento, deletar a subscrição
      await Subscription.deleteOne({ _id: newSubscription._id });
      
      console.error('PaySuite error:', paymentError.response?.data || paymentError.message);
      return res.status(500).json({ 
        message: 'Erro ao processar pagamento',
        error: paymentError.response?.data?.message || paymentError.message
      });
    }
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
      subscription: {
        _id: subscription._id,
        plan: subscription.plan,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status
      },
      daysRemaining: subscription.daysRemaining(),
      isValid: subscription.isValid()
    });
  } catch (error) {
    console.error('Error renewing subscription:', error);
    res.status(500).json({ message: 'Erro ao renovar subscrição' });
  }
};

// Callback do PaySuite para confirmar pagamento
exports.paymentCallback = async (req, res) => {
  try {
    const { id, status, reference, transaction } = req.body;

    console.log('PaySuite callback received:', req.body);

    // Buscar subscrição pela referência do pagamento
    const subscription = await Subscription.findOne({ paymentReference: reference });

    if (!subscription) {
      console.error('Subscription not found for reference:', reference);
      return res.status(404).json({ 
        status: 'error',
        message: 'Subscrição não encontrada' 
      });
    }

    // Atualizar status do pagamento
    subscription.paymentStatus = status;

    if (status === 'paid') {
      // Ativar subscrição quando pagamento for confirmado
      subscription.status = 'active';
      console.log(`Subscription ${subscription._id} activated after payment`);
    } else if (status === 'failed' || status === 'cancelled') {
      // Cancelar subscrição se pagamento falhou
      subscription.status = 'cancelled';
      console.log(`Subscription ${subscription._id} cancelled due to payment ${status}`);
    }

    await subscription.save();

    res.json({
      status: 'success',
      message: 'Callback processado com sucesso'
    });
  } catch (error) {
    console.error('Error processing payment callback:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Erro ao processar callback de pagamento' 
    });
  }
};

// Verificar status do pagamento no PaySuite
exports.checkPaymentStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subscriptionId } = req.params;

    // Buscar subscrição
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      userId
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscrição não encontrada' });
    }

    if (!subscription.paymentId) {
      return res.status(400).json({ message: 'Nenhum pagamento associado a esta subscrição' });
    }

    try {
      // Consultar status no PaySuite
      const paymentResponse = await axios.get(
        `${PAYSUITE_BASE_URL}/payments/${subscription.paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${PAYSUITE_TOKEN}`,
            'Accept': 'application/json'
          }
        }
      );

      if (paymentResponse.data.status === 'success') {
        const paymentData = paymentResponse.data.data;
        
        // Atualizar status local se mudou
        if (paymentData.status !== subscription.paymentStatus) {
          subscription.paymentStatus = paymentData.status;
          
          if (paymentData.status === 'paid' && subscription.status === 'pending_payment') {
            subscription.status = 'active';
          }
          
          await subscription.save();
        }

        res.json({
          subscription: {
            _id: subscription._id,
            plan: subscription.plan,
            status: subscription.status,
            paymentStatus: subscription.paymentStatus
          },
          payment: {
            id: paymentData.id,
            amount: paymentData.amount,
            reference: paymentData.reference,
            status: paymentData.status,
            transaction: paymentData.transaction
          }
        });
      } else {
        throw new Error('Falha ao consultar pagamento');
      }
    } catch (error) {
      console.error('Error checking payment status:', error.response?.data || error.message);
      res.status(500).json({
        message: 'Erro ao verificar status do pagamento',
        error: error.response?.data?.message || error.message
      });
    }
  } catch (error) {
    console.error('Error in checkPaymentStatus:', error);
    res.status(500).json({
      message: 'Erro ao processar requisição',
      error: error.message
    });
  }
};