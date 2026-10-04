const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

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