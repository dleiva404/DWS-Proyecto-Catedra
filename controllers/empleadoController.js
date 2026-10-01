const Empleado = require('../models/empleadoModel');

// Controlador para listar todos los empleados
const listarEmpleados = (req, res) => {
    Empleado.obtenerTodos((err, resultados) => {
        if (err) {
            console.error('Error al obtener empleados:', err);
            return res.status(500).json({ error: 'Error interno del servidor al consultar empleados' });
        }
        res.json(resultados);
    });
};

// Controlador para crear un nuevo empleado
const crearEmpleado = (req, res) => {
    const nuevoEmpleado = req.body;
    
    Empleado.crear(nuevoEmpleado, (err, resultado) => {
        if (err) {
            console.error('Error al crear empleado:', err);
            return res.status(500).json({ error: 'Error al registrar el empleado en la base de datos' });
        }
        res.status(201).json({ mensaje: 'Empleado creado exitosamente', id: resultado.insertId });
    });
};

module.exports = {
    listarEmpleados,
    crearEmpleado
};