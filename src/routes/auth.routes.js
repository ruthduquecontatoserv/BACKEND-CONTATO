const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

// Rotas públicas
router.post('/login', authController.login);

// Rotas protegidas
router.get('/me', authMiddleware, authController.getMe);
router.post('/refresh-token', authMiddleware, authController.refreshToken);

module.exports = router;
