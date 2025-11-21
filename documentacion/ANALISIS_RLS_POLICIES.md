# 🔍 Análisis Completo de Políticas RLS

## ❌ PROBLEMA IDENTIFICADO

El archivo `fix_rls_policies.sql` **NO ES FUNCIONAL** y presenta **recursión infinita** que hará que las consultas fallen o se ejecuten indefinidamente.

---

## 📊 Comparación de Soluciones

### ❌ Política INCORRECTA (archivo actual)

```sql
CREATE POLICY "Administradores pueden ver todos los usuarios"
	ON public.usuarios FOR SELECT
	USING (
		(SELECT rol FROM public.usuarios WHERE auth_id = auth.uid() LIMIT 1) = 'administrador'
	);
```

**Problema:**
- Intenta leer de `usuarios` dentro de una política de `usuarios`
- Causa **recursión infinita**: RLS → Query → RLS → Query → ♾️
- El sistema se bloquea o devuelve error

---

### ✅ Política CORRECTA (con función SECURITY DEFINER)

```sql
-- Crear función que bypasea RLS
CREATE OR REPLACE FUNCTION public.obtener_rol_usuario(auth_uid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	usuario_rol TEXT;
BEGIN
	SELECT rol INTO usuario_rol
	FROM public.usuarios
	WHERE auth_id = auth_uid
	LIMIT 1;
	
	RETURN usuario_rol;
END;
$$;

-- Usar función en política
CREATE POLICY "Administradores pueden ver todos los usuarios"
	ON public.usuarios FOR SELECT
	USING (public.obtener_rol_usuario(auth.uid()) = 'administrador');
```

**Ventajas:**
- ✅ `SECURITY DEFINER` ejecuta la función con privilegios del creador
- ✅ Bypasea RLS dentro de la función
- ✅ Sin recursión infinita
- ✅ Mantiene la seguridad a nivel de base de datos

---

## 🛠️ Soluciones Disponibles

### Opción 1: Función SECURITY DEFINER (RECOMENDADA) ⭐

**Archivo:** `fix_rls_policies_CORRECTO.sql`

**Pros:**
- ✅ Seguridad a nivel de base de datos
- ✅ No requiere cambios en el código backend
- ✅ Mantiene el principio de defensa en profundidad
- ✅ Compatible con cualquier cliente de Supabase

**Contras:**
- ⚠️ Requiere crear función auxiliar
- ⚠️ Ligeramente más complejo de mantener

**Cuándo usar:**
- Si quieres seguridad robusta a nivel de base de datos
- Si múltiples aplicaciones acceden a Supabase
- Si quieres aplicar el principio de "zero trust"

---

### Opción 2: Usar supabaseAdmin en Backend

**Pros:**
- ✅ Más simple de implementar
- ✅ Políticas RLS más simples
- ✅ Control total en el backend
- ✅ Ya está implementado en el proyecto

**Contras:**
- ⚠️ Toda la seguridad depende del backend
- ⚠️ Si el backend tiene vulnerabilidad, la DB está expuesta
- ⚠️ No funciona para acceso directo a Supabase

**Políticas simplificadas:**

```sql
-- Solo usuarios pueden ver su propio perfil
CREATE POLICY "Usuarios pueden ver su propio perfil"
	ON public.usuarios FOR SELECT
	USING (auth.uid() = auth_id);

-- Solo usuarios pueden insertar su propio registro (durante registro)
CREATE POLICY "Permitir auto-inserción durante registro"
	ON public.usuarios FOR INSERT
	WITH CHECK (auth.uid() = auth_id);

-- Solo usuarios pueden actualizar su propio perfil
CREATE POLICY "Usuarios pueden actualizar su perfil"
	ON public.usuarios FOR UPDATE
	USING (auth.uid() = auth_id);

-- NO HAY política para ver todos, crear otros, o eliminar
-- Estas operaciones se hacen con supabaseAdmin en el backend
```

**Cambios en backend:**

El código ya está preparado para esta opción. En `servicios/servicio-usuarios.js`:

```javascript
const { supabase, supabaseAdmin } = require('../config/supabase');

// Operaciones normales usan 'supabase' (con RLS)
async function obtenerUsuarioPorAuthId(authId) {
	const { data, error } = await supabase
		.from('usuarios')
		.select('*')
		.eq('auth_id', authId)
		.single();
	return data;
}

// Operaciones admin usan 'supabaseAdmin' (sin RLS)
async function obtenerUsuarios() {
	const { data, error } = await supabaseAdmin  // ← usa admin
		.from('usuarios')
		.select('*');
	return data;
}
```

---

### Opción 3: Deshabilitar RLS (NO RECOMENDADO)

