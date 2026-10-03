const db = require('../config/db'); 

const TipoSolicitud = {
    // Obtener todos los tipos de solicitud
    obtenerTodos: (callback) => {
        const query = 'SELECT * FROM tipo_solicitud';
        db.query(query, callback);
    },

    // Obtener un tipo de solicitud por ID
    obtenerPorId: (id, callback) => {
        const query = 'SELECT * FROM tipo_solicitud WHERE id_tipo_solicitud = ?';
        db.query(query, [id], callback);
    },

    // Crear un nuevo tipo de solicitud
    crear: (data, callback) => {
        const query = `
            INSERT INTO tipo_solicitud (nombre)
            VALUES (?)
        `;

        db.query(query, [data.nombre], callback);
    },

    // Actualizar un tipo de solicitud
    actualizar: (id, data, callback) => {
        const query = `
            UPDATE tipo_solicitud
            SET nombre = ?
            WHERE id_tipo_solicitud = ?
        `;

        db.query(query, [data.nombre, id], callback);
    },

    // Eliminar un tipo de solicitud
    eliminar: (id, callback) => {
        const query = 'DELETE FROM tipo_solicitud WHERE id_tipo_solicitud = ?';
        db.query(query, [id], callback);
    }
};

module.exports = TipoSolicitud;