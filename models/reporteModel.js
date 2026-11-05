const db = require('../config/db');

function armarFiltros(filtros) {
    let where = 'WHERE 1 = 1';
    const valores = [];

    if (filtros.desde) {
        where += ' AND DATE(s.fecha_solicitud) >= ?';
        valores.push(filtros.desde);
    }

    if (filtros.hasta) {
        where += ' AND DATE(s.fecha_solicitud) <= ?';
        valores.push(filtros.hasta);
    }

    if (filtros.tipo) {
        where += ' AND s.id_tipo_solicitud = ?';
        valores.push(filtros.tipo);
    }

    return { where, valores };
}

const Reporte = {
    // Total de solicitudes por estado
    contarPorEstado: (filtros, callback) => {
        const { where, valores } = armarFiltros(filtros);
        const query = `
            SELECT s.estado, COUNT(*) AS total
            FROM solicitud s
            ${where}
            GROUP BY s.estado
        `;
        db.query(query, valores, callback);
    },

    // Total de solicitudes por tipo (Vacaciones o Permiso)
    contarPorTipo: (filtros, callback) => {
        const { where, valores } = armarFiltros(filtros);
        const query = `
            SELECT ts.nombre AS tipo, COUNT(*) AS total
            FROM solicitud s
            JOIN tipo_solicitud ts ON ts.id_tipo_solicitud = s.id_tipo_solicitud
            ${where}
            GROUP BY ts.nombre
        `;
        db.query(query, valores, callback);
    },

    // Total de solicitudes por mes
    contarPorMes: (filtros, callback) => {
        const { where, valores } = armarFiltros(filtros);
        const query = `
            SELECT DATE_FORMAT(s.fecha_solicitud, '%Y-%m') AS mes, COUNT(*) AS total
            FROM solicitud s
            ${where}
            GROUP BY mes
            ORDER BY mes
        `;
        db.query(query, valores, callback);
    },

    // Saldo de vacaciones de cada empleado activo en un año
    obtenerSaldos: (anio, callback) => {
        const query = `
            SELECT e.id_empleado,
                   CONCAT(e.nombre, ' ', e.apellido) AS empleado,
                   e.cargo,
                   sv.dias_asignados,
                   sv.dias_utilizados,
                   (sv.dias_asignados - sv.dias_utilizados) AS dias_disponibles
            FROM saldo_vacaciones sv
            JOIN empleado e ON e.id_empleado = sv.id_empleado
            WHERE sv.anio = ? AND e.estado = TRUE
            ORDER BY empleado
        `;
        db.query(query, [anio], callback);
    },

    // Total de dias de vacaciones usados en un año
    sumarDiasUsados: (anio, callback) => {
        const query = `
            SELECT COALESCE(SUM(dias_utilizados), 0) AS total
            FROM saldo_vacaciones
            WHERE anio = ?
        `;
        db.query(query, [anio], callback);
    }
};

module.exports = Reporte;