const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// muestra los archivos de la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

// ruta de prueba
app.get('/ping', (req, res) => {
    res.send('pong');
});

// arranque del servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});