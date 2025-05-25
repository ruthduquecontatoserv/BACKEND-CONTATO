const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  try {
    // Verificar se o token está presente no header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token de autenticação não fornecido', code: 401 });
    }

    // Extrair o token
    const token = authHeader.split(' ')[1];

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar o usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { department: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado', code: 401 });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ message: 'Conta inativa', code: 403 });
    }

    // Adicionar o usuário ao objeto de requisição
    req.user = user;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token inválido ou expirado', code: 401 });
    }
    next(error);
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Acesso restrito a administradores', code: 403 });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
