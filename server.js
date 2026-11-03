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

// ruta de prueba
app.get('/ping', (req, res) => {
    res.send('pong');
});

// crear un link nuevo: POST /api/links
app.post('/api/links', (req, res) => {
    const { url } = req.body;
    let slug = (req.body.slug || '').trim(); // si no vino slug, texto vacío; trim saca espacios

    if (!url) {
        return res.status(400).json({ error: 'Falta el link' });
    }

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
    const link = buscarLink(req.params.slug);

    if (!link) {
        return res.status(404).send('Ese link no existe');
    }

    res.redirect(link.url); // redirect con código 302 al link original
});

// arranque del servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});