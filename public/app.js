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
const lista = document.getElementById('lista');   // el cuerpo de la tabla (<tbody>)
const vacio = document.getElementById('vacio');   // el cartel "Todavía no creaste ningún link"
// "document" es la página. getElementById busca el elemento con ese id.
// Los guardamos en variables para no buscarlos cada vez.


// ─────────────────────────────────────────────
// 2. RECORDAR LOS LINKS DE ESTE NAVEGADOR
// ─────────────────────────────────────────────

// lee la lista de nombres que este navegador creó
function leerMisSlugs() {
    try {
        return JSON.parse(localStorage.getItem('misLinks')) || [];
    } catch {
        return [];
    }
}
// localStorage = una memoria chiquita que tiene cada navegador para cada sitio.
// localStorage.getItem('misLinks') → el texto guardado con ese nombre (o null si no hay nada)
// JSON.parse(...)                  → lo convierte de texto a lista
// || []                            → si no había nada, una lista vacía
// try/catch → si el navegador bloquea el localStorage (pasa en algunos modos
//             privados), no se rompe la página: simplemente no hay lista.

// agrega un nombre nuevo al principio de la lista
function guardarMiSlug(slug) {
    const slugs = leerMisSlugs();
    slugs.unshift(slug); // unshift = agregar al PRINCIPIO (así el más nuevo queda primero)
    try {
        localStorage.setItem('misLinks', JSON.stringify(slugs)); // guarda la lista como texto
    } catch {
        // si no se puede guardar, el link igual se creó; solo no aparece en la tabla
    }
}


// ─────────────────────────────────────────────
// 3. LLENAR LA TABLA DE "MIS LINKS"
// ─────────────────────────────────────────────

async function cargarLinks() {
    const slugs = leerMisSlugs();

    if (slugs.length === 0) {
        lista.innerHTML = '';
        vacio.hidden = false;
        return;
    }
    // si este navegador todavía no creó nada, no hace falta preguntarle al servidor

    const respuesta = await fetch('/api/mis-links?slugs=' + encodeURIComponent(slugs.join(',')));
    const links = await respuesta.json();
    // slugs.join(',')         → ['cv', 'k3x9a'] pasa a "cv,k3x9a"
    // encodeURIComponent(...) → lo prepara para que viaje bien dentro de una dirección
    // nos llega la lista de esos links, con su destino y sus clics

    lista.innerHTML = '';
    // Vacía la tabla antes de llenarla, así no se duplican las filas
    // cada vez que la cargamos.

    vacio.hidden = links.length > 0;
    // links.length = cuántos links hay. Si hay al menos uno, ocultamos
    // el cartel de "Todavía no creaste ningún link".

    for (const link of links) {
        // "for...of" recorre la lista: en cada vuelta, "link" es una fila,
        // por ejemplo { slug: 'cv', url: 'https://...', clicks: 3, ... }

        const fila = document.createElement('tr');
        // createElement CREA un elemento nuevo (todavía no se ve).

        const celdaCorto = document.createElement('td');
        const enlace = document.createElement('a');
        enlace.href = '/' + link.slug;
        enlace.textContent = '/' + link.slug;
        enlace.target = '_blank';
        celdaCorto.append(enlace);
        // append = meter un elemento adentro de otro: el link va en la celda.

        const celdaDestino = document.createElement('td');
        celdaDestino.textContent = link.url;
        celdaDestino.className = 'destino';
        // className le pone una clase de CSS (la usamos en style.css
        // para cortar los links muy largos con "...").
        // Usamos textContent y no innerHTML porque los links los escribe
        // cualquiera: con innerHTML, si alguien pone código HTML, el
        // navegador lo ejecutaría (un ataque que se llama XSS).

        const celdaClics = document.createElement('td');
        celdaClics.textContent = link.clicks;

        fila.append(celdaCorto, celdaDestino, celdaClics);
        lista.append(fila);
        // Las tres celdas van en la fila, y la fila en la tabla. Ahí se ve.
    }
}

cargarLinks();
// La llamamos una vez apenas se abre la página.

window.addEventListener('focus', cargarLinks);
// "focus" = cuando volvés a esta pestaña. Así, si abriste un link corto
// en otra pestaña y volvés, el contador de clics ya está actualizado.


// ─────────────────────────────────────────────
// 4. CUANDO SE ENVÍA EL FORMULARIO
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

    guardarMiSlug(datos.slug); // lo recordamos en este navegador
    cargarLinks();             // y lo mostramos en la tabla sin recargar
});


// ─────────────────────────────────────────────
// 5. EL BOTÓN COPIAR
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