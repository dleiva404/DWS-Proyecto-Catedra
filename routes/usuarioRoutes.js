const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { AuthMiddleware, ROLES } = require('../middlewares/authMiddleware');

// La consulta general tambien se utiliza desde Gestion de empleados.
router.use(AuthMiddleware.verificarToken);

// Obtener todos los usuarios
router.get('/', AuthMiddleware.verificarRol(ROLES.ADMIN_TI, ROLES.ASISTENTE), usuarioController.listarUsuarios);

// Las demas operaciones de usuarios son solo para Administrador de TI.
router.use(AuthMiddleware.verificarRol(ROLES.ADMIN_TI));

// Obtener usuario por ID
router.get('/:id', usuarioController.obtenerUsuarioPorId);

// Crear usuario
router.post('/', usuarioController.crearUsuario);

// Actualizar usuario
router.put('/:id', usuarioController.actualizarUsuario);

// Eliminar usuario
router.delete('/:id', usuarioController.eliminarUsuario);

module.exports = router;