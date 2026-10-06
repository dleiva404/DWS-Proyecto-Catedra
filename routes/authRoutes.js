const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { AuthMiddleware } = require('../middlewares/authMiddleware');

// Login
router.post('/login', AuthController.login);

// Logout
router.post('/logout', AuthMiddleware.verificarToken, AuthController.logout);

//Datos del usuario logueado
router.get('/perfil', AuthMiddleware.verificarToken, AuthController.perfil);

module.exports = router;