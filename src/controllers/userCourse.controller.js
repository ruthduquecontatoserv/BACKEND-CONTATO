const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// Listar todas as matrículas
const getAllUserCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, userId, courseId, completed } = req.query;
    const skip = (page - 1) * limit;
    
    // Construir filtros
    const where = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (courseId) {
      where.courseId = courseId;
    }
    
    if (completed !== undefined) {
      where.completed = completed === 'true';
    }
    
    // Buscar matrículas com paginação
    const [userCourses, total] = await Promise.all([
      prisma.userCourse.findMany({
        where,
        include: {
          user: {
            include: { department: true }
          },
          course: true
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { startDate: 'desc' }
      }),
      prisma.userCourse.count({ where })
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
    console.error('Erro ao listar matrículas:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Obter uma matrícula específica
const getUserCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const userCourse = await prisma.userCourse.findUnique({
      where: { id },
      include: {
        user: {
          include: { department: true }
        },
        course: true
      }
    });
    
    if (!userCourse) {
      return res.status(404).json({ message: 'Matrícula não encontrada', code: 404 });
    }
    
    // Remover senha do objeto de resposta
    const { user, ...rest } = userCourse;
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json({
      ...rest,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Erro ao buscar matrícula:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Criar uma nova matrícula
const createUserCourse = async (req, res) => {
  try {
    // Validar dados de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), code: 400 });
    }
    
    const { userId, courseId } = req.body;
    
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { department: true }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Usuário não encontrado', code: 400 });
    }
    
    // Verificar se o curso existe
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });
    
    if (!course) {
      return res.status(400).json({ message: 'Curso não encontrado', code: 400 });
    }
    
    // Verificar se o usuário já está matriculado no curso
    const existingUserCourse = await prisma.userCourse.findFirst({
      where: {
        userId,
        courseId
      }
    });
    
    if (existingUserCourse) {
      return res.status(400).json({ message: 'Usuário já está matriculado neste curso', code: 400 });
    }
    
    // Verificar limite de cursos simultâneos do departamento
    const activeCourses = await prisma.userCourse.count({
      where: {
        userId,
        completed: false
      }
    });
    
    if (activeCourses >= user.department.simultaneousCourses) {
      return res.status(400).json({ 
        message: `Usuário atingiu o limite de ${user.department.simultaneousCourses} cursos simultâneos permitidos para seu departamento`, 
        code: 400 
      });
    }
    
    // Criar matrícula
    const newUserCourse = await prisma.userCourse.create({
      data: {
        userId,
        courseId,
        progress: 0,
        completed: false,
        startDate: new Date()
      },
      include: {
        user: {
          include: { department: true }
        },
        course: true
      }
    });
    
    // Remover senha do objeto de resposta
    const { user: userResponse, ...rest } = newUserCourse;
    const { password, ...userWithoutPassword } = userResponse;
    
    res.status(201).json({
      ...rest,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Erro ao criar matrícula:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Atualizar progresso de uma matrícula
const updateUserCourseProgress = async (req, res) => {
  try {
    // Validar dados de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), code: 400 });
    }
    
    const { id } = req.params;
    const { progress } = req.body;
    
    // Verificar se a matrícula existe
    const userCourse = await prisma.userCourse.findUnique({
      where: { id }
    });
    
    if (!userCourse) {
      return res.status(404).json({ message: 'Matrícula não encontrada', code: 404 });
    }
    
    // Atualizar progresso
    const updatedUserCourse = await prisma.userCourse.update({
      where: { id },
      data: {
        progress,
        // Se o progresso for 100%, marcar como concluído
        ...(progress === 100 ? { 
          completed: true,
          endDate: new Date()
        } : {})
      },
      include: {
        user: {
          include: { department: true }
        },
        course: true
      }
    });
    
    // Se o curso foi concluído, atualizar contador de cursos concluídos do usuário
    if (progress === 100 && !userCourse.completed) {
      await prisma.user.update({
        where: { id: userCourse.userId },
        data: {
          completedCourses: {
            increment: 1
          }
        }
      });
    }
    
    // Remover senha do objeto de resposta
    const { user, ...rest } = updatedUserCourse;
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json({
      ...rest,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Erro ao atualizar progresso da matrícula:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Marcar curso como concluído
const completeUserCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { grade } = req.body;
    
    // Verificar se a matrícula existe
    const userCourse = await prisma.userCourse.findUnique({
      where: { id }
    });
    
    if (!userCourse) {
      return res.status(404).json({ message: 'Matrícula não encontrada', code: 404 });
    }
    
    // Atualizar matrícula
    const updatedUserCourse = await prisma.userCourse.update({
      where: { id },
      data: {
        progress: 100,
        completed: true,
        endDate: new Date(),
        grade: grade !== undefined ? parseFloat(grade) : undefined
      },
      include: {
        user: {
          include: { department: true }
        },
        course: true
      }
    });
    
    // Se o curso não estava concluído antes, atualizar contador de cursos concluídos do usuário
    if (!userCourse.completed) {
      await prisma.user.update({
        where: { id: userCourse.userId },
        data: {
          completedCourses: {
            increment: 1
          }
        }
      });
    }
    
    // Remover senha do objeto de resposta
    const { user, ...rest } = updatedUserCourse;
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json({
      ...rest,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Erro ao concluir matrícula:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Excluir uma matrícula
const deleteUserCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a matrícula existe
    const userCourse = await prisma.userCourse.findUnique({
      where: { id }
    });
    
    if (!userCourse) {
      return res.status(404).json({ message: 'Matrícula não encontrada', code: 404 });
    }
    
    // Excluir matrícula
    await prisma.userCourse.delete({
      where: { id }
    });
    
    // Se o curso estava concluído, decrementar contador de cursos concluídos do usuário
    if (userCourse.completed) {
      await prisma.user.update({
        where: { id: userCourse.userId },
        data: {
          completedCourses: {
            decrement: 1
          }
        }
      });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir matrícula:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

module.exports = {
  getAllUserCourses,
  getUserCourseById,
  createUserCourse,
  updateUserCourseProgress,
  completeUserCourse,
  deleteUserCourse
};
