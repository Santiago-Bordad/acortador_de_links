// ─────────────────────────────────────────────
// 1. AGARRAR LOS ELEMENTOS DE LA PÁGINA (by chatgpt // no sabía como hacerlo bien me tiraba error)
// ─────────────────────────────────────────────

const formulario = document.getElementById('formulario');
const inputUrl = document.getElementById('url');
const inputSlug = document.getElementById('slug');
const mensaje = document.getElementById('mensaje');
const resultado = document.getElementById('resultado');
const linkCorto = document.getElementById('link-corto');
const botonCopiar = document.getElementById('copiar');
// "document" es la página. getElementById busca el elemento con ese id.
// Los guardamos en variables para no buscarlos cada vez.


// ─────────────────────────────────────────────
// 2. CUANDO SE ENVÍA EL FORMULARIO
// ─────────────────────────────────────────────

formulario.addEventListener('submit', async (evento) => {
    // addEventListener = "cuando pase X, ejecutá esta función".
    // 'submit' = cuando se envía el formulario (botón Acortar o Enter).
    // async = esta función va a ESPERAR cosas (la respuesta del servidor).

    evento.preventDefault();
    // Por defecto, enviar un formulario RECARGA la página. Esto lo impide:
    // queremos mandar los datos nosotros, sin recargar.

    mensaje.textContent = '';
    resultado.hidden = true;
    // Limpiamos lo del intento anterior.

    const respuesta = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl.value, slug: inputSlug.value }),
    });
    // fetch = hacer un pedido al servidor. Es EXACTAMENTE lo que hacías con
    // Invoke-RestMethod, pero desde la página:
    //   method: 'POST'          → -Method Post
    //   headers: Content-Type   → -ContentType "application/json"
    //   body: JSON.stringify()  → -Body '{...}'
    //     (convierte el objeto de JavaScript en texto JSON)
    // .value = lo que la persona escribió en cada campo.
    // await = "esperá a que el servidor conteste antes de seguir".

    const datos = await respuesta.json();
    // Desarma el JSON de la respuesta y lo convierte en objeto:
    // { slug, url, linkCorto } si salió bien, o { error } si no.

    if (!respuesta.ok) {
        mensaje.textContent = datos.error;
        return;
    }
    // respuesta.ok es true para los códigos 200-299 (nuestro 201)
    // y false para 400, 409, etc. Si falló, mostramos el error
    // que mandó el servidor ("Ese nombre ya está usado") y cortamos.

    linkCorto.textContent = datos.linkCorto;
    linkCorto.href = datos.linkCorto;
    resultado.hidden = false;
    // textContent = el texto que se ve; href = adónde lleva el link.
    // Y mostramos el bloque que estaba oculto.

    formulario.reset();
    // Vacía los campos para el próximo link.
});


// ─────────────────────────────────────────────
// 3. EL BOTÓN COPIAR
// ─────────────────────────────────────────────

botonCopiar.addEventListener('click', async () => {
    await navigator.clipboard.writeText(linkCorto.textContent);
    // navigator.clipboard = el portapapeles (lo que pegás con Ctrl+V).

    botonCopiar.textContent = '¡Copiado!';
    setTimeout(() => {
        botonCopiar.textContent = 'Copiar';
    }, 500);
    // setTimeout = "ejecutá esto dentro de X milisegundos".
    // A los 0.5 segundos el botón vuelve a decir "Copiar".
});