const express = require('express');
const router = express.Router();
const tipoSolicitudController = require('../controllers/tipoSolicitudController');
const { AuthMiddleware } = require('../middlewares/authMiddleware');

// requiere sesion iniciada
router.use(AuthMiddleware.verificarToken);

// Obtener todos los tipos de solicitud
router.get('/', tipoSolicitudController.listarTiposSolicitud);

// Obtener tipo de solicitud por ID
router.get('/:id', tipoSolicitudController.obtenerTipoSolicitudPorId);

module.exports = router;