const express = require('express');
const router = express.Router();
const metricsController = require('../controllers/metrics.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');

// Todas as rotas de métricas são protegidas por autenticação e restritas a administradores
router.get('/dashboard', authMiddleware, adminMiddleware, metricsController.getDashboardMetrics);
router.get('/users', authMiddleware, adminMiddleware, metricsController.getUserMetrics);
router.get('/courses', authMiddleware, adminMiddleware, metricsController.getCourseMetrics);
router.get('/departments', authMiddleware, adminMiddleware, metricsController.getDepartmentMetrics);

module.exports = router;