```sql
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
```

**Pros:**
- ✅ Extremadamente simple

**Contras:**
- ❌ **INSEGURO** para producción
- ❌ Cualquier cliente con credenciales puede ver/modificar todo
- ❌ No hay defensa a nivel de base de datos
- ❌ Solo válido para desarrollo/testing

**Solo usar:**
- Durante desarrollo local
- Para debugging temporal
- **NUNCA** en producción

---

## 📋 Plan de Acción Recomendado

### 🥇 Opción Recomendada: Función SECURITY DEFINER

1. **Ejecutar script corregido:**
   ```bash
   # En Supabase SQL Editor:
   documentacion/fix_rls_policies_CORRECTO.sql
   ```

2. **Verificar que funcione:**
   - Login como usuario normal → solo ve su perfil ✅
   - Login como admin → ve todos los usuarios ✅

3. **Reiniciar servidor backend:**
   ```bash
   cd backend
   npm run dev
   ```

4. **Probar endpoints:**
   ```bash
   # Como usuario normal
   GET /api/auth/me  # ✅ Funciona
   GET /api/usuarios # ❌ Error 403 (correcto)
   
   # Como admin
   GET /api/auth/me  # ✅ Funciona
   GET /api/usuarios # ✅ Funciona (ve todos)
   ```

---

## 🔍 Verificación del Sistema Actual

### Problema en base_de_datos.sql Original

**Líneas 202-213:**
```sql
CREATE POLICY "Administradores pueden ver todos los usuarios"
	ON public.usuarios FOR SELECT
	USING (
		EXISTS (
			SELECT 1 FROM public.usuarios
			WHERE auth_id = auth.uid() AND rol = 'administrador'
		)
	);
```

❌ **Recursión infinita** - mismo problema

### Problema en fix_rls_policies.sql Actual

**Líneas 21-25:**
```sql
CREATE POLICY "Administradores pueden ver todos los usuarios"
	ON public.usuarios FOR SELECT
	USING (
		(SELECT rol FROM public.usuarios WHERE auth_id = auth.uid() LIMIT 1) = 'administrador'
	);
```

❌ **Recursión infinita** - intento de solución fallido

---

## ✅ Cumplimiento de Requerimientos

### Del archivo `requerimientos.md`:

| Requerimiento | Estado Actual | Con Fix Correcto |
|---------------|---------------|------------------|
| Autenticación mediante JWT | ✅ Funciona | ✅ Funciona |
| Row Level Security (RLS) | ❌ Recursión | ✅ Funciona |
| Roles y permisos | ⚠️ Parcial | ✅ Completo |
| Admin: CRUD usuarios | ⚠️ Bloqueado por RLS | ✅ Funciona |
| Usuario: Ver solo su perfil | ✅ Funciona | ✅ Funciona |
| Organizador: Solo sus eventos | ✅ Funciona | ✅ Funciona |
| Taquilla: Validar boletos | ✅ Funciona | ✅ Funciona |

---

## 🎯 Conclusión

### Estado Actual: ❌ NO FUNCIONAL

El archivo `fix_rls_policies.sql` **no cumple** su objetivo porque:
1. ❌ Sigue causando recursión infinita
2. ❌ Las consultas de administradores fallarán
3. ❌ El sistema de roles no funciona correctamente a nivel de base de datos

### Solución: ✅ Aplicar fix_rls_policies_CORRECTO.sql

**Recomendación final:**
1. Ejecutar `fix_rls_policies_CORRECTO.sql` en Supabase
2. Probar todos los roles y permisos
3. Verificar que los endpoints funcionen correctamente
4. Reiniciar el servidor backend

---

## 📞 Testing Manual

### Test 1: Usuario Normal
```bash
# Login
POST /api/auth/login
{
  "email": "usuario@test.com",
  "password": "password"
}

# Ver mi perfil (✅ debe funcionar)
GET /api/auth/me

# Ver todos los usuarios (❌ debe fallar con 403)
GET /api/usuarios
```

### Test 2: Administrador
```bash
# Login
POST /api/auth/login
{
  "email": "admin@eventos.com",
  "password": "password"
}

# Ver mi perfil (✅ debe funcionar)
GET /api/auth/me

# Ver todos los usuarios (✅ debe funcionar)
GET /api/usuarios

# Crear usuario (✅ debe funcionar)
POST /api/usuarios
{
  "email": "nuevo@test.com",
  "password": "password123",
  "nombre": "Nuevo",
  "apellido": "Usuario",
  "rol": "asistente"
}
```

---

**Documento generado:** 2024-11-18  
**Estado:** Sistema requiere aplicar fix correcto  
**Prioridad:** 🔴 CRÍTICA

