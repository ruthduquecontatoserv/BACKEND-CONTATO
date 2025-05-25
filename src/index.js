const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

// Rotas
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const departmentRoutes = require('./routes/department.routes');
const courseRoutes = require('./routes/course.routes');
const userCourseRoutes = require('./routes/userCourse.routes');
const systemConfigRoutes = require('./routes/systemConfig.routes');
const metricsRoutes = require('./routes/metrics.routes');

// Middlewares
const { authMiddleware } = require('./middlewares/auth.middleware');
const errorHandler = require('./middlewares/error.middleware');

// Configuração
dotenv.config();
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middlewares globais
app.use(cors());
app.use(helmet());
app.use(express.json());

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/departments', authMiddleware, departmentRoutes);
app.use('/api/courses', authMiddleware, courseRoutes);
app.use('/api/user-courses', authMiddleware, userCourseRoutes);
app.use('/api/system-config', authMiddleware, systemConfigRoutes);
app.use('/api/metrics', authMiddleware, metricsRoutes);

// Middleware de tratamento de erros
app.use(errorHandler);

// Inicialização do servidor
const server = app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (err) => {
  console.error('Erro não tratado:', err);
  server.close(() => process.exit(1));
});

module.exports = app;
