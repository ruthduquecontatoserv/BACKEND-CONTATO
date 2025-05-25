const express = require('express');
const router = express.Router();
const systemConfigController = require('../controllers/systemConfig.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');
const { body } = require('express-validator');

// Validação para atualização de configurações do sistema
const updateSystemConfigValidation = [
  body('autoRegister').optional().isBoolean().withMessage('Registro automático deve ser um booleano'),
  body('manualApproval').optional().isBoolean().withMessage('Aprovação manual deve ser um booleano'),
  body('inactivityBlockDays').optional().isInt({ min: 1 }).withMessage('Dias de inatividade deve ser um número inteiro positivo'),
  body('inactivityBlockEnabled').optional().isBoolean().withMessage('Bloqueio por inatividade deve ser um booleano'),
  body('userLimit').optional().isInt({ min: 1 }).withMessage('Limite de usuários deve ser um número inteiro positivo'),
  body('userLimitEnabled').optional().isBoolean().withMessage('Limite de usuários deve ser um booleano')
];

// Rotas protegidas por autenticação e restritas a administradores
router.get('/', authMiddleware, adminMiddleware, systemConfigController.getSystemConfig);
router.put('/', authMiddleware, adminMiddleware, updateSystemConfigValidation, systemConfigController.updateSystemConfig);

module.exports = router;
