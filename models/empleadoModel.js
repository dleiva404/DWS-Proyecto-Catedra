const db = require('../config/db');

const Empleado = {
    // Obtener todos los empleados
    obtenerTodos: (callback) => {
        const query = 'SELECT * FROM empleado';
        db.query(query, callback);
    },

    // Obtener un empleado por ID
    obtenerPorId: (id, callback) => {
        const query = 'SELECT * FROM empleado WHERE id_empleado = ?';
        db.query(query, [id], callback);
    },

    // Crear un nuevo empleado
    crear: (data, callback) => {
        const query = `
            INSERT INTO empleado 
            (id_usuario, id_supervisor, nombre, apellido, correo, cargo, fecha_ingreso, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(query, [
            data.id_usuario,
            data.id_supervisor,
            data.nombre,
            data.apellido,
            data.correo,
            data.cargo,
            data.fecha_ingreso,
            data.estado
        ], callback);
    },

    // Actualizar un empleado
    actualizar: (id, data, callback) => {
        const query = `
            UPDATE empleado
            SET id_usuario = ?,
                id_supervisor = ?,
                nombre = ?,
                apellido = ?,
                correo = ?,
                cargo = ?,
                fecha_ingreso = ?,
                estado = ?
            WHERE id_empleado = ?
        `;

        db.query(query, [
            data.id_usuario,
            data.id_supervisor,
            data.nombre,
            data.apellido,
            data.correo,
            data.cargo,
            data.fecha_ingreso,
            data.estado,
            id
        ], callback);
    },

    // Eliminar un empleado
    eliminar: (id, callback) => {
        const query = 'DELETE FROM empleado WHERE id_empleado = ?';
        db.query(query, [id], callback);
    }
};

module.exports = Empleado;