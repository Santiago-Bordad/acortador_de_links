# Acortador de links

Una aplicación web para acortar links. Pegás un link largo, elegís un nombre corto (o dejás que se genere uno al azar) y obtenés una dirección como `tudominio.com/cv` que redirige al link original.

Es mi primer proyecto con Node.js. Lo armé por fases para practicar Git y GitHub: cada función nueva se desarrolló en su propia rama y entró a `main` mediante un pull request.

Usé IA (Claude Opus 5.5) como asistente durante el desarrollo, para el diseño, para redacción y para solucionar errores en el código. El objetivo del proyecto es aprender, así que la usé en las partes que no me cambia eso, y me aseguré de entender cada línea antes de sumarla.

## Funciones

- **Links con nombre propio:** elegís el final del link (`/cv`, `/portfolio`, `/cumple`).
- **Nombre al azar:** si no elegís uno, se genera un nombre de 5 caracteres, sin letras que se confundan entre sí (como `l`, `1`, `o` y `0`).
- **Redirección:** quien entra al link corto llega al link original.
- **Contador de clics:** cada visita a un link corto suma un clic.
- **Mis links:** cada navegador recuerda los links que creó y los muestra en una tabla con sus clics.
- **Botón para copiar** el link corto.
- **Validaciones:** solo acepta links `http://` o `https://` y nombres con letras, números y guiones (hasta 30 caracteres). Los nombres no distinguen mayúsculas: `/CV` y `/cv` son el mismo link.
- **Nombres reservados:** `api`, `ping`, `admin` y `login` no se pueden usar, porque chocan con rutas de la aplicación.
- **Lista completa protegida:** ver todos los links creados requiere una contraseña.
- **Diseño propio,** adaptado a celular, con animaciones de entrada.

## Tecnologías

- [Node.js](https://nodejs.org) y [Express](https://expressjs.com) para el servidor
- [SQLite](https://www.sqlite.org) con [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) para la base de datos
- HTML, CSS y JavaScript sin frameworks para la página

## Cómo correrlo

Necesitás [Node.js](https://nodejs.org) 22 o más nuevo y [Git](https://git-scm.com).

1. Cloná el repositorio y entrá a la carpeta:

   ```bash
   git clone https://github.com/santiagobordad/acortador_de_links.git
   cd acortador_de_links
   ```

2. Instalá las dependencias:

   ```bash
   npm install
   ```

3. Creá un archivo `.env` en la raíz, siguiendo el ejemplo de `.env.example`, con la contraseña para ver la lista completa de links:

   ```
   PANEL_PASSWORD=tu-contraseña
   ```

   Sin esta variable, el servidor no arranca.

4. Arrancá el servidor:

   ```bash
   npm run dev
   ```

5. Abrí `http://localhost:3000` en el navegador.

`npm run dev` reinicia el servidor solo cada vez que guardás un archivo. Para correrlo sin reinicio automático, usá `npm start`.

## Rutas

| Método | Ruta | Acceso | Qué hace |
| --- | --- | --- | --- |
| `GET` | `/` | Público | La página para crear links |
| `POST` | `/api/links` | Público | Crea un link. Recibe `{ "url": "...", "slug": "..." }`; `slug` es opcional |
| `GET` | `/api/mis-links?slugs=a,b` | Público | Devuelve los links con esos nombres (la usa la tabla de "Mis links") |
| `GET` | `/api/links` | Contraseña | Devuelve todos los links creados |
| `GET` | `/:slug` | Público | Redirige al link original y suma un clic, o muestra un error si no existe |
| `GET` | `/ping` | Público | Responde `pong`; sirve para comprobar que el servidor está andando |

Al crear un link, la API responde con estos códigos:

| Código | Cuándo |
| --- | --- |
| `201` | El link se creó |
| `400` | El link no es válido, el nombre tiene caracteres no permitidos o está reservado |
| `409` | Ya existe un link con ese nombre |

## Estructura

```
├── public/
│   ├── index.html   # la página
│   ├── style.css    # los estilos
│   └── app.js       # crea links, muestra la tabla y copia al portapapeles
├── server.js        # el servidor: rutas, validaciones y redirección
├── db.js            # la base de datos: crea la tabla y hace las consultas
├── .env.example     # plantilla de las variables de entorno
└── package.json
```

La base de datos es el archivo `links.db`, que se crea solo la primera vez que arranca el servidor. No se sube al repositorio (está en `.gitignore`), igual que `.env`.
Desarrollado por Santiago Bordad.
