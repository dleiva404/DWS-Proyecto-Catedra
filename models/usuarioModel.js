const db = require('../config/db'); 

const Usuario = {
    // Obtener todos los usuarios
    obtenerTodos: (callback) => {
        const query = 'SELECT * FROM usuario';
        db.query(query, callback);
    },

    // Obtener un usuario por ID
    obtenerPorId: (id, callback) => {
        const query = 'SELECT * FROM usuario WHERE id_usuario = ?';
        db.query(query, [id], callback);
    },

    // Crear un nuevo usuario
    crear: (data, callback) => {
        const query = `
            INSERT INTO usuario 
            (id_rol, usuario, contrasena_hash, estado)
            VALUES (?, ?, ?, ?)
        `;

        db.query(query, [
            data.id_rol,
            data.usuario,
            data.contrasena_hash,
            data.estado
        ], callback);
    },

    // Actualizar un usuario
    actualizar: (id, data, callback) => {
        const query = `
            UPDATE usuario
            SET id_rol = ?,
                usuario = ?,
                contrasena_hash = ?,
                estado = ?
            WHERE id_usuario = ?
        `;

        db.query(query, [
            data.id_rol,
            data.usuario,
            data.contrasena_hash,
            data.estado,
            id
        ], callback);
    },

    // Eliminar un usuario
    eliminar: (id, callback) => {
        const query = 'DELETE FROM usuario WHERE id_usuario = ?';
        db.query(query, [id], callback);
    }
};

module.exports = Usuario;