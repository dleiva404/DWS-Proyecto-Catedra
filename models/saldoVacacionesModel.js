const db = require('../config/db'); 

const SaldoVacaciones = {
    // Obtener todos los saldos de vacaciones
    obtenerTodos: (callback) => {
        const query = 'SELECT * FROM saldo_vacaciones';
        db.query(query, callback);
    },

    // Obtener un saldo de vacaciones por ID
    obtenerPorId: (id, callback) => {
        const query = 'SELECT * FROM saldo_vacaciones WHERE id_saldo = ?';
        db.query(query, [id], callback);
    },

    // Obtener el saldo de vacaciones de un empleado para un año específico
    obtenerPorEmpleadoAnio: (id_empleado, anio, callback) => {
        const query = `
            SELECT * FROM saldo_vacaciones
            WHERE id_empleado = ? AND anio = ?
        `;

        db.query(query, [id_empleado, anio], callback);
    },

    // Crear un nuevo saldo de vacaciones
    crear: (data, callback) => {
        const query = `
            INSERT INTO saldo_vacaciones
            (id_empleado, anio, dias_asignados, dias_utilizados)
            VALUES (?, ?, ?, ?)
        `;

        db.query(query, [
            data.id_empleado,
            data.anio,
            data.dias_asignados,
            data.dias_utilizados
        ], callback);
    },

    // Actualizar el saldo de vacaciones
    actualizar: (id, data, callback) => {
        const query = `
            UPDATE saldo_vacaciones
            SET dias_asignados = ?,
                dias_utilizados = ?
            WHERE id_saldo = ?
        `;

        db.query(query, [
            data.dias_asignados,
            data.dias_utilizados,
            id
        ], callback);
    }
};

module.exports = SaldoVacaciones;