# Sistema de reportes — Lost In Music

Resumen de la implementación: cualquier usuario autenticado puede reportar a
otro usuario o una publicación desde una ventana emergente, y el administrador
revisa los reportes en una página propia y puede sancionar con el sistema de
baneos que ya existía.

## Flujo de usuario

1. En cualquier publicación, el menú `⋯` ahora muestra:
   - **Reportar publicación**
   - **Reportar usuario** (autor de la publicación)
2. En el perfil de otro usuario hay un botón **🚩 Reportar**.
3. Se abre la ventana emergente (`ReportModal`) con motivos sugeridos, un
   cuadro de texto (mínimo 8 y máximo 500 caracteres) y los botones
   **Enviar reporte** / **Cancelar**.
4. Al enviar se crea un reporte en estado `pending`. El backend rechaza:
   - reportes a uno mismo,
   - reportes a administradores,
   - reportes duplicados pendientes del mismo usuario sobre el mismo objetivo.

## Flujo de administración

- Acceso desde **/admin/reports**, desde el botón **🚩 Reportes** del panel de
  usuarios y desde el menú del perfil del administrador.
- Pestañas: Pendientes / Resueltos / Descartados / Todos, con contadores.
- Filtros por tipo (usuarios / publicaciones) y búsqueda por usuario o motivo.
- Cada reporte muestra: quién reportó, a quién, el motivo, la fecha y, si es
  una publicación, una copia del texto y de la primera imagen (para que siga
  siendo legible aunque el autor borre el post).
- Acciones:
  - **Banear**: abre el mismo diálogo de sanción del panel de usuarios, con la
    duración configurable y el motivo precargado con la razón del reporte. Al
    aplicarla, el reporte pasa a `resolved`.
  - **Marcar resuelto**: cierra el reporte sin sanción.
  - **Descartar**: cierra el reporte como `dismissed`.
  - **Reabrir**: lo devuelve a `pending`.

## Backend

### Modelo `api/models/Report.js`

Tabla SQL `reports` (se crea sola con `sequelize.sync()` al iniciar el backend):

| Campo | Descripción |
| --- | --- |
| `reportId` | PK autoincremental |
| `reporterId` | usuario que reporta |
| `targetType` | `user` \| `post` |
| `targetUserId` | usuario reportado (autor si es un post) |
| `targetPostId` | ObjectId del post reportado (MongoDB) |
| `targetUsername` | copia del nombre del reportado |
| `postText` / `postImage` | copia del contenido reportado |
| `reason` | razón escrita por el usuario |
| `status` | `pending` \| `resolved` \| `dismissed` |
| `reviewedBy` / `reviewedAt` | administrador y fecha de revisión |
| `resolutionNote` | nota de la resolución |

### Controlador `api/controllers/reports.js`

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| POST | `/reports` | usuario autenticado | crea un reporte |
| GET | `/admin/reports` | administrador | lista con filtros y contadores |
| GET | `/admin/reports/count` | administrador | cantidad por estado |
| PATCH | `/admin/reports/:id` | administrador | cambia el estado (`pending`, `resolved`, `dismissed`) |

Las rutas están registradas en `api/index.js` con `checkToken` y, las de
administración, también con `checkAdmin`.

## Frontend

- `src/services/reportsApi.js` — llamadas al backend.
- `src/components/ReportModal.jsx` + `src/styles/ReportModal.css` — ventana
  emergente de reporte.
- `src/components/post.jsx` — opciones de reporte en el menú de cada post.
- `src/components/OtherUserProfile.jsx` — botón de reporte en el perfil ajeno.
- `src/pages/adminReports.jsx` + `src/styles/adminReports.css` — panel de
  administración de reportes.
- `src/components/BanDialog.jsx` — diálogo de sanción extraído de
  `pages/admin.jsx` para reutilizarlo en ambos paneles.
- `src/App.jsx` y `src/main.jsx` — ruta `/admin/reports` y título de la página.
- `src/components/header.jsx` y `src/pages/admin.jsx` — accesos al panel y
  contador de reportes pendientes.

## Puesta en marcha

1. Iniciar MySQL y el backend (`sistema/api`): la tabla `reports` se crea en el
   primer arranque.
2. Iniciar el frontend (`sistema/fronten/lost-in-music`).
3. Probar con un usuario común: reportar un post y reportar un perfil.
4. Entrar con un administrador: `/admin/reports` → Banear / Resolver / Descartar.
