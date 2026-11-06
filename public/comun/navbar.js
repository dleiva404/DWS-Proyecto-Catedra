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
