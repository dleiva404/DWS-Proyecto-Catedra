const TipoSolicitud = require('../models/tipoSolicitudModel');

// Listar todos los tipos de solicitud
const listarTiposSolicitud = (req, res) => {
    TipoSolicitud.obtenerTodos((err, resultados) => {
        if (err) {
            console.error('Error al obtener tipos de solicitud:', err);
            return res.status(500).json({
                error: 'Error interno del servidor al consultar tipos de solicitud'
            });
        }

        res.json(resultados);
    });
};

// Obtener tipo de solicitud por ID
const obtenerTipoSolicitudPorId = (req, res) => {
    const { id } = req.params;

    TipoSolicitud.obtenerPorId(id, (err, resultados) => {
        if (err) {
            console.error('Error al obtener tipo de solicitud:', err);
            return res.status(500).json({
                error: 'Error interno del servidor al consultar el tipo de solicitud'
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                error: 'Tipo de solicitud no encontrado'
            });
        }

        res.json(resultados[0]);
    });
};

module.exports = {
    listarTiposSolicitud,
    obtenerTipoSolicitudPorId
};