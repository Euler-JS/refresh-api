const axios = require('axios');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');

// Configuração do PaySuite
const PAYSUITE_BASE_URL = 'https://paysuite.tech/api/v1';
const PAYSUITE_TOKEN = process.env.PAYSUITE_TOKEN;

exports.createPaymentRequest = async (req, res) => {
  try {
    const { amount, method, reference, description, return_url, callback_url } = req.body;

    // Validações
    if (!amount || !reference) {
      return res.status(400).json({
        success: false,
        message: 'Amount e reference são obrigatórios'
      });
    }

    // Criar pedido de pagamento no PaySuite
    const paysuiteResponse = await axios.post(`${PAYSUITE_BASE_URL}/payments`, {
      amount: parseFloat(amount),
      method: method || 'mpesa',
      reference: reference,
      description: description || 'Pagamento via API',
      return_url: return_url,
      callback_url: callback_url
    }, {
      headers: {
        'Authorization': `Bearer ${PAYSUITE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const paymentData = paysuiteResponse.data.data;

    // Salvar informações do pagamento localmente
    const localPayment = await Payment.create({
      paysuiteId: paymentData.id,
      amount: paymentData.amount,
      method: paymentData.method,
      reference: paymentData.reference,
      description: paymentData.description,
      status: paymentData.status || 'pending',
      checkoutUrl: paymentData.checkout_url,
      returnUrl: paymentData.return_url,
      callbackUrl: paymentData.callback_url
    });

    res.status(201).json({
      success: true,
      message: 'Pedido de pagamento criado com sucesso',
      payment: {
        id: localPayment._id,
        paysuiteId: localPayment.paysuiteId,
        amount: localPayment.amount,
        method: localPayment.method,
        reference: localPayment.reference,
        status: localPayment.status,
        checkoutUrl: localPayment.checkoutUrl,
        createdAt: localPayment.createdAt
      }
    });

  } catch (error) {
    console.error('Erro ao criar pedido de pagamento:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar pedido de pagamento',
      error: error.response?.data?.message || error.message
    });
  }
};

exports.getPaymentRequest = async (req, res) => {
  try {
    const { uuid } = req.params;

    // Buscar informações locais primeiro
    const localPayment = await Payment.findOne({ paysuiteId: uuid });

    if (!localPayment) {
      return res.status(404).json({
        success: false,
        message: 'Pagamento não encontrado'
      });
    }

    // Buscar status atualizado no PaySuite
    try {
      const paysuiteResponse = await axios.get(`${PAYSUITE_BASE_URL}/payments/${uuid}`, {
        headers: {
          'Authorization': `Bearer ${PAYSUITE_TOKEN}`
        }
      });

      const paysuiteData = paysuiteResponse.data.data;

      // Atualizar status local se mudou
      if (localPayment.status !== paysuiteData.status) {
        localPayment.status = paysuiteData.status;
        await localPayment.save();

        // Se pagamento foi aprovado, ativar subscrição relacionada
        if (paysuiteData.status === 'paid') {
          await handlePaymentSuccess(localPayment);
        }
      }

      res.json({
        success: true,
        payment: {
          id: localPayment._id,
          paysuiteId: localPayment.paysuiteId,
          amount: localPayment.amount,
          method: localPayment.method,
          reference: localPayment.reference,
          description: localPayment.description,
          status: localPayment.status,
          checkoutUrl: localPayment.checkoutUrl,
          transactionId: paysuiteData.transaction_id,
          paidAt: paysuiteData.paid_at,
          createdAt: localPayment.createdAt,
          updatedAt: localPayment.updatedAt
        }
      });

    } catch (paysuiteError) {
      // Se não conseguir conectar ao PaySuite, retorna dados locais
      console.warn('Erro ao consultar PaySuite, retornando dados locais:', paysuiteError.message);

      res.json({
        success: true,
        payment: {
          id: localPayment._id,
          paysuiteId: localPayment.paysuiteId,
          amount: localPayment.amount,
          method: localPayment.method,
          reference: localPayment.reference,
          description: localPayment.description,
          status: localPayment.status,
          checkoutUrl: localPayment.checkoutUrl,
          createdAt: localPayment.createdAt,
          updatedAt: localPayment.updatedAt
        }
      });
    }

  } catch (error) {
    console.error('Erro ao buscar pedido de pagamento:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar pedido de pagamento'
    });
  }
};

exports.createSubscriptionPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { planType } = req.body;

    // Validar plano
    if (!['monthly', 'annual'].includes(planType)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de plano inválido'
      });
    }

    // Buscar detalhes do plano
    const plan = await Plan.findOne({ type: planType });
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plano não encontrado'
      });
    }

    // Verificar se já existe subscrição ativa
    const existingSubscription = await Subscription.findOne({
      userId,
      status: 'active'
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'Usuário já possui uma subscrição ativa'
      });
    }

    // Criar pedido de pagamento
    const reference = `SUB-${userId}-${Date.now()}`;
    const callbackUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/payments/callback`;

    const paysuiteResponse = await axios.post(`${PAYSUITE_BASE_URL}/payments`, {
      amount: plan.price,
      method: 'mpesa', // método padrão
      reference: reference,
      description: `Subscrição ${plan.title}`,
      return_url: 'https://yourapp.com/payment/success',
      callback_url: callbackUrl
    }, {
      headers: {
        'Authorization': `Bearer ${PAYSUITE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const paymentData = paysuiteResponse.data.data;

    // Salvar pagamento localmente
    const localPayment = await Payment.create({
      paysuiteId: paymentData.id,
      amount: paymentData.amount,
      method: paymentData.method,
      reference: paymentData.reference,
      description: paymentData.description,
      status: paymentData.status || 'pending',
      checkoutUrl: paymentData.checkout_url,
      returnUrl: paymentData.return_url,
      callbackUrl: paymentData.callback_url
    });

    // Criar subscrição pendente
    const startDate = new Date();
    const endDate = planType === 'monthly'
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 365 dias

    const subscription = await Subscription.create({
      userId,
      plan: planType,
      startDate,
      endDate,
      status: 'pending', // aguardando pagamento
      paymentId: localPayment._id
    });

    res.status(201).json({
      success: true,
      message: 'Subscrição criada. Complete o pagamento.',
      subscription: {
        id: subscription._id,
        plan: subscription.plan,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status
      },
      payment: {
        id: localPayment._id,
        paysuiteId: localPayment.paysuiteId,
        amount: localPayment.amount,
        checkoutUrl: localPayment.checkoutUrl,
        status: localPayment.status
      }
    });

  } catch (error) {
    console.error('Erro ao criar pagamento de subscrição:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar pagamento',
      error: error.response?.data?.message || error.message
    });
  }
};

exports.paymentCallback = async (req, res) => {
  try {
    const { uuid } = req.params;

    // Buscar pagamento local
    const payment = await Payment.findOne({ paysuiteId: uuid });
    if (!payment) {
      console.warn(`Pagamento não encontrado para callback: ${uuid}`);
      return res.status(404).json({ success: false, message: 'Pagamento não encontrado' });
    }

    // Buscar status no PaySuite
    const paysuiteResponse = await axios.get(`${PAYSUITE_BASE_URL}/payments/${uuid}`, {
      headers: {
        'Authorization': `Bearer ${PAYSUITE_TOKEN}`
      }
    });

    const paysuiteData = paysuiteResponse.data.data;

    // Atualizar status local
    payment.status = paysuiteData.status;
    if (paysuiteData.paid_at) {
      payment.paidAt = new Date(paysuiteData.paid_at);
    }
    await payment.save();

    // Se pagamento foi aprovado, ativar subscrição
    if (paysuiteData.status === 'paid') {
      await handlePaymentSuccess(payment);
    }

    res.json({
      success: true,
      message: 'Callback processado com sucesso',
      payment: {
        id: payment._id,
        status: payment.status
      }
    });

  } catch (error) {
    console.error('Erro no callback de pagamento:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar callback'
    });
  }
};

// Função auxiliar para ativar subscrição após pagamento
async function handlePaymentSuccess(payment) {
  try {
    // Encontrar subscrição relacionada
    const subscription = await Subscription.findOne({ paymentId: payment._id });

    if (subscription && subscription.status === 'pending') {
      subscription.status = 'active';
      await subscription.save();
      console.log(`Subscrição ${subscription._id} ativada após pagamento`);
    }
  } catch (error) {
    console.error('Erro ao ativar subscrição:', error.message);
  }
}
