const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { AuthMiddleware, ROLES } = require('../middlewares/authMiddleware');

router.use(AuthMiddleware.verificarToken);

// RRHH lo ve
router.get(
    '/resumen',
    AuthMiddleware.verificarRol(ROLES.ANALISTA, ROLES.GERENTE, ROLES.ASISTENTE),
    reporteController.obtenerResumen
);

module.exports = router;