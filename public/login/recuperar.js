// Formulario para solicitar recuperación
const formOlvide = document.getElementById('formOlvide');

if (formOlvide) {
    formOlvide.addEventListener('submit', async (e) => {
        e.preventDefault();

        const correo = document.getElementById('correo').value.trim();
        const mensaje = document.getElementById('mensaje');
        const boton = formOlvide.querySelector('button[type="submit"]');

        mensaje.textContent = '';
        mensaje.className = 'mensaje';
        boton.disabled = true;

        try {
            const respuesta = await fetch('/api/auth/olvide-contrasena', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ correo })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                mensaje.textContent = datos.error || 'No se pudo procesar la solicitud.';
                mensaje.className = 'mensaje error';
                return;
            }

            mensaje.textContent = datos.mensaje;
            mensaje.className = 'mensaje exito';

            formOlvide.reset();

        } catch (error) {
            mensaje.textContent = 'No se pudo conectar con el servidor.';
            mensaje.className = 'mensaje error';
        } finally {
            boton.disabled = false;
        }
    });
}

// Formulario para restablecer contraseña
const formRestablecer = document.getElementById('formRestablecer');

if (formRestablecer) {
    formRestablecer.addEventListener('submit', async (e) => {
        e.preventDefault();

        const mensaje = document.getElementById('mensaje');
        const contrasena = document.getElementById('contrasena').value;
        const confirmarContrasena = document.getElementById('confirmarContrasena').value;
        const boton = formRestablecer.querySelector('button[type="submit"]');

        mensaje.textContent = '';
        mensaje.className = 'mensaje';

        if (contrasena !== confirmarContrasena) {
            mensaje.textContent = 'Las contraseñas no coinciden.';
            mensaje.className = 'mensaje error';
            return;
        }

        const parametros = new URLSearchParams(window.location.search);
        const token = parametros.get('token');

        if (!token) {
            mensaje.textContent = 'El enlace de recuperación no contiene un token válido.';
            mensaje.className = 'mensaje error';
            return;
        }

        boton.disabled = true;

        try {
            const respuesta = await fetch('/api/auth/restablecer-contrasena', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    contrasena
                })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                mensaje.textContent = datos.error || 'No se pudo cambiar la contraseña.';
                mensaje.className = 'mensaje error';
                return;
            }

            mensaje.textContent = datos.mensaje;
            mensaje.className = 'mensaje exito';

            formRestablecer.reset();

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2500);

        } catch (error) {
            mensaje.textContent = 'No se pudo conectar con el servidor.';
            mensaje.className = 'mensaje error';
        } finally {
            boton.disabled = false;
        }
    });
}
