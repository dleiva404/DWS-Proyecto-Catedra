const db = require('../config/db'); 
const Empleado = {
    // Obtener todos los empleados
    obtenerTodos: (callback) => {
        const query = 'SELECT * FROM empleados';
        db.query(query, callback);
    },

    // Crear un nuevo empleado
    crear: (data, callback) => {
        const query = 'INSERT INTO empleados (nombre, apellido, email, cargo, salario, fecha_contratacion) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(query, [data.nombre, data.apellido, data.email, data.cargo, data.salario, data.fecha_contratacion], callback);
    }
};

module.exports = Empleado;