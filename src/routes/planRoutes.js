const express = require('express');
const planController = require('../controllers/planController');

const router = express.Router();

// Rota pública para listar planos (não requer autenticação)
router.get('/', planController.getAllPlans);

// Rota pública para obter um plano específico
router.get('/:planId', planController.getPlanById);

// Rota para criar planos (pode adicionar autenticação admin depois)
router.post('/', planController.createPlan);

module.exports = router;
