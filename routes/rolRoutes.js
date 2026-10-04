const express = require('express');
const router = express.Router();
const rolController = require('../controllers/rolController');

// Obtener todos los roles
router.get('/', rolController.listarRoles);

// Obtener rol por ID
router.get('/:id', rolController.obtenerRolPorId);

module.exports = router;