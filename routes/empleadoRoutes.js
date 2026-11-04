const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController');
const { AuthMiddleware, ROLES } = require('../middlewares/authMiddleware');

// requiere sesion iniciada
router.use(AuthMiddleware.verificarToken);

const puedeConsultar = AuthMiddleware.verificarRol(ROLES.ADMIN_TI, ROLES.ASISTENTE, ROLES.ANALISTA, ROLES.GERENTE);
const puedeEditar = AuthMiddleware.verificarRol(ROLES.ADMIN_TI, ROLES.ASISTENTE);
const soloAdmin = AuthMiddleware.verificarRol(ROLES.ADMIN_TI);

// Obtener todos los empleados
router.get('/', puedeConsultar, empleadoController.listarEmpleados);

// Consultar el saldo de vacaciones de un empleado
router.get('/:id/saldo-vacaciones', puedeConsultar, empleadoController.obtenerSaldoVacaciones);

// Obtener empleado por ID
router.get('/:id', puedeConsultar, empleadoController.obtenerEmpleadoPorId);

// Crear empleado
router.post('/', puedeEditar, empleadoController.crearEmpleado);

// Actualizar empleado
router.put('/:id', puedeEditar, empleadoController.actualizarEmpleado);

// Desactivar empleado
router.delete('/:id', soloAdmin, empleadoController.eliminarEmpleado);

// Reactivar empleado
router.patch('/:id/reactivar', soloAdmin, empleadoController.reactivarEmpleado);

module.exports = router;