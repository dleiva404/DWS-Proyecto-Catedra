
const db = require('../config/db');

const Usuario = {
    // Listar usuarios con el nombre de su rol
    obtenerTodos: (callback) => {
        const query = `
            SELECT u.id_usuario, u.id_rol, u.usuario, u.estado,
                   r.nombre AS nombre_rol
            FROM usuario u
            LEFT JOIN rol r ON u.id_rol = r.id_rol
            ORDER BY u.id_usuario
        `;
        db.query(query, callback);
    },

    // Obtener usuario por ID
    obtenerPorId: (id, callback) => {
        const query = `
            SELECT u.id_usuario, u.id_rol, u.usuario, u.estado,
                   r.nombre AS nombre_rol
            FROM usuario u
            LEFT JOIN rol r ON u.id_rol = r.id_rol
            WHERE u.id_usuario = ?
        `;
        db.query(query, [id], callback);
    },

    // Crear usuario
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

    // Actualizar usuario; conserva la contraseña si no se cambia
    actualizar: (id, data, callback) => {
        const query = `
            UPDATE usuario
            SET id_rol = ?,
                usuario = ?,
                contrasena_hash = COALESCE(?, contrasena_hash),
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

    // Desactivar sin eliminar el registro
    eliminar: (id, callback) => {
        const query = `
            UPDATE usuario
            SET estado = FALSE
            WHERE id_usuario = ?
        `;

        db.query(query, [id], callback);
    }
};

module.exports = Usuario;
