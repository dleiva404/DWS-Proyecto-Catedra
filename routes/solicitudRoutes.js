const express = require('express');
const router = express.Router();

const solicitudController = require('../controllers/solicitudController');
const { AuthMiddleware, ROLES } = require ('../middlewares/authMiddleware');

router.use(AuthMiddleware.verificarToken);

router.get(
    '/mis-solicitudes',
    solicitudController.obtenerMisSolicitudes
);

router.get(
    '/pendientes',
    AuthMiddleware.verificarRol(ROLES.JEFE, ROLES.ANALISTA, ROLES.GERENTE),
    solicitudController.obtenerPendientes
    );

router.post(
    '/',
    solicitudController.crearSolicitud
);

router.put(
    '/etapa/:id/resolver',
    AuthMiddleware.verificarRol(ROLES.JEFE, ROLES.ANALISTA, ROLES.GERENTE),
    solicitudController.resolverEtapa
);

module.exports = router;