-- ============================================
-- FIX RLS: Opción Backend (Políticas Simplificadas)
-- Esta opción maneja la autorización principalmente en el backend
-- Ejecutar en SQL Editor de Supabase
-- ============================================

-- 1. ELIMINAR todas las políticas existentes de usuarios
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Administradores pueden ver todos los usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Administradores pueden insertar usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Administradores pueden actualizar usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir inserciones de usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir actualizaciones de usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Administradores pueden eliminar usuarios" ON public.usuarios;

-- ============================================
-- POLÍTICAS SIMPLIFICADAS
-- La autorización de roles se maneja en el backend
-- ============================================

-- Política 1: Usuarios pueden ver su propio perfil
-- Esto permite que los middlewares de autenticación obtengan el usuario
CREATE POLICY "Usuarios pueden ver su propio perfil"
	ON public.usuarios FOR SELECT
	USING (auth.uid() = auth_id);

-- Política 2: Permitir auto-inserción durante registro
-- Permite que los usuarios se registren a sí mismos
CREATE POLICY "Permitir auto-inserción durante registro"
	ON public.usuarios FOR INSERT
	WITH CHECK (auth.uid() = auth_id);

-- Política 3: Usuarios pueden actualizar su propio perfil
-- Permite actualización de perfil propio
CREATE POLICY "Usuarios pueden actualizar su perfil"
	ON public.usuarios FOR UPDATE
	USING (auth.uid() = auth_id);

-- ============================================
-- IMPORTANTE: Operaciones Administrativas
-- ============================================

-- Las siguientes operaciones SE HACEN CON supabaseAdmin en el backend:
-- ✅ Ver todos los usuarios (GET /api/usuarios)
-- ✅ Crear usuarios con roles específicos (POST /api/usuarios)
-- ✅ Actualizar cualquier usuario (PUT /api/usuarios/:id)
-- ✅ Eliminar usuarios (DELETE /api/usuarios/:id)
-- ✅ Cambiar estado de usuarios (PATCH /api/usuarios/:id/estado)

-- El código en backend/servicios/servicio-usuarios.js debe usar:
-- - supabase: para operaciones del usuario actual (con RLS)
-- - supabaseAdmin: para operaciones administrativas (bypasea RLS)

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar políticas activas
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'usuarios';

-- Debería mostrar solo 3 políticas:
-- 1. Usuarios pueden ver su propio perfil (SELECT)
-- 2. Permitir auto-inserción durante registro (INSERT)
-- 3. Usuarios pueden actualizar su perfil (UPDATE)

-- ============================================
-- CAMBIOS NECESARIOS EN EL BACKEND
-- ============================================

/*
VERIFICAR que los servicios usen el cliente correcto:

1. servicio-usuarios.js debe cambiar:

// ❌ ANTES (causaba problemas con RLS)
async function obtenerUsuarios(pagina, limite) {
	const { data, error } = await supabase  // ← Bloqueado por RLS
		.from('usuarios')
		.select('*');
}

// ✅ DESPUÉS (usa admin para ver todos)
async function obtenerUsuarios(pagina, limite) {
	const { data, error } = await supabaseAdmin  // ← Bypasea RLS
		.from('usuarios')
		.select('*');
}

2. MANTENER supabase para operaciones del usuario actual:

// ✅ CORRECTO (usa cliente normal con RLS)
async function obtenerUsuarioPorAuthId(authId) {
	const { data, error } = await supabase  // ← Con RLS
		.from('usuarios')
		.select('*')
		.eq('auth_id', authId)
		.single();
}

3. Las rutas deben tener middlewares de autorización:

// En rutas-usuarios.js
router.get('/', autenticacion, esAdministrador, obtenerUsuarios);
//                              ^^^^^^^^^^^^^^^^
//                              Verifica en backend, no en DB
*/

-- ============================================
-- VENTAJAS DE ESTA OPCIÓN
-- ============================================

-- ✅ Políticas RLS más simples (sin recursión)
-- ✅ Control centralizado en el backend
-- ✅ Más fácil de mantener y debuggear
-- ✅ Ya está parcialmente implementado en el proyecto

-- ============================================
-- DESVENTAJAS DE ESTA OPCIÓN
-- ============================================

-- ⚠️ Seguridad depende del backend
-- ⚠️ Si hay bug en middleware, puede exponer datos
-- ⚠️ No funciona para acceso directo a Supabase
-- ⚠️ Requiere SUPABASE_SERVICE_KEY configurada

-- ============================================
-- PRUEBAS REQUERIDAS DESPUÉS DE APLICAR
-- ============================================

-- 1. Verificar que usuarios normales puedan:
--    ✅ Registrarse
--    ✅ Ver su propio perfil
--    ✅ Actualizar su propio perfil
--    ❌ Ver otros usuarios (debe fallar con 403 en backend)

-- 2. Verificar que administradores puedan:
--    ✅ Ver todos los usuarios
--    ✅ Crear usuarios con cualquier rol
--    ✅ Actualizar cualquier usuario
--    ✅ Eliminar usuarios
--    ✅ Cambiar estado de usuarios

-- ============================================
-- IMPORTANTE: Después de ejecutar este script
-- ============================================
-- 1. Verificar que SUPABASE_SERVICE_KEY esté en .env
-- 2. Actualizar servicio-usuarios.js (ver comentarios arriba)
-- 3. Verificar que middlewares de autorización estén en las rutas
-- 4. Reiniciar el servidor backend
-- 5. Probar todos los endpoints con diferentes roles
-- ============================================

