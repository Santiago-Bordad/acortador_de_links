const express = require('express');
const path = require('path');
const { crearLink, buscarLink } = require('./db'); // importa las funciones que se crearon en db.js

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // desarma el JSON que llega en el body y lo pone en req.body como objeto de JS
app.use(express.static(path.join(__dirname, 'public'))); // muestra los archivos de la carpeta "public"

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

// ruta de prueba
app.get('/ping', (req, res) => {
    res.send('pong');
});

// crear un link nuevo: POST /api/links
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

app.get('/:slug', (req, res) => {
    const link = buscarLink(req.params.slug.toLowerCase());

    if (!link) {
        return res.status(404).send('Ese link no existe');
    }

    res.redirect(link.url); // redirect con código 302 al link original
});

// arranque del servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});