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
        cargarTodas();
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

async function cargarTodas() {
    const tablaTodas = document.getElementById('tablaTodas');

    try {
        const respuesta = await fetch('/api/solicitudes', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (respuesta.status === 401) return salirSinSesion();
        if (!respuesta.ok) throw new Error();

        const solicitudes = await respuesta.json();

        // Se aplican los mismos filtros de arriba
        const nombresTipo = { 1: 'Vacaciones', 2: 'Permiso' };

        const filtradas = solicitudes.filter(s => {
            const fecha = new Date(s.fecha_solicitud).toLocaleDateString('en-CA');

            if (filtroDesde.value && fecha < filtroDesde.value) return false;
            if (filtroHasta.value && fecha > filtroHasta.value) return false;
            if (filtroTipo.value && s.tipo !== nombresTipo[filtroTipo.value]) return false;

            return true;
        });

        document.getElementById('totalTodas').textContent = '(' + filtradas.length + ')';

        if (!filtradas.length) {
            tablaTodas.innerHTML = '<tr><td colspan="9">No hay solicitudes con esos filtros.</td></tr>';
            return;
        }

        tablaTodas.innerHTML = filtradas.map(s => `
            <tr>
                <td>${s.id_solicitud}</td>
                <td>${escaparHTML(s.nombre + ' ' + s.apellido)}</td>
                <td>${escaparHTML(s.tipo)}</td>
                <td>${formatearFecha(s.fecha_solicitud)}</td>
                <td>${formatearFecha(s.fecha_inicio)}</td>
                <td>${formatearFecha(s.fecha_fin)}</td>
                <td><span class="estado estado-${s.estado.toLowerCase()}">${s.estado}</span></td>
                <td>${s.etapa_actual ? escaparHTML(s.etapa_actual) : '-'}</td>
                <td><button type="button" class="btn-adjunto btn-historial" data-id="${s.id_solicitud}">Ver historial</button></td>
            </tr>
        `).join('');

    } catch (error) {
        tablaTodas.innerHTML = '<tr><td colspan="9">No se pudieron cargar las solicitudes.</td></tr>';
    }
}

async function verHistorial(id) {
    const modalHistorial = document.getElementById('modalHistorial');
    const tablaHistorial = document.getElementById('tablaHistorial');
    const resumen = document.getElementById('historialResumen');

    document.getElementById('historialId').textContent = '#' + id;
    resumen.textContent = '';
    tablaHistorial.innerHTML = '<tr><td colspan="6">Cargando...</td></tr>';
    modalHistorial.classList.remove('oculto');

    try {
        const respuesta = await fetch(`/api/solicitudes/${id}/historial`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) throw new Error(datos.error || 'No se pudo cargar el historial.');

        const pendiente = datos.etapas.find(etapa => etapa.estado === 'Pendiente');

        resumen.textContent = pendiente
            ? 'En espera de: ' + pendiente.nombre_etapa
            : 'Estado final: ' + datos.solicitud.estado;

        tablaHistorial.innerHTML = datos.etapas.map(etapa => `
            <tr>
                <td>${etapa.orden}</td>
                <td>${escaparHTML(etapa.nombre_etapa)}</td>
                <td><span class="estado estado-${etapa.estado.toLowerCase()}">${etapa.estado}</span></td>
                <td>${etapa.responsable ? escaparHTML(etapa.responsable) : '-'}</td>
                <td>${formatearFecha(etapa.fecha_resolucion)}</td>
                <td>${etapa.comentario ? escaparHTML(etapa.comentario) : '-'}</td>
            </tr>
        `).join('');

    } catch (error) {
        tablaHistorial.innerHTML = `<tr><td colspan="6">${escaparHTML(error.message)}</td></tr>`;
    }
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-SV');
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
    if (fil