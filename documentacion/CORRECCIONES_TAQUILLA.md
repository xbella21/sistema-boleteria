# Correcciones recientes (Taquilla y compra de boletos)

## Contexto general
Durante la depuración de la compra y escaneo de boletos surgieron varios errores encadenados:

- El escáner (`scanner.html`) recibía el contenido completo del QR (JSON o cadena larga) y no siempre extraía el `codigo_qr` correcto.
- El backend devolvía `PGRST116 (Cannot coerce the result to a single JSON object)` porque el valor enviado no coincidía con el almacenado en `boletos.codigo_qr`.
- Una vez solucionado el parseo, las operaciones posteriores (`registrar_ingreso`, actualización de `estado`) seguían fallando por las políticas RLS de Supabase (usábamos el cliente público en lugar del admin).

## Cambios clave

1. **Normalización del QR en el frontend**
   - En `frontend/paginas/taquilla/scanner.html` se agregó la función `normalizarDatosBoleto(...)` y se fortaleció el parseo del código antes de llamar a la API.
   - Se maneja tanto texto plano como JSON completo (`codigo`, `codigo_qr`, `cod`). Además, se muestran mensajes claros (válido, usado, cancelado) según la respuesta real del backend.
   - Se añadió logging (`console.log('Código enviado al backend:'...)` y `console.log('Respuesta validar:'...)`) para diagnosticar fácilmente futuros problemas.

2. **Uso consistente de `supabaseAdmin` en el backend**
   - **`servicio-boletos.js`**: las funciones `obtenerBoletoPorCodigoQR` y `actualizarEstadoBoleto` ahora usan `supabaseAdmin` (o el cliente normal en caso de no tener service key). Se agregó un log para rastrear qué código se busca cada vez.
   - **`servicio-registros.js`**: `registrarIngreso` también utiliza el cliente admin para evitar bloqueos por RLS.
   - **`config/supabase.js`**: si `SUPABASE_SERVICE_KEY` no está definido (ambienta local), `supabaseAdmin` apunta al mismo cliente público para evitar `null` y mantener un comportamiento determinista.

3. **Registro de ingresos y marca de boletos**
   - Tras los cambios anteriores, el flujo completo queda así:
     1. Validar QR → `/api/taquilla/validar` (devuelve estructura normalizada).
     2. Registrar ingreso → `/api/taquilla/registrar-ingreso` (inserta en `registro_ingresos` y marca el boleto como `usado`).
     3. Se actualiza correctamente el aforo y el estado del boleto sin errores 500.

## Errores originales vs. solución

| Error detectado | Causa raíz | Corrección aplicada |
|-----------------|------------|---------------------|
| `Código QR inválido o boleto no encontrado` (400) | El escáner enviaba texto que no coincidía con `codigo_qr` | Normalización en `scanner.html` + log del código enviado |
| Error 401/Token inválido | Sesión expirada al probar desde consola | Solucionado al reautenticarse; no requirió cambios |
| `Error al acceder a la base de datos` al registrar ingreso | Inserciones y updates bloqueados por RLS | Uso de `supabaseAdmin` en servicios y fallback en `config/supabase.js` |
| `Error al actualizar estado del boleto` | Misma causa (cliente público) | `actualizarEstadoBoleto` ahora usa cliente admin |

## Cómo estudiar/practicar
1. **Seguir el flujo completo**: compra → escaneo → validación → registrar ingreso. Observa los logs en consola y terminal.
2. **Revisar el archivo `scanner.html`** para entender la normalización del QR y los mensajes que se muestran.
3. **Abrir `servicio-boletos.js` y `servicio-registros.js`** para ver cómo interactúan con Supabase usando el cliente admin.
4. **Ver `config/supabase.js`** para recordar la importancia de definir `SUPABASE_SERVICE_KEY` en ambientes productivos, y el fallback usado en local.
5. **Consultar esta guía** cada vez que aparezca nuevamente un 400/500 relacionado con QR o RLS.

Con estas correcciones el sistema de taquilla queda estable y preparado para manejar tanto QR válidos como errores comunes de forma controlada.

