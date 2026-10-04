const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController');

// Obtener todos los empleados
router.get('/', empleadoController.listarEmpleados);

// Obtener empleado por ID
router.get('/:id', empleadoController.obtenerEmpleadoPorId);

// Crear empleado
router.post('/', empleadoController.crearEmpleado);

// Actualizar empleado
router.put('/:id', empleadoController.actualizarEmpleado);

// Eliminar empleado
router.delete('/:id', empleadoController.eliminarEmpleado);

module.exports = router;