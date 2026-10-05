const db = require('../config/db');

class AuthModel {
    // Verificar usuario y rol
    static async buscarPorUsuario(usuario) {
        const [rows] = await db.promise().query(
            `SELECT u.id_usuario, u.usuario, u.contrasena_hash, u.estado,
                    r.nombre AS rol, e.id_empleado, e.nombre, e.apellido
             FROM usuario u
             JOIN rol r ON r.id_rol = u.id_rol
             LEFT JOIN empleado e ON e.id_usuario = u.id_usuario
             WHERE u.usuario = ?`,
            [usuario]
        );
        return rows[0];
    }
}

module.exports = AuthModel;