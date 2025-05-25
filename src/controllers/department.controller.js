const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// Listar todos os departamentos
const getAllDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    });
    
    res.status(200).json(departments);
  } catch (error) {
    console.error('Erro ao listar departamentos:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Obter um departamento específico
const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const department = await prisma.department.findUnique({
      where: { id }
    });
    
    if (!department) {
      return res.status(404).json({ message: 'Departamento não encontrado', code: 404 });
    }
    
    res.status(200).json(department);
  } catch (error) {
    console.error('Erro ao buscar departamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Criar um novo departamento
const createDepartment = async (req, res) => {
  try {
    // Validar dados de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), code: 400 });
    }
    
    const { 
      name, 
      accessAllCourses = true, 
      accessAllTracks = true, 
      simultaneousCourses = 5, 
      certificatePermission = true 
    } = req.body;
    
    // Verificar se já existe um departamento com o mesmo nome
    const existingDepartment = await prisma.department.findUnique({
      where: { name }
    });
    
    if (existingDepartment) {
      return res.status(400).json({ message: 'Já existe um departamento com este nome', code: 400 });
    }
    
    // Criar departamento
    const newDepartment = await prisma.department.create({
      data: {
        name,
        accessAllCourses,
        accessAllTracks,
        simultaneousCourses,
        certificatePermission
      }
    });
    
    res.status(201).json(newDepartment);
  } catch (error) {
    console.error('Erro ao criar departamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Atualizar um departamento
const updateDepartment = async (req, res) => {
  try {
    // Validar dados de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), code: 400 });
    }
    
    const { id } = req.params;
    const { 
      name, 
      accessAllCourses, 
      accessAllTracks, 
      simultaneousCourses, 
      certificatePermission 
    } = req.body;
    
    // Verificar se o departamento existe
    const department = await prisma.department.findUnique({
      where: { id }
    });
    
    if (!department) {
      return res.status(404).json({ message: 'Departamento não encontrado', code: 404 });
    }
    
    // Verificar se já existe outro departamento com o mesmo nome
    if (name && name !== department.name) {
      const existingDepartment = await prisma.department.findUnique({
        where: { name }
      });
      
      if (existingDepartment) {
        return res.status(400).json({ message: 'Já existe um departamento com este nome', code: 400 });
      }
    }
    
    // Preparar dados para atualização
    const updateData = {};
    if (name) updateData.name = name;
    if (accessAllCourses !== undefined) updateData.accessAllCourses = accessAllCourses;
    if (accessAllTracks !== undefined) updateData.accessAllTracks = accessAllTracks;
    if (simultaneousCourses !== undefined) updateData.simultaneousCourses = simultaneousCourses;
    if (certificatePermission !== undefined) updateData.certificatePermission = certificatePermission;
    
    // Atualizar departamento
    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: updateData
    });
    
    res.status(200).json(updatedDepartment);
  } catch (error) {
    console.error('Erro ao atualizar departamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Excluir um departamento
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o departamento existe
    const department = await prisma.department.findUnique({
      where: { id }
    });
    
    if (!department) {
      return res.status(404).json({ message: 'Departamento não encontrado', code: 404 });
    }
    
    // Verificar se existem usuários associados ao departamento
    const usersCount = await prisma.user.count({
      where: { departmentId: id }
    });
    
    if (usersCount > 0) {
      return res.status(400).json({ 
        message: 'Não é possível excluir o departamento pois existem usuários associados a ele', 
        code: 400 
      });
    }
    
    // Excluir departamento
    await prisma.department.delete({
      where: { id }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir departamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Listar usuários de um departamento
const getDepartmentUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // Verificar se o departamento existe
    const department = await prisma.department.findUnique({
      where: { id }
    });
    
    if (!department) {
      return res.status(404).json({ message: 'Departamento não encontrado', code: 404 });
    }
    
    // Buscar usuários do departamento com paginação
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { departmentId: id },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { name: 'asc' }
      }),
      prisma.user.count({
        where: { departmentId: id }
      })
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
    console.error('Erro ao listar usuários do departamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentUsers
};
