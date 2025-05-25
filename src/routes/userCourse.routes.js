const express = require('express');
const router = express.Router();
const userCourseController = require('../controllers/userCourse.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');
const { body } = require('express-validator');

// Validação para criação de matrícula
const createUserCourseValidation = [
  body('userId').notEmpty().withMessage('ID do usuário é obrigatório'),
  body('courseId').notEmpty().withMessage('ID do curso é obrigatório')
];

// Validação para atualização de progresso
const updateProgressValidation = [
  body('progress').isInt({ min: 0, max: 100 }).withMessage('Progresso deve ser um número inteiro entre 0 e 100')
];

// Validação para conclusão de curso
const completeCourseValidation = [
  body('grade').optional().isFloat({ min: 0, max: 10 }).withMessage('Nota deve ser um número entre 0 e 10')
];

// Rotas protegidas por autenticação
router.get('/', authMiddleware, userCourseController.getAllUserCourses);
router.get('/:id', authMiddleware, userCourseController.getUserCourseById);

// Rotas protegidas por autenticação e restritas a administradores
router.post('/', authMiddleware, adminMiddleware, createUserCourseValidation, userCourseController.createUserCourse);
router.put('/:id/progress', authMiddleware, updateProgressValidation, userCourseController.updateUserCourseProgress);
router.put('/:id/complete', authMiddleware, completeCourseValidation, userCourseController.completeUserCourse);
router.delete('/:id', authMiddleware, adminMiddleware, userCourseController.deleteUserCourse);

module.exports = router;
