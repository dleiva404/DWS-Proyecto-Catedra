const Reporte = require('../models/reporteModel');

function consultar(funcion, parametro) {
    return new Promise((resolve, reject) => {
        funcion(parametro, (error, resultado) => {
            if (error) return reject(error);
            resolve(resultado);
        });
    });
}

function validarFiltros(query) {
    const formatoFecha = /^\d{4}-\d{2}-\d{2}$/;

    if (query.desde && (!formatoFecha.test(query.desde) || isNaN(new Date(query.desde))))
        return 'La fecha "desde" no es válida';

    if (query.hasta && (!formatoFecha.test(query.hasta) || isNaN(new Date(query.hasta))))
        return 'La fecha "hasta" no es válida';

    if (query.desde && query.hasta && query.desde > query.hasta)
        return 'La fecha "desde" no puede ser mayor que la fecha "hasta"';

    if (query.tipo && !['1', '2'].includes(String(query.tipo)))
        return 'El tipo de solicitud no es válido';

    if (query.anio && !/^\d{4}$/.test(query.anio))
        return 'El año no es válido';

    return null;
}

// Devuelve todos los datos de la pantalla de reportes
const obtenerResumen = async (req, res) => {
    const error = validarFiltros(req.query);
    if (error) return res.status(400).json({ error });

    const filtros = {
        desde: req.query.desde || null,
        hasta: req.query.hasta || null,
        tipo: req.query.tipo || null
    };

    const anio = req.query.anio || new Date().getFullYear();

    try {
        const [porEstado, porTipo, porMes, saldos, diasUsados] = await Promise.all([
            consultar(Reporte.contarPorEstado, filtros),
            consultar(Reporte.contarPorTipo, filtros),
            consultar(Reporte.contarPorMes, filtros),
            consultar(Reporte.obtenerSaldos, anio),
            consultar(Reporte.sumarDiasUsados, anio)
        ]);

        const totales = { Pendiente: 0, Aprobada: 0, Rechazada: 0 };
        porEstado.forEach(fila => {
            totales[fila.estado] = fila.total;
        });

        res.json({
            anio: Number(anio),
            totales,
            diasUsados: Number(diasUsados[0].total),
            porEstado,
            porTipo,
            porMes,
            saldos
        });
    } catch (err) {
        console.error('Error al generar el reporte:', err);
        res.status(500).json({ error: 'Error al generar el reporte' });
    }
};

module.exports = {
    obtenerResumen
};