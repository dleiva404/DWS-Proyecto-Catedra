const enviarCorreo = async ({ destinatario, asunto, html }) => {
    const apiKey = process.env.BREVO_API_KEY;
    const remitente = process.env.CORREO_REMITENTE;

    // Si no hay configuración de Brevo, muestra el correo en consola.
    if (!apiKey || !remitente) {
        console.log('\n===== CORREO DE PRUEBA =====');
        console.log('Para:', destinatario);
        console.log('Asunto:', asunto);
        console.log('Contenido:', html);
        console.log('============================\n');
        return;
    }

    const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: {
                email: remitente
            },
            to: [
                {
                    email: destinatario
                }
            ],
            subject: asunto,
            htmlContent: html
        })
    });

    if (!respuesta.ok) {
        const error = await respuesta.text();
        throw new Error(`Error enviando correo con Brevo: ${error}`);
    }

    return await respuesta.json();
};

module.exports = {
    enviarCorreo
};
