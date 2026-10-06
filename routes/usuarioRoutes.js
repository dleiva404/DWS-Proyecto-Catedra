const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { AuthMiddleware, ROLES } = require('../middlewares/authMiddleware');

// todas las rutas de usuarios para el Administrador de TI
router.use(AuthMiddleware.verificarToken, AuthMiddleware.verificarRol(ROLES.ADMIN_TI));

// Obtener todos los usuarios
router.get('/', usuarioController.listarUsuarios);

// Obtener usuario por ID
router.get('/:id', usuarioController.obtenerUsuarioPorId);

// Crear usuario
router.post('/', usuarioController.crearUsuario);

// Actualizar usuario
router.put('/:id', usuarioController.actualizarUsuario);

// Eliminar usuario
router.delete('/:id', usuarioController.eliminarUsuario);

module.exports = router;