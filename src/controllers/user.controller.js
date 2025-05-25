const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// Listar todos os usuários
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, department, status } = req.query;
    const skip = (page - 1) * limit;
    
    // Construir filtros
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (department) {
      where.departmentId = department;
    }
    
    if (status) {
      where.status = status;
    }
    
    // Buscar usuários com paginação
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { department: true },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { name: 'asc' }
      }),
      prisma.user.count({ where })
    ]);
    
    // Remover senhas dos objetos de resposta
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.status(200).json({
      data: usersWithoutPassword,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Obter um usuário específico
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: { department: true }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado', code: 404 });
    }
    
    // Remover senha do objeto de resposta
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Criar um novo usuário
const createUser = async (req, res) => {
  try {
    // Validar dados de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), code: 400 });
    }
    
    const { name, email, password, departmentId, role = 'USER' } = req.body;
    
    // Verificar se o email já está em uso
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Email já está em uso', code: 400 });
    }
    
    // Verificar se o departamento existe
    const department = await prisma.department.findUnique({
      where: { id: departmentId }
    });
    
    if (!department) {
      return res.status(400).json({ message: 'Departamento não encontrado', code: 400 });
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Criar usuário
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        departmentId,
        role,
        status: 'ACTIVE'
      },
      include: { department: true }
    });
    
    // Remover senha do objeto de resposta
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Atualizar um usuário
const updateUser = async (req, res) => {
  try {
    // Validar dados de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), code: 400 });
    }
    
    const { id } = req.params;
    const { name, email, departmentId, role, status } = req.body;
    
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado', code: 404 });
    }
    
    // Verificar se o email já está em uso por outro usuário
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Email já está em uso', code: 400 });
      }
    }
    
    // Verificar se o departamento existe
    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId }
      });
      
      if (!department) {
        return res.status(400).json({ message: 'Departamento não encontrado', code: 400 });
      }
    }
    
    // Preparar dados para atualização
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (departmentId) updateData.departmentId = departmentId;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    
    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { department: true }
    });
    
    // Remover senha do objeto de resposta
    const { password, ...userWithoutPassword } = updatedUser;
    
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Excluir um usuário
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado', code: 404 });
    }
    
    // Excluir usuário
    await prisma.user.delete({
      where: { id }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Listar cursos de um usuário
const getUserCourses = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado', code: 404 });
    }
    
    // Buscar cursos do usuário com paginação
    const [userCourses, total] = await Promise.all([
      prisma.userCourse.findMany({
        where: { userId: id },
        include: { course: true },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { startDate: 'desc' }
      }),
      prisma.userCourse.count({
        where: { userId: id }
      })
    ]);
    
    res.status(200).json({
      data: userCourses,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar cursos do usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Buscar usuários
const searchUsers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Termo de busca não fornecido', code: 400 });
    }
    
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } }
        ]
      },
      include: { department: true },
      take: parseInt(limit)
    });
    
    // Remover senhas dos objetos de resposta
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.status(200).json(usersWithoutPassword);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserCourses,
  searchUsers
};
