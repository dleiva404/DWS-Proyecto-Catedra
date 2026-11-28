const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { AuthMiddleware } = require('../middlewares/authMiddleware');

// Login
router.post('/login', AuthController.login);

// Logout
router.post('/logout', AuthMiddleware.verificarToken, AuthController.logout);

// Datos del usuario logueado
router.get('/perfil', AuthMiddleware.verificarToken, AuthController.perfil);

// Solicitar recuperación de contraseña
router.post('/olvide-contrasena', AuthController.olvideContrasena);

// Restablecer contraseña
router.post('/restablecer-contrasena', AuthController.restablecerContrasena);

module.exports = router;
