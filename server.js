const express = require('express');
const path = require('path');
const { crearLink, buscarLink } = require('./db'); // importa las funciones que se crearon en db.js

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());  // desarma el JSON que llega en el body de la petición y lo pone en req.body com obj en js
app.use(express.static(path.join(__dirname, 'public'))); // muestra los archivos de la carpeta "public"

// ruta de prueba
app.get('/ping', (req, res) => {
    res.send('pong');
});

//  link nuevo: POST /api/links (me tiraba error, con esto no tendría que)
app.post('/api/links', (req, res) => {
    const { url, slug } = req.body;

    if (!url || !slug) {
        return res.status(400).json({ error: 'Faltan url o slug' });
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
  // hace que el servidor responda a cualquier GET con un slug, por ejemplo /google o /milink o /etc

    const link = buscarLink(req.params.slug);

    if (!link) {
    return res.status(404).send('Ese link no existe');
    }

    // 404 por si no existe el slug en la base de datos

    res.redirect(link.url);
    // responde con un redirect (código 302) a la URL que está en la base de datos para ese slug
});

// arranque del servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
