const db = require('../config/db'); 

const Rol = {
    // Obtener todos los roles
    obtenerTodos: (callback) => {
        const query = 'SELECT * FROM rol';
        db.query(query, callback);
    },

    // Obtener un rol por ID
    obtenerPorId: (id, callback) => {
        const query = 'SELECT * FROM rol WHERE id_rol = ?';
        db.query(query, [id], callback);
    },

    // Crear un nuevo rol
    crear: (data, callback) => {
        const query = `
            INSERT INTO rol (nombre)
            VALUES (?)
        `;

        db.query(query, [data.nombre], callback);
    },

    // Actualizar un rol
    actualizar: (id, data, callback) => {
        const query = `
            UPDATE rol
            SET nombre = ?
            WHERE id_rol = ?
        `;

        db.query(query, [data.nombre, id], callback);
    },

    // Eliminar un rol
    eliminar: (id, callback) => {
        const query = 'DELETE FROM rol WHERE id_rol = ?';
        db.query(query, [id], callback);
    }
};

module.exports = Rol;