# 🔄 INSTRUCCIONES PARA RESET COMPLETO DE BASE DE DATOS

## ⚠️ ADVERTENCIA

Este script **ELIMINARÁ TODA LA BASE DE DATOS ACTUAL** y la recreará desde cero. 

**Asegúrate de:**
- ✅ Hacer backup si tienes datos importantes
- ✅ Estar en el proyecto correcto de Supabase
- ✅ Tener tiempo para reconfigurar después

---

## 📋 PASOS PARA EJECUTAR

### PASO 1: Abrir Supabase SQL Editor

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. En el menú lateral, click en **SQL Editor**
3. Click en **New Query**

### PASO 2: Copiar y Ejecutar el Script

1. Abre el archivo `RESET_BASE_DATOS_COMPLETO.sql`
2. Copia **TODO el contenido** (Ctrl+A, Ctrl+C)
3. Pega en el SQL Editor de Supabase (Ctrl+V)
4. Click en el botón **RUN** (o Ctrl+Enter)

### PASO 3: Verificar que se Ejecutó Correctamente

Deberías ver mensajes al final:

```
✅ BASE DE DATOS RECREADA EXITOSAMENTE
✅ 5 tablas creadas
✅ Triggers y funciones creadas
✅ Políticas RLS configuradas

🔐 PRÓXIMOS PASOS:
1. Crear usuario en Authentication → Users
2. Insertar registro en tabla usuarios con rol "administrador"
3. Configurar archivo .env del backend
4. Iniciar el servidor backend
```

### PASO 4: Verificar las Tablas

1. En Supabase, ve a **Table Editor**
2. Deberías ver estas 5 tablas:
   - ✅ `usuarios`
   - ✅ `eventos`
   - ✅ `categorias_entradas`
   - ✅ `boletos`
   - ✅ `registro_ingresos`

---

## 🔐 CREAR USUARIO ADMINISTRADOR

### Opción A: Desde Supabase Dashboard (Recomendado)

#### 1. Crear Usuario en Authentication

1. Ve a **Authentication** → **Users**
2. Click en **Add user** → **Create new user**
3. Llena los campos:
   - **Email:** `admin@eventos.com` (o el que prefieras)
   - **Password:** Elige una contraseña segura
   - **Auto Confirm User:** ✅ Activar
4. Click en **Create user**
5. **⚠️ COPIA EL UUID DEL USUARIO** (lo necesitarás en el siguiente paso)

#### 2. Insertar en Tabla Usuarios

1. Ve a **Table Editor** → tabla `usuarios`
2. Click en **Insert** → **Insert row**
3. Llena los campos:
   ```
   auth_id: [PEGA EL UUID QUE COPIASTE]
   nombre: Admin
   apellido: Sistema
   email: admin@eventos.com (el mismo del paso 1)
   telefono: (dejar vacío o llenar)
   rol: administrador
   activo: true
   ```
4. Click en **Save**

### Opción B: Desde SQL Editor

Si prefieres hacerlo todo en SQL:

```sql
-- Primero, crea el usuario en Authentication desde el Dashboard
-- Luego ejecuta esto reemplazando el UUID:

INSERT INTO public.usuarios (
	auth_id, 
	nombre, 
	apellido, 
	email, 
	rol, 
	activo
) VALUES (
	'REEMPLAZA-CON-EL-UUID-DEL-AUTH-USER',
	'Admin',
	'Sistema',
	'admin@eventos.com',
	'administrador',
	true
);
```

---

## ⚙️ CONFIGURAR EL BACKEND

### 1. Crear archivo `.env`

En la carpeta `backend/`, crea un archivo llamado `.env`:

```env
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-clave-anonima-aqui
SUPABASE_SERVICE_KEY=tu-clave-service-role-aqui

# Server
PORT=3000
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5500
```

### 2. Obtener las Credenciales

1. En Supabase, ve a **Settings** → **API**
2. Copia:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_KEY`
   - **service_role** key → `SUPABASE_SERVICE_KEY`

### 3. Instalar Dependencias

```bash
cd backend
npm install
```

### 4. Iniciar el Servidor

```bash
npm run dev
```

Deberías ver:

```
✅ Conexión con Supabase establecida correctamente
🚀 Servidor iniciado en puerto 3000
```

---

## 🌐 INICIAR EL FRONTEND

```bash
# Opción 1: http-server
npx http-server frontend -p 5500

# Opción 2: Live Server (VS Code)
# Click derecho en index.html → Open with Live Server
```

---

## ✅ VERIFICACIÓN FINAL

### 1. Probar el Login

1. Abre: `http://localhost:5500/paginas/login.html`
2. Inicia sesión con:
   - **Email:** `admin@eventos.com`
   - **Password:** La contraseña que configuraste
3. Deberías ser redirigido al Dashboard de Administrador

### 2. Verificar la API

Abre en el navegador: `http://localhost:3000/api/health`

