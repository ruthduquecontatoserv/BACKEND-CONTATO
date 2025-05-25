const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');
const { body } = require('express-validator');

// Validação para criação de usuário
const createUserValidation = [
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('departmentId').notEmpty().withMessage('Departamento é obrigatório'),
  body('role').optional().isIn(['USER', 'ADMIN']).withMessage('Função inválida')
];

// Validação para atualização de usuário
const updateUserValidation = [
  body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('departmentId').optional().notEmpty().withMessage('Departamento não pode ser vazio'),
  body('role').optional().isIn(['USER', 'ADMIN']).withMessage('Função inválida'),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Status inválido')
];

// Rotas protegidas por autenticação
router.get('/', authMiddleware, userController.getAllUsers);
router.get('/search', authMiddleware, userController.searchUsers);
router.get('/:id', authMiddleware, userController.getUserById);
router.get('/:id/courses', authMiddleware, userController.getUserCourses);

// Rotas protegidas por autenticação e restritas a administradores
router.post('/', authMiddleware, adminMiddleware, createUserValidation, userController.createUser);
router.put('/:id', authMiddleware, adminMiddleware, updateUserValidation, userController.updateUser);
router.delete('/:id', authMiddleware, adminMiddleware, userController.deleteUser);

module.exports = router;
