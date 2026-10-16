const db = require('../config/db');

const Solicitud = {

    obtenerTodos: (callback) => {
        const query = 'SELECT * FROM solicitud';
        db.query(query, callback);
    },

    obtenerSolicitante: (id_empleado, callback) => {
        const query = `
            SELECT e.id_empleado, e.id_supervisor, r.nombre AS rol
            FROM empleado e
            JOIN usuario u ON u.id_usuario = e.id_usuario
            JOIN rol r ON r.id_rol = u.id_rol
            WHERE e.id_empleado = ?
        `;
        db.query(query, [id_empleado], callback);
    },

    obtenerVacacionesPendientes: (id_empleado, callback) => {
        const query = `
            SELECT fecha_inicio, fecha_fin
            FROM solicitud
            WHERE id_empleado = ?
              AND id_tipo_solicitud = 1
              AND estado = 'Pendiente'
        `;
        db.query(query, [id_empleado], callback);
    },

    contarAnalistasDisponibles: (callback) => {
        const query = `
            SELECT COUNT(*) AS disponibles
            FROM usuario u
            JOIN empleado e ON e.id_usuario = u.id_usuario
            WHERE u.id_rol = 3
              AND u.estado = TRUE
              AND e.estado = TRUE
              AND NOT EXISTS (
                  SELECT 1 FROM solicitud s
                  WHERE s.id_empleado = e.id_empleado
                    AND s.estado = 'Aprobada'
                    AND CURDATE() BETWEEN s.fecha_inicio AND s.fecha_fin
              )
        `;
        db.query(query, callback);
    },

    obtenerTodasConDetalle: (callback) => {
        const query = `
            SELECT s.id_solicitud, ts.nombre AS tipo, s.fecha_solicitud,
                   s.fecha_inicio, s.fecha_fin, s.estado,
                   e.id_empleado, e.nombre, e.apellido,
                   (SELECT es.nombre_etapa FROM etapa_solicitud es
                    WHERE es.id_solicitud = s.id_solicitud AND es.estado = 'Pendiente'
                    LIMIT 1) AS etapa_actual
            FROM solicitud s
            JOIN tipo_solicitud ts ON ts.id_tipo_solicitud = s.id_tipo_solicitud
            JOIN empleado e ON e.id_empleado = s.id_empleado
            ORDER BY s.fecha_solicitud DESC
        `;
        db.query(query, callback);
    },

    obtenerPorId: (id, callback) => {
        const query = `
            SELECT *
            FROM solicitud
            WHERE id_solicitud = ?
        `;
        db.query(query, [id], callback);
    },

    obtenerPorEmpleado: (id_empleado, callback) => {
        const query = `
            SELECT *
            FROM solicitud
            WHERE id_empleado = ?
            ORDER BY fecha_solicitud DESC
        `;
        db.query(query, [id_empleado], callback);
    },

    buscarTraslape: (id_empleado, fecha_inicio, fecha_fin, callback) => {
        const query = `
            SELECT *
            FROM solicitud
            WHERE id_empleado = ?
              AND id_tipo_solicitud = 1
              AND estado NOT IN ('Rechazada')
              AND fecha_inicio IS NOT NULL
              AND fecha_fin IS NOT NULL
              AND fecha_inicio <= ?
              AND fecha_fin >= ?
        `;
        db.query(query, [
            id_empleado,
            fecha_fin,
            fecha_inicio
        ], callback);
    },

    actualizarEstado: (id, estado, callback) => {
        const query = `
            UPDATE solicitud
            SET estado = ?
            WHERE id_solicitud = ?
        `;
        db.query(query, [estado, id], callback);
    },

    crear: (data, callback) => {
        const query = `
            INSERT INTO solicitud
            (
                id_empleado,
                id_tipo_solicitud,
                fecha_inicio,
                fecha_fin,
                motivo,
                estado
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.query(query, [
            data.id_empleado,
            data.id_tipo_solicitud,
            data.fecha_inicio,
            data.fecha_fin,
            data.motivo,
            data.estado
        ], callback);
    },

    actualizar: (id, data, callback) => {
        const query = `
            UPDATE solicitud
            SET id_empleado = ?,
                id_tipo_solicitud = ?,
                fecha_inicio = ?,
                fecha_fin = ?,
                motivo = ?,
                estado = ?
            WHERE id_solicitud = ?
        `;
        db.query(query, [
            data.id_empleado,
            data.id_tipo_solicitud,
            data.fecha_inicio,
            data.fecha_fin,
            data.motivo,
            data.estado,
            id
        ], callback);
    },

    eliminar: (id, callback) => {
        const query = `
            DELETE FROM solicitud
            WHERE id_solicitud = ?
        `;
        db.query(query, [id], callback);
    }
};

module.exports = Solicitud;