const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Obter métricas para o dashboard administrativo
const getDashboardMetrics = async (req, res) => {
  try {
    // Obter contagem total de usuários
    const totalUsers = await prisma.user.count();
    
    // Obter contagem de usuários ativos (que fizeram login nos últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = await prisma.user.count({
      where: {
        lastLogin: {
          gte: thirtyDaysAgo
        }
      }
    });
    
    // Obter contagem total de cursos
    const totalCourses = await prisma.course.count();
    
    // Obter contagem de cursos ativos
    const activeCourses = await prisma.course.count({
      where: {
        status: 'ACTIVE'
      }
    });
    
    // Obter taxa de conclusão de cursos
    const totalEnrollments = await prisma.userCourse.count();
    const completedEnrollments = await prisma.userCourse.count({
      where: {
        completed: true
      }
    });
    
    const completionRate = totalEnrollments > 0 
      ? (completedEnrollments / totalEnrollments) * 100 
      : 0;
    
    // Obter média de notas
    const gradesResult = await prisma.userCourse.aggregate({
      _avg: {
        grade: true
      },
      where: {
        grade: {
          not: null
        }
      }
    });
    
    const averageGrade = gradesResult._avg.grade || 0;
    
    // Obter dados de engajamento dos últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Criar array com os últimos 6 meses
    const months = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.unshift({
        month: date.toLocaleString('default', { month: 'long' }),
        year: date.getFullYear(),
        date: new Date(date.getFullYear(), date.getMonth(), 1)
      });
    }
    
    // Obter usuários ativos por mês
    const userEngagement = await Promise.all(
      months.map(async (month) => {
        const startDate = month.date;
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        
        const activeUsersCount = await prisma.user.count({
          where: {
            lastLogin: {
              gte: startDate,
              lt: endDate
            }
          }
        });
        
        return {
          month: month.month,
          year: month.year,
          activeUsers: activeUsersCount
        };
      })
    );
    
    // Obter distribuição de usuários por departamento
    const departmentDistribution = await prisma.department.findMany({
      select: {
        name: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });
    
    const departmentData = departmentDistribution.map(dept => ({
      department: dept.name,
      users: dept._count.users
    }));
    
    // Salvar métricas no banco de dados para histórico
    await prisma.metrics.create({
      data: {
        totalUsers,
        activeUsers,
        totalCourses,
        activeCourses,
        completionRate,
        averageGrade
      }
    });
    
    res.status(200).json({
      summary: {
        totalUsers,
        activeUsers,
        totalCourses,
        activeCourses,
        completionRate,
        averageGrade
      },
      userEngagement,
      departmentDistribution: departmentData
    });
  } catch (error) {
    console.error('Erro ao obter métricas do dashboard:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Obter métricas de usuários
const getUserMetrics = async (req, res) => {
  try {
    // Obter contagem total de usuários
    const totalUsers = await prisma.user.count();
    
    // Obter contagem de usuários por status
    const activeUsers = await prisma.user.count({
      where: {
        status: 'ACTIVE'
      }
    });
    
    const inactiveUsers = await prisma.user.count({
      where: {
        status: 'INACTIVE'
      }
    });
    
    // Obter contagem de usuários por função
    const adminUsers = await prisma.user.count({
      where: {
        role: 'ADMIN'
      }
    });
    
    const regularUsers = await prisma.user.count({
      where: {
        role: 'USER'
      }
    });
    
    // Obter contagem de usuários por departamento
    const usersByDepartment = await prisma.department.findMany({
      select: {
        name: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });
    
    // Obter usuários mais ativos (com mais cursos concluídos)
    const topUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        completedCourses: true,
        department: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        completedCourses: 'desc'
      },
      take: 10
    });
    
    res.status(200).json({
      totalUsers,
      byStatus: {
        active: activeUsers,
        inactive: inactiveUsers
      },
      byRole: {
        admin: adminUsers,
        user: regularUsers
      },
      byDepartment: usersByDepartment.map(dept => ({
        department: dept.name,
        users: dept._count.users
      })),
      topUsers
    });
  } catch (error) {
    console.error('Erro ao obter métricas de usuários:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Obter métricas de cursos
const getCourseMetrics = async (req, res) => {
  try {
    // Obter contagem total de cursos
    const totalCourses = await prisma.course.count();
    
    // Obter contagem de cursos por status
    const activeCourses = await prisma.course.count({
      where: {
        status: 'ACTIVE'
      }
    });
    
    const inactiveCourses = await prisma.course.count({
      where: {
        status: 'INACTIVE'
      }
    });
    
    // Obter cursos mais populares (com mais matrículas)
    const popularCourses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        _count: {
          select: {
            userCourses: true
          }
        }
      },
      orderBy: {
        userCourses: {
          _count: 'desc'
        }
      },
      take: 10
    });
    
    // Obter cursos com maior taxa de conclusão
    const coursesWithCompletionRate = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        userCourses: {
          select: {
            completed: true
          }
        }
      }
    });
    
    const coursesCompletionRate = coursesWithCompletionRate
      .map(course => {
        const total = course.userCourses.length;
        const completed = course.userCourses.filter(uc => uc.completed).length;
        const completionRate = total > 0 ? (completed / total) * 100 : 0;
        
        return {
          id: course.id,
          title: course.title,
          totalEnrollments: total,
          completedEnrollments: completed,
          completionRate
        };
      })
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 10);
    
    res.status(200).json({
      totalCourses,
      byStatus: {
        active: activeCourses,
        inactive: inactiveCourses
      },
      popularCourses: popularCourses.map(course => ({
        id: course.id,
        title: course.title,
        status: course.status,
        enrollments: course._count.userCourses
      })),
      topCompletionRate: coursesCompletionRate
    });
  } catch (error) {
    console.error('Erro ao obter métricas de cursos:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Obter métricas por departamento
const getDepartmentMetrics = async (req, res) => {
  try {
    // Obter todos os departamentos
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    // Para cada departamento, obter métricas
    const departmentMetrics = await Promise.all(
      departments.map(async (dept) => {
        // Contagem de usuários
        const usersCount = await prisma.user.count({
          where: {
            departmentId: dept.id
          }
        });
        
        // Contagem de cursos concluídos
        const completedCoursesCount = await prisma.user.aggregate({
          _sum: {
            completedCourses: true
          },
          where: {
            departmentId: dept.id
          }
        });
        
        // Média de cursos concluídos por usuário
        const avgCompletedCourses = usersCount > 0 
          ? (completedCoursesCount._sum.completedCourses || 0) / usersCount 
          : 0;
        
        // Usuários ativos nos últimos 30 dias
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const activeUsersCount = await prisma.user.count({
          where: {
            departmentId: dept.id,
            lastLogin: {
              gte: thirtyDaysAgo
            }
          }
        });
        
        return {
          id: dept.id,
          name: dept.name,
          usersCount,
          completedCoursesCount: completedCoursesCount._sum.completedCourses || 0,
          avgCompletedCourses,
          activeUsersCount,
          activeUsersPercentage: usersCount > 0 ? (activeUsersCount / usersCount) * 100 : 0
        };
      })
    );
    
    res.status(200).json(departmentMetrics);
  } catch (error) {
    console.error('Erro ao obter métricas por departamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

module.exports = {
  getDashboardMetrics,
  getUserMetrics,
  getCourseMetrics,
  getDepartmentMetrics
};
