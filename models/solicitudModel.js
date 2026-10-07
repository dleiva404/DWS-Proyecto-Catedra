const db = require('../config/db');

const Solicitud = {

    obtenerTodos: (callback) => {
        const query = 'SELECT * FROM solicitud';
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