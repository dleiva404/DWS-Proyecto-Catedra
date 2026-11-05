const token = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

if (!token) window.location.href = '/login/index.html';

const ROLES_REPORTES = ['Analista de Nómina', 'Gerente', 'Asistente de planilla'];

if (!ROLES_REPORTES.includes(usuario.rol)) {
    window.location.href = '/dashboard/dashboard.html';
}

document.getElementById('nombreUsuario').textContent = usuario.nombre || usuario.usuario || 'Usuario';

const filtroDesde = document.getElementById('filtroDesde');
const filtroHasta = document.getElementById('filtroHasta');
const filtroTipo = document.getElementById('filtroTipo');
const mensajeGeneral = document.getElementById('mensajeGeneral');
const tablaSaldos = document.getElementById('tablaSaldos');

const COLORES_ESTADO = {
    Pendiente: '#f59e0b',
    Aprobada: '#10b981',
    Rechazada: '#ef4444'
};

let graficoEstado = null;
let graficoMes = null;

async function cargarReporte() {
    mensajeGeneral.textContent = '';
    mensajeGeneral.className = 'mensaje';

    const parametros = new URLSearchParams();
    if (filtroDesde.value) parametros.append('desde', filtroDesde.value);
    if (filtroHasta.value) parametros.append('hasta', filtroHasta.value);
    if (filtroTipo.value) parametros.append('tipo', filtroTipo.value);

    try {
        const respuesta = await fetch('/api/reportes/resumen?' + parametros.toString(), {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (respuesta.status === 401) return salirSinSesion();

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            mostrarMensaje(datos.error || 'No se pudo cargar el reporte', 'error');
            return;
        }

        mostrarTotales(datos);
        dibujarGraficoEstado(datos.porEstado);
        dibujarGraficoMes(datos.porMes);
        mostrarSaldos(datos.saldos, datos.anio);

    } catch (error) {
        mostrarMensaje('No se pudo conectar con el servidor', 'error');
    }
}

function mostrarTotales(datos) {
    document.getElementById('totalPendientes').textContent = datos.totales.Pendiente || 0;
    document.getElementById('totalAprobadas').textContent = datos.totales.Aprobada || 0;
    document.getElementById('totalRechazadas').textContent = datos.totales.Rechazada || 0;
    document.getElementById('totalDias').textContent = datos.diasUsados;
}

function dibujarGraficoEstado(porEstado) {

    if (graficoEstado) graficoEstado.destroy();

    graficoEstado = new Chart(document.getElementById('graficoEstado'), {
        type: 'pie',
        data: {
            labels: porEstado.map(f => f.estado),
            datasets: [{
                data: porEstado.map(f => f.total),
                backgroundColor: porEstado.map(f => COLORES_ESTADO[f.estado] || '#94a3b8')
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

function dibujarGraficoMes(porMes) {
    if (graficoMes) graficoMes.destroy();

    graficoMes = new Chart(document.getElementById('graficoMes'), {
        type: 'bar',
        data: {
            labels: porMes.map(f => formatearMes(f.mes)),
            datasets: [{
                label: 'Solicitudes',
                data: porMes.map(f => f.total),
                backgroundColor: '#3b82f6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
}

function mostrarSaldos(saldos, anio) {
    document.getElementById('anioSaldos').textContent = '(' + anio + ')';

    if (!saldos.length) {
        tablaSaldos.innerHTML = '<tr><td colspan="5">No hay saldos registrados para este año.</td></tr>';
        return;
    }

    tablaSaldos.innerHTML = saldos.map(s => `
        <tr>
            <td>${escaparHTML(s.empleado)}</td>
            <td>${escaparHTML(s.cargo)}</td>
            <td>${s.dias_asignados}</td>
            <td>${s.dias_utilizados}</td>
            <td><strong>${s.dias_disponibles}</strong></td>
        </tr>
    `).join('');
}

function formatearMes(mes) {
    const nombres = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const [anio, numero] = mes.split('-');
    return nombres[Number(numero) - 1] + ' ' + anio;
}

function mostrarMensaje(texto, tipo) {
    mensajeGeneral.textContent = texto;
    mensajeGeneral.className = 'mensaje ' + tipo;
}

function escaparHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
}

function salirSinSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login/index.html';
}

document.getElementById('btnFiltrar').addEventListener('click', () => {
    if (filtroDesde.value && filtroHasta.value && filtroDesde.value > filtroHasta.value) {
        mostrarMensaje('La fecha "desde" no puede ser mayor que la fecha "hasta"', 'error');
        return;
    }
    cargarReporte();
});

document.getElementById('btnLimpiar').addEventListener('click', () => {
    filtroDesde.value = '';
    filtroHasta.value = '';
    filtroTipo.value = '';
    cargarReporte();
});

document.getElementById('cerrarSesion').addEventListener('click', async () => {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
    } catch (e) {
    }

    salirSinSesion();
});

cargarReporte();