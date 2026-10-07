const SolicitudService = require('../services/solicitudService');

const obtenerMisSolicitudes = (req, res) => {
    SolicitudService.obtenerMisSolicitudes(
        req.usuario.id_empleado,
        (error, resultados) => {
            if (error) {
                return res.status(error.status || 500).json({
                    error: error.mensaje
                });
            }
            res.json(resultados);
        }
    );
};

const crearSolicitud = (req, res) => {
    SolicitudService.crearSolicitud(
        {
            id_empleado: req.usuario.id_empleado,
            id_tipo_solicitud: req.body.id_tipo_solicitud,
            fecha_inicio: req.body.fecha_inicio,
            fecha_fin: req.body.fecha_fin,
            motivo: req.body.motivo
        },
        (error, resultado) => {
            if (error) {
                return res.status(error.status || 500).json({
                    error: error.mensaje
                });
            }
            res.status(201).json(resultado);
        }
    );
};

const resolverEtapa = (req, res) => {
    SolicitudService.resolverEtapa(
        req.params.id,
        obtenerIdRol(req.usuario.rol),
        req.body.decision,
        req.body.comentario,
        (error, resultado) => {
            if (error) {
                return res.status(error.status || 500).json({
                    error: error.mensaje
                });
            }
            res.json(resultado);
        }
    );
};

function obtenerIdRol(rol) {
    const roles = {
        'Empleado': 1,
        'Jefe inmediato': 2,
        'Analista de Nómina': 3,
        'Gerente': 4,
        'Asistente de planilla': 5,
        'Administrador de TI': 6
    };

    return roles[rol];
}

module.exports = {
    obtenerMisSolicitudes,
    crearSolicitud,
    resolverEtapa
};