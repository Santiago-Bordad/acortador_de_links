const Database = require('better-sqlite3');
// trae la librería que se instaló con npm install better-sqlite3
// PD no menor: "Database" con mayúscula porque es una "clase": un molde para crear bases.

const db = new Database('links.db');



// se crea la tabla solo la primera vez 
db.exec(`
  CREATE TABLE IF NOT EXISTS links (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    slug       TEXT    NOT NULL UNIQUE,
    url        TEXT    NOT NULL,
    clicks     INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// funciones para crear y buscar links

function crearLink(slug, url) {
  return db
    .prepare('INSERT INTO links (slug, url) VALUES (?, ?)')
    .run(slug, url);
}

function buscarLink(slug) {
  return db
    .prepare('SELECT * FROM links WHERE slug = ?')
    .get(slug);
}
// seleccionar las columnas de la tabla "links" donde el slug sea igual al que se pasa como parámetro


// exportar
module.exports = { crearLink, buscarLink };
// hace que estas dos funciones se puedan usar desde otros archivos.