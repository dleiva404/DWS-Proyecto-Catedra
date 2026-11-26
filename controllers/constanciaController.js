const Constancia = require('../models/constanciaModel');

// datos que se muestran en el PDF y en la validacion
function armarDatos(fila) {
    return {
        codigo: fila.codigo,
        fecha_emision: fila.fecha_emision,
        tipo: fila.tipo_constancia,
        nombre: `${fila.nombre} ${fila.apellido}`,
        cargo: fila.cargo,
        fecha_ingreso: fila.fecha_ingreso,
        salario: Number(fila.salario),
        empleado_activo: Boolean(fila.empleado_activo)
    };
}

// El empleado descarga su constancia aprobada
const obtenerConstancia = (req, res) => {
    if (!/^\d+$/.test(req.params.id))
        return res.status(400).json({ error: 'El ID de la solicitud no es válido' });

    Constancia.obtenerDatos('solicitud', req.params.id, (err, filas) => {
        if (err) return res.status(500).json({ error: 'Error al consultar la constancia' });
        if (!filas.length) return res.status(404).json({ error: 'La constancia no existe o todavía no está aprobada' });

        if (filas[0].id_empleado !== req.usuario.id_empleado)
            return res.status(403).json({ error: 'Solo puede descargar sus propias constancias' });

        res.json(armarDatos(filas[0]));
    });
};

// Pagina publica: cualquiera con el codigo puede comprobar si es real
const validarConstancia = (req, res) => {
    const codigo = String(req.params.codigo || '').trim().toUpperCase();

    if (!/^GC-[0-9A-F]{8}$/.test(codigo))
        return res.status(400).json({ valida: false, error: 'El código no tiene un formato válido' });

    Constancia.obtenerDatos('codigo', codigo, (err, filas) => {
        if (err) return res.status(500).json({ valida: false, error: 'Error al validar la constancia' });
        if (!filas.length) return res.status(404).json({ valida: false, error: 'No existe una constancia con ese código' });

        res.json({ valida: true, ...armarDatos(filas[0]) });
    });
};

module.exports = {
    obtenerConstancia,
    validarConstancia
};
