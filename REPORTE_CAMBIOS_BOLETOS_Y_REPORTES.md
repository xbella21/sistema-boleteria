# Reporte de Cambios Recientes (Boletos, Aforo y Reportes)

## Contexto
Se detectaron varios problemas relacionados con la compra y visualización de boletos:

- El aforo mostrado en distintas vistas no coincidía con los boletos realmente vendidos o con los asistentes registrados.
- Los reportes (PDF/Excel) devolvían ingresos inflados porque usaban cifras generadas en la vista SQL y no los boletos reales.
- El dashboard de administrador y la portada (`index.html`) no respetaban la estructura actual de las respuestas del backend y mostraban datos incompletos.
- El header cargado dinámicamente no funcionaba en todas las páginas (botones de inicio de sesión/registro no respondían).

## Cambios clave

### Backend
1. **`servicio-boletos.js`**
   - Las consultas que exponen boletos (`obtenerBoletosPorEvento`) ahora usan `supabaseAdmin` para evitar restricciones RLS.

2. **`servicio-eventos.js`**
   - Cada vez que se listan eventos se llama a `actualizarEstadosEventosAutomatico()` para marcar como `finalizado` a todo evento cuya fecha fin ya pasó.
   - `obtenerEventos` adjunta estadísticas (boletos vendidos, ingresos y aforo registrado) consultando `vista_estadisticas_eventos`.
   - `obtenerEventosProximos` ahora devuelve todos los eventos activos con fecha ≥ hoy, sin limitar por 30 días.

3. **`controlador-reportes.js`**
   - Tanto el reporte individual como el general recalculan ingresos y aforo sumando los boletos reales. Se distingue aforo “registrado” (boletos usados) del aforo configurado.
   - El dashboard agrega los datos de aforo usando los boletos en estado `usado`.

4. **Middlewares/Rutas**
   - `validacionUUIDParam` permite validar parámetros como `:eventoId`. Se aplicó a las rutas de reportes para que el administrador pueda descargar PDF/Excel por evento.
   - `esPropietarioEventoOAdmin` ahora lee `req.params.eventoId`.

### Frontend
1. **Dashboard y páginas de organizador**
   - `organizador/eventos.html` y `evento-detalle.html` muestran el aforo usando `aforo_registrado` (o boletos vendidos) para reflejar la ocupación real.
   - El dashboard (`admin/dashboard.html`) incluye un selector de eventos y botones para descargar reportes (general y por evento).

2. **Página principal (`index.html`)**
   - El listado “Próximos eventos” maneja la nueva estructura `{ eventos: [...] }` y siempre reemplaza el loader (sin quedarse cargando).

3. **Header**
   - `scripts/header.js` expone `Header.init()` y detecta automáticamente cuando el componente se inserta en el DOM, solucionando el bug de los botones de “Iniciar sesión” y “Registrarse”.
   - Se incluyó el script del header en `index.html`, `login.html` y `registro.html`.

4. **Eventos (públicos y organizadores)**
   - `eventos.html` y `organizador/eventos.html` normalizan la respuesta de `/eventos` y de `/eventos/activos`. Se eliminó el error `eventos.map is not a function`.

## Resultados
- El aforo y los ingresos reflejan exactamente los boletos vendidos/registrados, tanto en el dashboard como en los reportes PDF/Excel.
- Los administradores y organizadores pueden descargar reportes por evento y reportes globales sin recibir 400.
- La portada y “Mis Eventos” ya no quedan en estado de carga. Las rutas y botones del header funcionan en todas las páginas.
- El estado de los eventos se actualiza automáticamente según la fecha fin/cancelación, evitando inconsistencias.

## Pasos siguientes sugeridos
- Monitorear los reportes para confirmar que los organizadores ven sus propios eventos y que los administradores pueden generar PDFs sin restricciones.
- Considerar almacenar `aforo_registrado` directamente en la tabla (por triggers) para evitar recalcularlo constantemente.
- Extender la lógica del header a otros componentes cargados dinámicamente (si se añaden más en el futuro).

