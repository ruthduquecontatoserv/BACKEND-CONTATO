const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');
const { body } = require('express-validator');

// Validação para criação de departamento
const createDepartmentValidation = [
  body('name').notEmpty().withMessage('Nome é obrigatório'),
  body('accessAllCourses').optional().isBoolean().withMessage('Acesso a todos os cursos deve ser um booleano'),
  body('accessAllTracks').optional().isBoolean().withMessage('Acesso a todas as trilhas deve ser um booleano'),
  body('simultaneousCourses').optional().isInt({ min: 1 }).withMessage('Limite de cursos simultâneos deve ser um número inteiro positivo'),
  body('certificatePermission').optional().isBoolean().withMessage('Permissão para certificados deve ser um booleano')
];

// Validação para atualização de departamento
const updateDepartmentValidation = [
  body('name').optional().notEmpty().withMessage('Nome não pode ser vazio'),
  body('accessAllCourses').optional().isBoolean().withMessage('Acesso a todos os cursos deve ser um booleano'),
  body('accessAllTracks').optional().isBoolean().withMessage('Acesso a todas as trilhas deve ser um booleano'),
  body('simultaneousCourses').optional().isInt({ min: 1 }).withMessage('Limite de cursos simultâneos deve ser um número inteiro positivo'),
  body('certificatePermission').optional().isBoolean().withMessage('Permissão para certificados deve ser um booleano')
];

// Rotas protegidas por autenticação
router.get('/', authMiddleware, departmentController.getAllDepartments);
router.get('/:id', authMiddleware, departmentController.getDepartmentById);
router.get('/:id/users', authMiddleware, departmentController.getDepartmentUsers);

// Rotas protegidas por autenticação e restritas a administradores
router.post('/', authMiddleware, adminMiddleware, createDepartmentValidation, departmentController.createDepartment);
router.put('/:id', authMiddleware, adminMiddleware, updateDepartmentValidation, departmentController.updateDepartment);
router.delete('/:id', authMiddleware, adminMiddleware, departmentController.deleteDepartment);

module.exports = router;
