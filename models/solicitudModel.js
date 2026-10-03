const db = require('../config/db'); 

const Solicitud = {
    // Obtener todas las solicitudes
    obtenerTodos: (callback) => {
        const query = 'SELECT * FROM solicitud';
        db.query(query, callback);
    },

    // Obtener una solicitud por ID
    obtenerPorId: (id, callback) => {
        const query = 'SELECT * FROM solicitud WHERE id_solicitud = ?';
        db.query(query, [id], callback);
    },

    // Crear una nueva solicitud
    crear: (data, callback) => {
        const query = `
            INSERT INTO solicitud
            (id_empleado, id_tipo_solicitud, fecha_inicio, fecha_fin, motivo, estado)
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

    // Actualizar una solicitud
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

    // Eliminar una solicitud
    eliminar: (id, callback) => {
        const query = 'DELETE FROM solicitud WHERE id_solicitud = ?';
        db.query(query, [id], callback);
    }
};

module.exports = Solicitud;