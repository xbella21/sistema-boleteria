-- ============================================
-- FIX CORRECTO: Políticas RLS sin recursión infinita
-- Ejecutar en SQL Editor de Supabase
-- ============================================

-- 1. ELIMINAR políticas existentes de usuarios
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Administradores pueden ver todos los usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Administradores pueden insertar usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Administradores pueden actualizar usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir inserciones de usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Permitir actualizaciones de usuarios" ON public.usuarios;

-- ============================================
-- SOLUCIÓN 1: Función con SECURITY DEFINER
-- ============================================

-- Crear función que obtiene el rol del usuario sin activar RLS
CREATE OR REPLACE FUNCTION public.obtener_rol_usuario(auth_uid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER -- Esta función se ejecuta con los permisos del creador, evitando RLS
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

-- ============================================
-- POLÍTICAS RLS CORREGIDAS (usando la función)
-- ============================================

-- Política 1: Usuarios pueden ver su propio perfil
CREATE POLICY "Usuarios pueden ver su propio perfil"
	ON public.usuarios FOR SELECT
	USING (auth.uid() = auth_id);

-- Política 2: Administradores pueden ver todos los usuarios
CREATE POLICY "Administradores pueden ver todos los usuarios"
	ON public.usuarios FOR SELECT
	USING (public.obtener_rol_usuario(auth.uid()) = 'administrador');

-- Política 3: Permitir inserciones durante registro o por administradores
CREATE POLICY "Permitir inserciones de usuarios"
	ON public.usuarios FOR INSERT
	WITH CHECK (
		auth.uid() = auth_id OR
		public.obtener_rol_usuario(auth.uid()) = 'administrador'
	);

-- Política 4: Permitir actualizaciones
CREATE POLICY "Permitir actualizaciones de usuarios"
	ON public.usuarios FOR UPDATE
	USING (
		auth.uid() = auth_id OR
		public.obtener_rol_usuario(auth.uid()) = 'administrador'
	);

-- Política 5: Permitir eliminaciones solo a administradores
CREATE POLICY "Administradores pueden eliminar usuarios"
	ON public.usuarios FOR DELETE
	USING (public.obtener_rol_usuario(auth.uid()) = 'administrador');

-- ============================================
-- SOLUCIÓN 2 (ALTERNATIVA): Usar cliente admin en backend
-- ============================================

-- Si prefieres manejar la autorización en el backend,
-- puedes usar políticas más simples y controlar el acceso
-- con el cliente supabaseAdmin (que bypasea RLS):

/*
-- Políticas simples para backend con supabaseAdmin:

CREATE POLICY "Usuarios pueden ver su propio perfil"
	ON public.usuarios FOR SELECT
	USING (auth.uid() = auth_id);

CREATE POLICY "Permitir inserciones durante registro"
	ON public.usuarios FOR INSERT
	WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
	ON public.usuarios FOR UPDATE
	USING (auth.uid() = auth_id);

-- Las operaciones administrativas (ver todos, crear otros, eliminar)
-- se harían con supabaseAdmin en el backend, que bypasea RLS
*/

-- ============================================
-- VERIFICACIÓN Y TESTING
-- ============================================

-- Verificar que la función existe
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'obtener_rol_usuario';

-- Verificar políticas activas
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'usuarios';

-- ============================================
-- IMPORTANTE: Después de ejecutar este script
-- ============================================
-- 1. Verifica que no haya errores en la consola de Supabase
-- 2. Prueba el login con diferentes roles
-- 3. Prueba que los administradores puedan ver todos los usuarios
-- 4. Prueba que los usuarios normales solo vean su perfil
-- 5. Reinicia el servidor backend para refrescar conexiones
-- ============================================

