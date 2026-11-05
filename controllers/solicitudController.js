const fs = require('fs');
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


const obtenerPendientes = (req, res) => {
    SolicitudService.obtenerPendientes(req.usuario, (error, resultados) => {
        if (error) {
            return res.status(error.status || 500).json({
                error: error.mensaje
            });
        }
        res.json(resultados);
    });
};


const obtenerTodas = (req, res) => {
    SolicitudService.obtenerTodas((error, resultados) => {
        if (error) return res.status(error.status || 500).json({ error: error.mensaje });
        res.json(resultados);
    });
};

const obtenerHistorial = (req, res) => {
    SolicitudService.obtenerHistorial(req.params.id, req.usuario, (error, resultado) => {
        if (error) return res.status(error.status || 500).json({ error: error.mensaje });
        res.json(resultado);
    });
};

const crearSolicitud = (req, res) => {
    SolicitudService.crearSolicitud(
        {
            id_empleado: req.usuario.id_empleado,
            id_tipo_solicitud: req.body.id_tipo_solicitud,
            fecha_inicio: req.body.fecha_inicio,
            fecha_fin: req.body.fecha_fin,
            motivo: req.body.motivo,
            archivo_adjunto: req.file ? 'uploads/solicitudes/' + req.file.filename : null
        },
        (error, resultado) => {
            if (error) {

                if (req.file) fs.unlink(req.file.path, () => { });

                return res.status(error.status || 500).json({
                    error: error.mensaje
                });
            }
            res.status(201).json(resultado);
        }
    );
};

const resolverEtapa = (req, res) => {
    if (!/^\d+$/.test(req.params.id))
        return res.status(400).json({ error: 'El ID de la etapa no es válido' });
    SolicitudService.resolverEtapa(
        req.params.id,
        obtenerIdRol(req.usuario.rol),
        req.body.decision,
        req.body.comentario,
        req.usuario.id_empleado,
        req.usuario.id_usuario,
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

const obtenerArchivo = (req, res) => {
    SolicitudService.verificarAccesoAdjunto(
        req.params.id,
        req.usuario,
        error => {
            if (error) {
                return res.status(error.status || 500).json({
                    error: error.mensaje
                });
            }

            const path = require('path');
            const fs = require('fs');

            SolicitudService.obtenerRutaAdjunto(req.params.id, (err, archivo) => {
                if (err) {
                    return res.status(err.status || 500).json({
                        error: err.mensaje
                    });
                }

                const ruta = path.resolve(__dirname, '..', archivo);

                if (!fs.existsSync(ruta)) {
                    return res.status(404).json({ error: 'Archivo no encontrado' });
                }

                res.sendFile(ruta);
            });
        }
    );
};

module.exports = {
    obtenerMisSolicitudes,
    obtenerPendientes,
    obtenerTodas,
    obtenerHistorial,
    crearSolicitud,
    resolverEtapa,
    obtenerArchivo
};