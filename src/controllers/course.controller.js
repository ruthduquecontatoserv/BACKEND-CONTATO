const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// Listar todos os cursos
const getAllCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (page - 1) * limit;
    
    // Construir filtros
    const where = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    // Buscar cursos com paginação
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { title: 'asc' }
      }),
      prisma.course.count({ where })
    ]);
    
    res.status(200).json({
      data: courses,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar cursos:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Obter um curso específico
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await prisma.course.findUnique({
      where: { id }
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Curso não encontrado', code: 404 });
    }
    
    res.status(200).json(course);
  } catch (error) {
    console.error('Erro ao buscar curso:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Criar um novo curso
const createCourse = async (req, res) => {
  try {
    // Validar dados de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), code: 400 });
    }
    
    const { title, description, status = 'ACTIVE' } = req.body;
    
    // Criar curso
    const newCourse = await prisma.course.create({
      data: {
        title,
        description,
        status
      }
    });
    
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Erro ao criar curso:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Atualizar um curso
const updateCourse = async (req, res) => {
  try {
    // Validar dados de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), code: 400 });
    }
    
    const { id } = req.params;
    const { title, description, status } = req.body;
    
    // Verificar se o curso existe
    const course = await prisma.course.findUnique({
      where: { id }
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Curso não encontrado', code: 404 });
    }
    
    // Preparar dados para atualização
    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    
    // Atualizar curso
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: updateData
    });
    
    res.status(200).json(updatedCourse);
  } catch (error) {
    console.error('Erro ao atualizar curso:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Excluir um curso
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o curso existe
    const course = await prisma.course.findUnique({
      where: { id }
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Curso não encontrado', code: 404 });
    }
    
    // Verificar se existem matrículas associadas ao curso
    const userCoursesCount = await prisma.userCourse.count({
      where: { courseId: id }
    });
    
    if (userCoursesCount > 0) {
      return res.status(400).json({ 
        message: 'Não é possível excluir o curso pois existem usuários matriculados nele', 
        code: 400 
      });
    }
    
    // Excluir curso
    await prisma.course.delete({
      where: { id }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir curso:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Listar usuários matriculados em um curso
const getCourseUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // Verificar se o curso existe
    const course = await prisma.course.findUnique({
      where: { id }
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Curso não encontrado', code: 404 });
    }
    
    // Buscar usuários matriculados no curso com paginação
    const [userCourses, total] = await Promise.all([
      prisma.userCourse.findMany({
        where: { courseId: id },
        include: { 
          user: {
            include: { department: true }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { startDate: 'desc' }
      }),
      prisma.userCourse.count({
        where: { courseId: id }
      })
    ]);
    
    // Remover senhas dos objetos de resposta
    const userCoursesWithoutPassword = userCourses.map(userCourse => {
      const { user, ...rest } = userCourse;
      const { password, ...userWithoutPassword } = user;
      return {
        ...rest,
        user: userWithoutPassword
      };
    });
    
    res.status(200).json({
      data: userCoursesWithoutPassword,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar usuários do curso:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseUsers
};
