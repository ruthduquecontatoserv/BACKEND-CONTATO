const { PrismaClient } = require('@prisma/client');
const { validationResult } = require('express-validator');

const prisma = new PrismaClient();

// Obter configurações do sistema
const getSystemConfig = async (req, res) => {
  try {
    // Buscar configurações do sistema (deve haver apenas um registro)
    let config = await prisma.systemConfig.findFirst();
    
    // Se não existir, criar configurações padrão
    if (!config) {
      config = await prisma.systemConfig.create({
        data: {
          autoRegister: false,
          manualApproval: true,
          inactivityBlockDays: 30,
          inactivityBlockEnabled: false,
          userLimit: 2000,
          userLimitEnabled: true
        }
      });
    }
    
    res.status(200).json(config);
  } catch (error) {
    console.error('Erro ao obter configurações do sistema:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

// Atualizar configurações do sistema
const updateSystemConfig = async (req, res) => {
  try {
    // Validar dados de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array(), code: 400 });
    }
    
    const { 
      autoRegister, 
      manualApproval, 
      inactivityBlockDays, 
      inactivityBlockEnabled, 
      userLimit, 
      userLimitEnabled 
    } = req.body;
    
    // Buscar configurações do sistema
    let config = await prisma.systemConfig.findFirst();
    
    // Se não existir, criar configurações padrão
    if (!config) {
      config = await prisma.systemConfig.create({
        data: {
          autoRegister: false,
          manualApproval: true,
          inactivityBlockDays: 30,
          inactivityBlockEnabled: false,
          userLimit: 2000,
          userLimitEnabled: true
        }
      });
    }
    
    // Preparar dados para atualização
    const updateData = {};
    if (autoRegister !== undefined) updateData.autoRegister = autoRegister;
    if (manualApproval !== undefined) updateData.manualApproval = manualApproval;
    if (inactivityBlockDays !== undefined) updateData.inactivityBlockDays = inactivityBlockDays;
    if (inactivityBlockEnabled !== undefined) updateData.inactivityBlockEnabled = inactivityBlockEnabled;
    if (userLimit !== undefined) updateData.userLimit = userLimit;
    if (userLimitEnabled !== undefined) updateData.userLimitEnabled = userLimitEnabled;
    
    // Atualizar configurações
    const updatedConfig = await prisma.systemConfig.update({
      where: { id: config.id },
      data: updateData
    });
    
    res.status(200).json(updatedConfig);
  } catch (error) {
    console.error('Erro ao atualizar configurações do sistema:', error);
    res.status(500).json({ message: 'Erro interno do servidor', code: 500 });
  }
};

module.exports = {
  getSystemConfig,
  updateSystemConfig
};
