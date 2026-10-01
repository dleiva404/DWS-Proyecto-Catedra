const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController');

// Ruta para obtener todos los empleados (GET /api/empleados)
router.get('/', empleadoController.listarEmpleados);

// Ruta para registrar un nuevo empleado (POST /api/empleados)
router.post('/', empleadoController.crearEmpleado);

module.exports = router;