const db = require('../config/db');

const EtapaSolicitud = {

    // Obtener todas las etapas de solicitudes
    obtenerTodos: (callback) => {
        const query = 'SELECT * FROM etapa_solicitud';
        db.query(query, callback);
    },

    // Obtener una etapa por ID
    obtenerPorId: (id, callback) => {
        const query = `
            SELECT *
            FROM etapa_solicitud
            WHERE id_etapa_solicitud = ?
        `;

        db.query(query, [id], callback);
    },

    // Obtener todas las etapas de una solicitud
    // Se ordenan según el número de etapa
    obtenerPorSolicitud: (id_solicitud, callback) => {
        const query = `
            SELECT *
            FROM etapa_solicitud
            WHERE id_solicitud = ?
            ORDER BY orden ASC
        `;

        db.query(query, [id_solicitud], callback);
    },

    // Obtener etapas pendientes de un rol
    // Si viene idJefe, solo las de empleados a su cargo
    obtenerPendientesPorRol: (id_rol, idJefe, callback) => {
        const query = `
            SELECT es.id_etapa_solicitud, es.nombre_etapa, es.orden,
                   s.id_solicitud, ts.nombre AS tipo, s.fecha_inicio, s.fecha_fin,
                   s.motivo, s.fecha_solicitud,
                   e.id_empleado, e.nombre, e.apellido
            FROM etapa_solicitud es
            JOIN solicitud s ON s.id_solicitud = es.id_solicitud
            JOIN tipo_solicitud ts ON ts.id_tipo_solicitud = s.id_tipo_solicitud
            JOIN empleado e ON e.id_empleado = s.id_empleado
            WHERE es.estado = 'Pendiente'
              AND es.id_rol = ?
              AND (? IS NULL OR e.id_supervisor = ?)
            ORDER BY s.fecha_solicitud
        `;

        db.query(query, [id_rol, idJefe, idJefe], callback);
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