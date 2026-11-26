const express = require('express');
const router = express.Router();
const constanciaController = require('../controllers/constanciaController');
const { AuthMiddleware } = require('../middlewares/authMiddleware');

// publica, sin login: la usa el QR de la constancia
router.get('/validar/:codigo', constanciaController.validarConstancia);

// el empleado descarga su constancia aprobada
router.get('/solicitud/:id', AuthMiddleware.verificarToken, constanciaController.obtenerConstancia);

module.exports = router;
