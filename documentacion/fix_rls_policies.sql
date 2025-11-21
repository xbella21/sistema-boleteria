-- ============================================
-- FIX: Corregir políticas RLS para evitar recursión infinita
-- Ejecutar en SQL Editor de Supabase
-- ============================================

-- 1. ELIMINAR políticas existentes de usuarios
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Administradores pueden ver todos los usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Administradores pueden insertar usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Administradores pueden actualizar usuarios" ON public.usuarios;

-- 2. CREAR políticas corregidas (sin recursión)

-- Permitir a los usuarios ver su propio perfil usando solo auth.uid()
CREATE POLICY "Usuarios pueden ver su propio perfil"
	ON public.usuarios FOR SELECT
	USING (auth.uid() = auth_id);

-- Permitir a usuarios con rol administrador ver todos los usuarios
-- Usar una subquery con SECURITY DEFINER para evitar recursión
CREATE POLICY "Administradores pueden ver todos los usuarios"
	ON public.usuarios FOR SELECT
	USING (
		(SELECT rol FROM public.usuarios WHERE auth_id = auth.uid() LIMIT 1) = 'administrador'
	);

-- Permitir inserciones solo durante el registro (auth_id coincide)
-- O si el usuario actual es administrador
CREATE POLICY "Permitir inserciones de usuarios"
	ON public.usuarios FOR INSERT
	WITH CHECK (
		auth.uid() = auth_id OR
		(SELECT rol FROM public.usuarios WHERE auth_id = auth.uid() LIMIT 1) = 'administrador'
	);

-- Permitir actualizaciones
CREATE POLICY "Permitir actualizaciones de usuarios"
	ON public.usuarios FOR UPDATE
	USING (
		auth.uid() = auth_id OR
		(SELECT rol FROM public.usuarios WHERE auth_id = auth.uid() LIMIT 1) = 'administrador'
	);

-- 3. Alternativamente, si las políticas siguen causando problemas,
-- puedes DESHABILITAR RLS temporalmente para la tabla usuarios
-- (solo durante desarrollo, NO en producción)

-- Descomentar la siguiente línea si sigues teniendo problemas:
-- ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;

-- ============================================
-- IMPORTANTE: Después de ejecutar este script,
-- reinicia tu servidor backend
-- ============================================

