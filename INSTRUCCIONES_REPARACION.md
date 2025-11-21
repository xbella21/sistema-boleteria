# 🔧 Instrucciones para Reparar el Proyecto

## ❌ Problema Identificado
- **Error:** Recursión infinita en políticas RLS de Supabase
- **Causa:** Las políticas intentan leer de la tabla `usuarios` mientras verifican permisos en la misma tabla
- **Resultado:** El servidor no puede conectarse a la base de datos

## ✅ Solución Aplicada

### 1. Archivo .env Creado ✅
El archivo `backend/.env` ha sido creado con tus credenciales de Supabase:
- SUPABASE_URL
- SUPABASE_KEY (anon key)
- SUPABASE_SERVICE_KEY (service role)
- JWT_SECRET
- PORT y NODE_ENV

### 2. Script SQL para Aplicar

**IMPORTANTE:** Debes ejecutar este paso AHORA antes de iniciar el servidor.

#### Pasos:

1. **Ir a Supabase Dashboard:**
   - URL: https://bjilrhzunnytmdcpvljt.supabase.co
   - Iniciar sesión con tu cuenta

2. **Abrir SQL Editor:**
   - Clic en el ícono de SQL en el menú lateral izquierdo
   - O buscar "SQL Editor" en el menú

3. **Ejecutar el Script:**
   - Copia TODO el contenido del archivo: `documentacion/fix_rls_policies_OPCION_BACKEND.sql`
   - Pega en el SQL Editor de Supabase
   - Haz clic en el botón **"Run"** (o presiona `Ctrl+Enter`)
   - Espera a que termine (debe tardar 1-2 segundos)

4. **Verificar que no hay errores:**
   - Si ves "Success. No rows returned" → ✅ Perfecto
   - Si ves errores rojos → Copia el error y avísame

### 3. Iniciar el Servidor

Una vez que hayas ejecutado el script SQL en Supabase:

```powershell
cd backend
npm start
```

**Salida esperada:**
```
🔄 Verificando conexión con Supabase...
✅ Conexión con Supabase establecida correctamente

╔════════════════════════════════════════════╗
║  Sistema de Gestión de Eventos - Backend  ║
╚════════════════════════════════════════════╝

🚀 Servidor iniciado en puerto 3000
🌐 URL: http://localhost:3000
📚 API: http://localhost:3000/api
🏥 Health Check: http://localhost:3000/api/health

⚙️  Entorno: development

✅ Servidor listo para recibir peticiones
```

### 4. Abrir el Frontend

Una vez que el servidor esté corriendo:

1. Abre el archivo `frontend/paginas/index.html` con Live Server
2. O abre directamente en el navegador: `file:///C:/Users/israe/OneDrive/Escritorio/PROYECTO DE TICKETS/frontend/paginas/index.html`

## 🔍 ¿Qué Hace el Script SQL?

El script:
1. ✅ Elimina las políticas RLS problemáticas que causaban recursión infinita
2. ✅ Crea políticas simplificadas que solo permiten a los usuarios ver/editar su propio perfil
3. ✅ Las operaciones administrativas se manejan en el backend usando `supabaseAdmin`

**Resultado:**
- Los usuarios normales solo pueden ver su propio perfil
- Los administradores pueden ver todos los usuarios (verificado en el backend)
- No más recursión infinita ✅

## ⚠️ IMPORTANTE

**NO inicies el servidor hasta que hayas ejecutado el script SQL en Supabase.**

Si intentas iniciar el servidor antes, verás el mismo error:
```
❌ Error al verificar conexión con Supabase: infinite recursion detected
```

## 📞 ¿Listo?

Una vez que hayas completado el **Paso 2** (ejecutar el script SQL en Supabase), avísame y yo iniciaré el servidor por ti.

O si prefieres hacerlo tú mismo:
```powershell
cd "C:\Users\israe\OneDrive\Escritorio\PROYECTO DE TICKETS\backend"
npm start
```

## 🎯 Checklist

- [ ] Script SQL ejecutado en Supabase
- [ ] No hay errores en el SQL Editor
- [ ] Archivo .env existe en backend/
- [ ] Servidor backend iniciado correctamente
- [ ] Frontend abierto en el navegador

---

**¿Necesitas ayuda?** Avísame en qué paso estás.

