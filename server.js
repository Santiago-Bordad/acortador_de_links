const express = require('express');
const path = require('path');
const { rateLimit } = require('express-rate-limit'); // limita cuántos links puede crear cada persona
const { crearLink, buscarLink, listarLinks, sumarClick } = require('./db'); // importa las funciones que se crearon en db.js

// carga las variables del archivo .env (si no existe, sigue igual)
try {
    process.loadEnvFile();
} catch {
    // en el servidor de la fase 6 las variables se configuran en la web, no en un archivo
}

const app = express();
const PORT = process.env.PORT || 3000;

// contraseña para ver la lista completa de links; si no está, el servidor no arranca
const PASSWORD = process.env.PANEL_PASSWORD;
if (!PASSWORD) {
    console.error('Falta PANEL_PASSWORD en el archivo .env');
    process.exit(1); // apaga el programa: mejor no arrancar que dejar la lista abierta
}

app.use(express.json()); // desarma el JSON que llega en el body y lo pone en req.body como objeto de JS
app.use(express.static(path.join(__dirname, 'public'))); // muestra los archivos de la carpeta "public" (ahora sin contraseña)

// genera un nombre corto al azar, por ejemplo "k3x9a"
function generarSlug() {
    const letras = 'abcdefghjkmnpqrstuvwxyz23456789'; // sin l, i, o, 0 ni 1 para que no se confundan
    let slug = '';
    for (let i = 0; i < 5; i++) {
        slug += letras[Math.floor(Math.random() * letras.length)];
    }
    return slug;
}

// nombres que no se pueden usar porque chocan con rutas de la app
const RESERVADOS = ['api', 'ping', 'admin', 'login'];

// solo letras minúsculas, números y guiones, de 1 a 30 caracteres
const FORMATO_SLUG = /^[a-z0-9-]{1,30}$/;
// Esto es una "expresión regular" (regex): un patrón para revisar texto.

// devuelve true si el texto es un link http:// o https:// válido
function esUrlValida(texto) {
    try {
        const url = new URL(texto);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

// middleware: se mete antes de la ruta y pide la contraseña
// si es correcta llama a next() y sigue a la ruta; si no, responde 401
function pedirPassword(req, res, next) {
    const header = req.get('authorization') || ''; // el navegador manda "Basic xxxxx"
    const [tipo, codificado] = header.split(' ');  // separa "Basic" del código

    if (tipo === 'Basic' && codificado) {
        const texto = Buffer.from(codificado, 'base64').toString(); // decodifica "usuario:contraseña"
        const password = texto.slice(texto.indexOf(':') + 1);       // se queda con lo de después de los ":"

        if (password === PASSWORD) {
            return next(); // contraseña correcta, sigue
        }
    }

    res.set('WWW-Authenticate', 'Basic realm="Link shortener"'); // hace que el navegador muestre el cuadro de contraseña
    res.status(401).send('Necesitás la contraseña para ver todos los links'); // 401 = falta identificarse
}

// // límite: cada persona (cada IP) puede crear hasta 10 links por hora
// const limiteCrear = rateLimit({
//     windowMs: 60 * 60 * 1000, // la ventana de tiempo en milisegundos: 60 min × 60 seg × 1000 = 1 hora
//     limit: 10,                // cuántos pedidos se permiten en esa ventana
//     message: { error: 'Creaste muchos links seguidos. Probá de nuevo en un rato.' }, // lo que se responde al pasarse (código 429)
// });

app.get('/ping', (req, res) => {
    res.send('pong');
});

// crear un link nuevo: POST /api/links (público, pero con límite)
app.post('/api/links', (req, res) => {
    const { url } = req.body;
    let slug = (req.body.slug || '').trim().toLowerCase();
    // .toLowerCase() pasa todo a minúsculas: "CV" y "cv" son el mismo link.

    if (!esUrlValida(url)) {
        return res.status(400).json({ error: 'El link tiene que empezar con http:// o https://' });
    }

    if (slug && !FORMATO_SLUG.test(slug)) {
        return res.status(400).json({ error: 'El nombre solo puede tener letras, números y guiones (máximo 30)' });
    }
    // "slug &&" → solo revisamos si escribieron algo (vacío = se genera al azar).
    // .test(slug) → true si el texto cumple el patrón.

    if (RESERVADOS.includes(slug)) {
        return res.status(400).json({ error: 'Ese nombre está reservado' });
    }
    // .includes() → ¿está en la lista? 

    // si no se eligio, se crea 
    if (!slug) {
        do {
            slug = generarSlug();
        } while (buscarLink(slug));
    }

    try {
        crearLink(slug, url);
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(409).json({ error: 'Ese nombre ya está usado' });
        }
        throw err;
    }

    const linkCorto = `${req.protocol}://${req.get('host')}/${slug}`;
    res.status(201).json({ slug, url, linkCorto });
});

// los links de una persona: GET /api/mis-links?slugs=cv,k3x9a (público)
// el navegador manda los nombres que guardó y le devolvemos solo esos
app.get('/api/mis-links', (req, res) => {
    const slugs = (req.query.slugs || '')     // req.query = lo que viene después del "?" en la dirección
        .split(',')                           // "cv,k3x9a" → ['cv', 'k3x9a']
        .filter(s => FORMATO_SLUG.test(s))    // descarta lo que no tenga formato de nombre
        .slice(0, 100);                       // como mucho 100, para que nadie pida miles de una vez

    const links = slugs
        .map(buscarLink)                      // busca cada uno en la base
        .filter(Boolean);                     // saca los que no existen (buscarLink devolvió undefined)

    res.json(links);
});

// listar TODOS los links: GET /api/links (solo con contraseña, para vos)
app.get('/api/links', pedirPassword, (req, res) => {
    res.json(listarLinks());
});

app.get('/:slug', (req, res) => {
    const link = buscarLink(req.params.slug.toLowerCase());

    if (!link) {
        return res.status(404).send('Ese link no existe');
    }

    sumarClick(link.slug); // cuenta la visita
    res.redirect(link.url); // redirect con código 302 al link original
});

// arranque del servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});