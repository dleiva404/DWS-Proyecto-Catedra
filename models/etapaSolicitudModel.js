const db = require('../config/db'); 

const EtapaSolicitud = {
    // Obtener todas las etapas de solicitudes
    obtenerTodos: (callback) => {
        const query = 'SELECT * FROM etapa_solicitud';
        db.query(query, callback);
    },

    // Obtener una etapa por ID
    obtenerPorId: (id, callback) => {
        const query = 'SELECT * FROM etapa_solicitud WHERE id_etapa_solicitud = ?';
        db.query(query, [id], callback);
    },

    // Crear una nueva etapa de solicitud
    crear: (data, callback) => {
        const query = `
            INSERT INTO etapa_solicitud
            (
                id_solicitud,
                id_rol,
                nombre_etapa,
                orden,
                estado,
                fecha_inicio,
                fecha_resolucion,
                decision,
                comentario
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(query, [
            data.id_solicitud,
            data.id_rol,
            data.nombre_etapa,
            data.orden,
            data.estado,
            data.fecha_inicio,
            data.fecha_resolucion,
            data.decision,
            data.comentario
        ], callback);
    },

    // Actualizar una etapa de solicitud
    // Se utilizará para registrar cambios durante su resolución.
    // Las etapas ya completadas deben permanecer inmutables.
    actualizar: (id, data, callback) => {
        const query = `
            UPDATE etapa_solicitud
            SET id_solicitud = ?,
                id_rol = ?,
                nombre_etapa = ?,
                orden = ?,
                estado = ?,
                fecha_inicio = ?,
                fecha_resolucion = ?,
                decision = ?,
                comentario = ?
            WHERE id_etapa_solicitud = ?
        `;

        db.query(query, [
            data.id_solicitud,
            data.id_rol,
            data.nombre_etapa,
            data.orden,
            data.estado,
            data.fecha_inicio,
            data.fecha_resolucion,
            data.decision,
            data.comentario,
            id
        ], callback);
    }
};

module.exports = EtapaSolicitud;