Deberías ver:
```json
{
  "exito": true,
  "mensaje": "API funcionando correctamente",
  "timestamp": "2024-11-18T..."
}
```

---

## 🔍 QUÉ INCLUYE EL SCRIPT

### ✅ Eliminación Completa
- ❌ Todas las políticas RLS anteriores
- ❌ Todas las vistas
- ❌ Todos los triggers
- ❌ Todas las funciones
- ❌ Todos los índices
- ❌ Todas las tablas

### ✅ Creación Nueva
- ✅ 5 tablas con estructura correcta
- ✅ 13 índices para optimización
- ✅ 3 funciones (actualización automática)
- ✅ 4 triggers (aforo, cantidad vendida, fechas)
- ✅ 20+ políticas RLS (seguridad completa)
- ✅ 1 vista de estadísticas

### ✅ Mejoras Implementadas
- ✅ Políticas RLS más permisivas para el backend
- ✅ Organizadores pueden ver todos sus eventos
- ✅ Usuarios pueden actualizar su propio perfil
- ✅ Taquilla puede actualizar boletos
- ✅ Administradores tienen acceso total
- ✅ Constraints de validación en todas las tablas

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "relation does not exist"
**Causa:** Alguna tabla no se creó correctamente  
**Solución:** 
1. Ejecuta el script completo de nuevo
2. Verifica que no haya errores en la consola SQL

### Error: "permission denied"
**Causa:** No tienes permisos para ejecutar el script  
**Solución:** 
1. Asegúrate de estar logueado en Supabase
2. Verifica que eres el dueño del proyecto

### Error al crear usuario: "duplicate key value"
**Causa:** Ya existe un usuario con ese email  
**Solución:**
1. Cambia el email del usuario administrador
2. O elimina el usuario anterior en Authentication

### Backend no conecta con Supabase
**Causa:** Credenciales incorrectas en `.env`  
**Solución:**
1. Verifica que las URLs y keys sean correctas
2. No debe haber espacios al inicio/final
3. Las keys deben estar completas

### Frontend da error CORS
**Causa:** `FRONTEND_URL` en `.env` no coincide  
**Solución:**
1. Verifica que `FRONTEND_URL=http://localhost:5500`
2. El frontend debe estar en ese puerto exacto

---

## 📊 ESTRUCTURA FINAL

Después de ejecutar el script, tendrás:

```
Base de Datos Supabase
├── public.usuarios (5 columnas, 3 índices)
├── public.eventos (13 columnas, 3 índices, 2 constraints)
├── public.categorias_entradas (7 columnas, 1 índice, 2 constraints)
├── public.boletos (9 columnas, 4 índices, 1 constraint)
├── public.registro_ingresos (6 columnas, 3 índices)
│
├── Funciones (3)
│   ├── actualizar_fecha_modificacion()
│   ├── actualizar_aforo_evento()
│   └── actualizar_cantidad_vendida()
│
├── Triggers (4)
│   ├── trigger_actualizar_usuarios
│   ├── trigger_actualizar_eventos
│   ├── trigger_actualizar_aforo
│   └── trigger_actualizar_cantidad_vendida
│
├── Políticas RLS (20+)
│   ├── Usuarios (5 políticas)
│   ├── Eventos (5 políticas)
│   ├── Categorías (4 políticas)
│   ├── Boletos (5 políticas)
│   └── Registro Ingresos (2 políticas)
│
└── Vistas (1)
    └── vista_estadisticas_eventos
```

---

## ⏱️ TIEMPO ESTIMADO

- **Ejecutar script:** 1-2 minutos
- **Crear usuario admin:** 2-3 minutos
- **Configurar backend:** 3-5 minutos
- **Probar sistema:** 2-3 minutos

**Total:** ~10-15 minutos

---

## ✅ CHECKLIST COMPLETO

- [ ] Backup de datos actuales (si es necesario)
- [ ] Ejecutar `RESET_BASE_DATOS_COMPLETO.sql` en Supabase
- [ ] Verificar que las 5 tablas existen
- [ ] Crear usuario en Authentication
- [ ] Copiar UUID del usuario
- [ ] Insertar registro en tabla usuarios con rol administrador
- [ ] Crear archivo `backend/.env`
- [ ] Copiar credenciales de Supabase al .env
- [ ] Ejecutar `npm install` en backend
- [ ] Ejecutar `npm run dev` en backend
- [ ] Iniciar frontend con http-server
- [ ] Probar login con usuario administrador
- [ ] Verificar que carga el dashboard

---

## 🎉 ¡LISTO!

Una vez completados todos los pasos, tu base de datos estará:
- ✅ Limpia y sin datos antiguos
- ✅ Con estructura correcta y optimizada
- ✅ Con todas las políticas RLS configuradas
- ✅ Con triggers funcionando automáticamente
- ✅ Lista para usar en el proyecto

**Archivo del script:** `RESET_BASE_DATOS_COMPLETO.sql`

Para cualquier problema, revisa la sección **Solución de Problemas** arriba.

