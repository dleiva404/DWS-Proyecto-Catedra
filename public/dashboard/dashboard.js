const token = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

if (!token) window.location.href = '/login/index.html';

const nombre = usuario.nombre || usuario.usuario || 'Usuario';

document.getElementById('nombreUsuario').textContent = nombre;
document.getElementById('nombreBienvenida').textContent = nombre;

async function cargarSolicitudes() {
    try {
        const respuesta = await fetch('/api/solicitudes/mis-solicitudes', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (respuesta.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = '/login/index.html';
            return;
        }

        if (!respuesta.ok) throw new Error();

        const solicitudes = await respuesta.json();

        document.getElementById('pendientes').textContent = solicitudes.filter(s => s.estado === 'Pendiente').length;
        document.getElementById('aprobadas').textContent = solicitudes.filter(s => s.estado === 'Aprobada').length;
        document.getElementById('rechazadas').textContent = solicitudes.filter(s => s.estado === 'Rechazada').length;

        const tabla = document.getElementById('tablaSolicitudes');

        if (!solicitudes.length) {
            tabla.innerHTML = '<tr><td colspan="4">No tienes solicitudes.</td></tr>';
            return;
        }

        tabla.innerHTML = solicitudes.slice(0, 4).map(s => {
            const tipo = Number(s.id_tipo_solicitud) === 1 ? 'Vacaciones' : Number(s.id_tipo_solicitud) === 2 ? 'Permiso' : 'Constancia';
            const estado = s.estado.toLowerCase();

            return `
                <tr>
                    <td>${s.id_solicitud}</td>
                    <td>${tipo}</td>
                    <td>${formatearFecha(s.fecha_solicitud)}</td>
                    <td><span class="estado estado-${estado}">${s.estado}</span></td>
                </tr>`;
        }).join('');

    } catch (error) {
        document.getElementById('tablaSolicitudes').innerHTML = '<tr><td colspan="4">No se pudieron cargar las solicitudes.</td></tr>';
    }
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-SV');
}

document.getElementById('cerrarSesion').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login/index.html';
});

cargarSolicitudes();