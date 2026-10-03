const db = require('../config/db'); 

const Constancia = {
    // Obtener todas las constancias
    obtenerTodos: (callback) => {
        const query = 'SELECT * FROM constancia';
        db.query(query, callback);
    },

    // Obtener una constancia por ID
    obtenerPorId: (id, callback) => {
        const query = 'SELECT * FROM constancia WHERE id_constancia = ?';
        db.query(query, [id], callback);
    },

    // Obtener una constancia por solicitud
    obtenerPorSolicitud: (id_solicitud, callback) => {
        const query = `
            SELECT * FROM constancia
            WHERE id_solicitud = ?
        `;

        db.query(query, [id_solicitud], callback);
    },

    // Crear una nueva constancia
    crear: (data, callback) => {
        const query = `
            INSERT INTO constancia
            (id_solicitud, tipo_constancia)
            VALUES (?, ?)
        `;

        db.query(query, [
            data.id_solicitud,
            data.tipo_constancia
        ], callback);
    },

    // Actualizar una constancia
    actualizar: (id, data, callback) => {
        const query = `
            UPDATE constancia
            SET id_solicitud = ?,
                tipo_constancia = ?
            WHERE id_constancia = ?
        `;

        db.query(query, [
            data.id_solicitud,
            data.tipo_constancia,
            id
        ], callback);
    },

    // Eliminar una constancia
    eliminar: (id, callback) => {
        const query = 'DELETE FROM constancia WHERE id_constancia = ?';
        db.query(query, [id], callback);
    }
};

module.exports = Constancia;