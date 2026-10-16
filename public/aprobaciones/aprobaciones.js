const token = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

if (!token) window.location.href = '/login/index.html';

const ROLES_APROBADORES = ['Jefe inmediato', 'Analista de Nómina', 'Gerente'];

if (!ROLES_APROBADORES.includes(usuario.rol)) {
    window.location.href = '/dashboard/dashboard.html';
}

document.getElementById('nombreUsuario').textContent = usuario.nombre || usuario.usuario || 'Usuario';
document.getElementById('descripcionRol').textContent = `Solicitudes que requieren tu revisión como ${usuario.rol}.`;

const tabla = document.getElementById('tablaPendientes');
const mensajeGeneral = document.getElementById('mensajeGeneral');
const modal = document.getElementById('modalRechazo');
const formRechazo = document.getElementById('formRechazo');
const comentario = document.getElementById('comentario');
const mensajeModal = document.getElementById('mensajeModal');

let etapaARechazar = null;

async function cargarPendientes() {
    try {
        const respuesta = await fetch('/api/solicitudes/pendientes', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (respuesta.status === 401) return salirSinSesion();
        if (!respuesta.ok) throw new Error();

        const pendientes = await respuesta.json();

        if (!pendientes.length) {
            tabla.innerHTML = '<tr><td colspan="8">No tienes solicitudes pendientes de revisar.</td></tr>';
            return;
        }

        tabla.innerHTML = pendientes.map(p => `
            <tr>
                <td>${p.id_solicitud}</td>
                <td>${escaparHTML(p.nombre + ' ' + p.apellido)}</td>
                <td>${escaparHTML(p.tipo)}</td>
                <td>${escaparHTML(p.nombre_etapa)}</td>
                <td>${formatearFecha(p.fecha_inicio)}</td>
                <td>${formatearFecha(p.fecha_fin)}</td>
                <td>${p.motivo ? escaparHTML(p.motivo) : '-'}</td>
                <td>
                    <div class="acciones">
                        <button class="btn-aprobar" data-etapa="${p.id_etapa_solicitud}">Aprobar</button>
                        <button class="btn-rechazar" data-etapa="${p.id_etapa_solicitud}">Rechazar</button>
                    </div>
                </td>
            </tr>`).join('');

    } catch (error) {
        tabla.innerHTML = '<tr><td colspan="8">No se pudieron cargar las solicitudes pendientes.</td></tr>';
    }
}

tabla.addEventListener('click', e => {
    const id = e.target.dataset.etapa;
    if (!id) return;

    if (e.target.classList.contains('btn-aprobar')) {
        e.target.disabled = true;
        resolver(id, 'Aprobada');
    }

    if (e.target.classList.contains('btn-rechazar')) {
        etapaARechazar = id;
        comentario.value = '';
        mensajeModal.textContent = '';
        modal.classList.remove('oculto');
    }
});

formRechazo.addEventListener('submit', async e => {
    e.preventDefault();

    if (!comentario.value.trim()) {
        mensajeModal.textContent = 'El motivo del rechazo es obligatorio.';
        mensajeModal.className = 'mensaje error';
        return;
    }

    const ok = await resolver(etapaARechazar, 'Rechazada', comentario.value.trim());
    if (ok) cerrarModal();
});

async function resolver(idEtapa, decision, motivoRechazo) {
    try {
        const respuesta = await fetch(`/api/solicitudes/etapa/${idEtapa}/resolver`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ decision, comentario: motivoRechazo || null })
        });

        if (respuesta.status === 401) return salirSinSesion();

        const resultado = await respuesta.json();

        if (!respuesta.ok) throw new Error(resultado.error || 'No se pudo resolver la solicitud');

        mostrarMensaje(resultado.mensaje, 'exito');
        cargarPendientes();
        return true;

    } catch (error) {
        mostrarMensaje(error.message, 'error');
        cargarPendientes();
        return false;
    }
}

function mostrarMensaje(texto, tipo) {
    mensajeGeneral.textContent = texto;
    mensajeGeneral.className = `mensaje ${tipo}`;
}

function cerrarModal() {
    modal.classList.add('oculto');
    etapaARechazar = null;
}

document.getElementById('cerrarModal').addEventListener('click', cerrarModal);

modal.addEventListener('click', e => {
    if (e.target === modal) cerrarModal();
});

function salirSinSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login/index.html';
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-SV');
}

function escaparHTML(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

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

cargarPendientes();