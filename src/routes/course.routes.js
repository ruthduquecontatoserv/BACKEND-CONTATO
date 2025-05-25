const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');
const { body } = require('express-validator');

// Validação para criação de curso
const createCourseValidation = [
  body('title').notEmpty().withMessage('Título é obrigatório'),
  body('description').optional(),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Status inválido')
];

// Validação para atualização de curso
const updateCourseValidation = [
  body('title').optional().notEmpty().withMessage('Título não pode ser vazio'),
  body('description').optional(),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE']).withMessage('Status inválido')
];

// Rotas protegidas por autenticação
router.get('/', authMiddleware, courseController.getAllCourses);
router.get('/:id', authMiddleware, courseController.getCourseById);
router.get('/:id/users', authMiddleware, courseController.getCourseUsers);

// Rotas protegidas por autenticação e restritas a administradores
router.post('/', authMiddleware, adminMiddleware, createCourseValidation, courseController.createCourse);
router.put('/:id', authMiddleware, adminMiddleware, updateCourseValidation, courseController.updateCourse);
router.delete('/:id', authMiddleware, adminMiddleware, courseController.deleteCourse);

module.exports = router;
