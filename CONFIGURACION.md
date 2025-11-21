# CONFIGURACIÓN DEL PROYECTO

## Variables de Entorno (.env)

Crea un archivo `.env` en la carpeta `backend/` con el siguiente contenido:

```env
# Supabase Configuration
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-clave-anonima-aqui
SUPABASE_SERVICE_KEY=tu-clave-de-servicio-aqui

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:5500

# Logging
LOG_LEVEL=info
```

## Obtener Credenciales de Supabase

1. Ve a [supabase.com](https://supabase.com) e inicia sesión
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** → `SUPABASE_URL`
   - **Project API keys** → anon public → `SUPABASE_KEY`
   - **Project API keys** → service_role → `SUPABASE_SERVICE_KEY`

## Instalación de Dependencias

```bash
cd backend
npm install
```

## Iniciar el Servidor

### Modo Desarrollo (con auto-reload)
```bash
cd backend
npm run dev
```

### Modo Producción
```bash
cd backend
npm start
```

## Iniciar el Frontend

### Opción 1: Live Server (VS Code)
1. Instala la extensión "Live Server" en VS Code
2. Click derecho en `frontend/paginas/index.html`
3. Selecciona "Open with Live Server"

### Opción 2: http-server (Node)
```bash
npx http-server frontend -p 5500
```

### Opción 3: Python
```bash
cd frontend
python -m http.server 5500
```

## Configurar Base de Datos

1. En Supabase, ve a **SQL Editor**
2. Ejecuta el script completo de `documentacion/base_de_datos.sql`
3. Verifica que todas las tablas se crearon correctamente

## Crear Usuario Administrador Inicial

1. En Supabase, ve a **Authentication** → **Users**
2. Click en "Add user" → Create con email y password
3. Copia el UUID del usuario
4. Ve a **Table Editor** → `usuarios`
5. Insert row con estos datos:
   - `auth_id`: UUID del usuario creado
   - `nombre`: Admin
   - `apellido`: Sistema  
   - `email`: mismo email del paso 2
   - `rol`: administrador
   - `activo`: true

## URLs del Sistema

- **Backend API:** http://localhost:3000
- **Frontend:** http://localhost:5500
- **Health Check:** http://localhost:3000/api/health

## Solución de Problemas

### El servidor no inicia
- Verifica que el archivo `.env` existe en `backend/`
- Verifica que las credenciales de Supabase son correctas
- Asegúrate de haber ejecutado `npm install`

### Error de CORS
- Verifica que `FRONTEND_URL` en `.env` coincida con la URL del frontend
- El frontend debe estar en `http://localhost:5500`

### No puedo iniciar sesión
- Verifica que la base de datos está configurada
- Verifica que creaste el usuario administrador
- Revisa la consola del navegador para errores

### Las rutas del header no funcionan
- Asegúrate de que el archivo `header.js` se está cargando
- Verifica que estás sirviendo el frontend desde un servidor web (no file://)

