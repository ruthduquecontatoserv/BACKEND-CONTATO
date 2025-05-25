const express = require('express');
const router = express.Router();
const errorHandler = (err, req, res, next) => {
  console.error('Erro:', err);
  
  // Verificar se é um erro do Prisma
  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({
      message: 'Erro de banco de dados',
      code: 400,
      details: err.message
    });
  }
  
  // Verificar se é um erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Erro de validação',
      code: 400,
      details: err.message
    });
  }
  
  // Erro padrão
  res.status(500).json({
    message: 'Erro interno do servidor',
    code: 500
  });
};

module.exports = errorHandler;
