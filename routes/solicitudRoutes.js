const express = require('express');
const router = express.Router();

const solicitudController = require('../controllers/solicitudController');
const { AuthMiddleware } = require('../middlewares/authMiddleware');

router.use(AuthMiddleware.verificarToken);

router.get(
    '/mis-solicitudes',
    solicitudController.obtenerMisSolicitudes
);

router.post(
    '/',
    solicitudController.crearSolicitud
);

router.put(
    '/etapa/:id/resolver',
    solicitudController.resolverEtapa
);

module.exports = router;