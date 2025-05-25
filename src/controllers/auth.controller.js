const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Autenticar usuário
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email },
      include: { department: true }
    });

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas', code: 401 });
    }

    // Verificar se a senha está correta
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciais inválidas', code: 401 });
    }

    // Verificar se o usuário está ativo
    if (user.status === 'INACTIVE') {
      return res.status(403).json({ message: 'Conta inativa', code: 403 });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Remover senha do objeto de resposta
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Obter informações do usuário autenticado
const getMe = async (req, res) => {
  try {
    // O middleware de autenticação já adiciona o usuário ao objeto de requisição
    const { password, ...userWithoutPassword } = req.user;
    
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Erro ao obter informações do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Renovar token
const refreshToken = async (req, res) => {
  try {
    // O middleware de autenticação já verifica o token atual
    const user = req.user;

    // Gerar novo token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({ token });
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

module.exports = {
  login,
  getMe,
  refreshToken
};
