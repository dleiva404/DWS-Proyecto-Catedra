const usuarioNavbar = JSON.parse(localStorage.getItem('usuario') || '{}');

const opcionesNavbar = {
    navAprobaciones: ['Jefe inmediato', 'Analista de Nómina', 'Gerente'],
    navUsuarios: ['Administrador de TI'],
    navEmpleados: ['Administrador de TI', 'Asistente de planilla', 'Analista de Nómina', 'Gerente'],
    navReportes: ['Analista de Nómina', 'Gerente', 'Asistente de planilla']
};

for (const id in opcionesNavbar) {
    const enlace = document.getElementById(id);
    if (enlace && opcionesNavbar[id].includes(usuarioNavbar.rol)) {
        enlace.style.display = '';
    }
}

// nombre corto: primer nombre y primer apellido
const nombreCorto = usuarioNavbar.nombre
    ? usuarioNavbar.nombre.split(' ')[0] + ' ' + (usuarioNavbar.apellido || '').split(' ')[0]
    : (usuarioNavbar.usuario || 'Usuario');

// tarjeta con el nombre y el rol
const tarjetaUsuario = document.getElementById('nombreUsuario');
if (tarjetaUsuario) {
    tarjetaUsuario.textContent = nombreCorto;
    const rolUsuario = document.createElement('small');
    rolUsuario.textContent = usuarioNavbar.rol || '';
    rolUsuario.style.cssText = 'font-size:11px;font-weight:500;color:#2563eb;';
    tarjetaUsuario.appendChild(rolUsuario);
    tarjetaUsuario.style.cssText = 'display:flex;flex-direction:column;line-height:1.3;padding:4px 12px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;';
}

// bienvenida del dashboard
const bienvenida = document.getElementById('nombreBienvenida');
if (bienvenida) bienvenida.textContent = nombreCorto;

// ===== Notificaciones (campana) =====
const tokenNavbar = localStorage.getItem('token');
const claveVistos = 'avisosVistos_' + (usuarioNavbar.usuario || '');

function leerVistos() {
    try {
        return JSON.parse(localStorage.getItem(claveVistos) || '[]');
    } catch (error) {
        return [];
    }
}

async function cargarAvisos() {
    const areaUsuario = document.querySelector('.usuario-area');
    if (!areaUsuario || !tokenNavbar) return;

    const avisos = [];
    const cabecera = { headers: { Authorization: `Bearer ${tokenNavbar}` } };

    // aprobadores: solicitudes que esperan su revision
    if (['Jefe inmediato', 'Analista de Nómina', 'Gerente'].includes(usuarioNavbar.rol)) {
        const respuesta = await fetch('/api/solicitudes/pendientes', cabecera);
        if (respuesta.ok) {
            (await respuesta.json()).forEach(p => avisos.push({
                texto: `Por revisar: ${p.tipo} de ${p.nombre} ${p.apellido} (#${p.id_solicitud})`,
                enlace: '/aprobaciones/aprobaciones.html'
            }));
        }
    }

    // todos: sus solicitudes ya resueltas que todavia no ha visto
    const vistos = leerVistos();
    const respuesta = await fetch('/api/solicitudes/mis-solicitudes', cabecera);
    if (respuesta.ok) {
        (await respuesta.json())
            .filter(s => (s.estado === 'Aprobada' || s.estado === 'Rechazada') && !vistos.includes(s.id_solicitud))
            .forEach(s => avisos.push({
                texto: `Tu solicitud #${s.id_solicitud} fue ${s.estado.toLowerCase()}`,
                enlace: '/solicitudes/solicitudes.html',
                id: s.id_solicitud
            }));
    }

    dibujarCampana(areaUsuario, avisos);
}

function dibujarCampana(areaUsuario, avisos) {
    const contenedor = document.createElement('div');
    contenedor.className = 'notificaciones';
    contenedor.innerHTML = `
        <button type="button" class="btn-campana" title="Notificaciones">🔔
            ${avisos.length ? `<span class="contador-avisos">${avisos.length}</span>` : ''}
        </button>
        <div class="lista-avisos" hidden></div>`;

    const lista = contenedor.querySelector('.lista-avisos');
    if (!avisos.length) lista.innerHTML = '<p>No tienes notificaciones.</p>';

    avisos.forEach(aviso => {
        const enlace = document.createElement('a');
        enlace.href = aviso.enlace;
        enlace.textContent = aviso.texto;

        // al abrir un aviso de "tu solicitud fue..." se marca como visto
        if (aviso.id) {
            enlace.addEventListener('click', () => {
                localStorage.setItem(claveVistos, JSON.stringify([...leerVistos(), aviso.id]));
            });
        }
        lista.appendChild(enlace);
    });

    contenedor.querySelector('.btn-campana').addEventListener('click', () => {
        lista.hidden = !lista.hidden;
    });

    areaUsuario.prepend(contenedor);
}

cargarAvisos().catch(() => {});
