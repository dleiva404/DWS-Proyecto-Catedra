const loginForm = document.getElementById('loginForm');
const mensaje = document.getElementById('mensaje');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = document.getElementById('usuario').value.trim();
    const contrasena = document.getElementById('contrasena').value;

    mensaje.textContent = '';
    mensaje.className = 'mensaje';

    try {
        const respuesta = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario,
                contrasena
            })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            mensaje.textContent = datos.error || 'Usuario o contraseña incorrectos';
            mensaje.className = 'mensaje error';
            return;
        }

        localStorage.setItem('token', datos.token);
        localStorage.setItem('usuario', JSON.stringify(datos.usuario || {}));

        mensaje.textContent = 'Inicio de sesión correcto';
        mensaje.className = 'mensaje exito';

        setTimeout(() => {
            window.location.href = '/dashboard/dashboard.html';
        }, 500);

    } catch (error) {
        mensaje.textContent = 'No se pudo conectar con el servidor';
        mensaje.className = 'mensaje error';
    }
});

document.getElementById('olvidaste').addEventListener('click', (e) => {
    e.preventDefault();

    mensaje.textContent = 'Contacta a RRHH para recuperar tu contraseña';
    mensaje.className = 'mensaje';
});