-- ============================================
-- SCRIPT DE RESET COMPLETO DE BASE DE DATOS
-- Sistema de Gestión de Eventos
-- ============================================
-- Este script ELIMINA toda la base de datos existente
-- y la RECREA desde cero con todas las correcciones
-- ============================================

-- ============================================
-- PASO 1: ELIMINAR TODO LO EXISTENTE
-- ============================================

-- Deshabilitar y eliminar políticas RLS existentes
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.usuarios;
DROP POLICY IF EXISTS "Administradores pueden ver todos los usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Administradores pueden insertar usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Administradores pueden actualizar usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Todos pueden ver eventos activos" ON public.eventos;
DROP POLICY IF EXISTS "Organizadores y admins pueden crear eventos" ON public.eventos;
DROP POLICY IF EXISTS "Organizadores pueden actualizar sus eventos" ON public.eventos;
DROP POLICY IF EXISTS "Todos pueden ver categorías de eventos activos" ON public.categorias_entradas;
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios boletos" ON public.boletos;
DROP POLICY IF EXISTS "Usuarios autenticados pueden comprar boletos" ON public.boletos;
DROP POLICY IF EXISTS "Taquilla puede registrar ingresos" ON public.registro_ingresos;

-- Eliminar vistas
DROP VIEW IF EXISTS vista_estadisticas_eventos CASCADE;

-- Eliminar triggers
DROP TRIGGER IF EXISTS trigger_actualizar_usuarios ON public.usuarios CASCADE;
DROP TRIGGER IF EXISTS trigger_actualizar_eventos ON public.eventos CASCADE;
DROP TRIGGER IF EXISTS trigger_actualizar_aforo ON public.registro_ingresos CASCADE;
DROP TRIGGER IF EXISTS trigger_actualizar_cantidad_vendida ON public.boletos CASCADE;

-- Eliminar funciones
DROP FUNCTION IF EXISTS actualizar_fecha_modificacion() CASCADE;
DROP FUNCTION IF EXISTS actualizar_aforo_evento() CASCADE;
DROP FUNCTION IF EXISTS actualizar_cantidad_vendida() CASCADE;

-- Eliminar índices (se eliminarán automáticamente con las tablas, pero por si acaso)
DROP INDEX IF EXISTS idx_usuarios_auth_id CASCADE;
DROP INDEX IF EXISTS idx_usuarios_email CASCADE;
DROP INDEX IF EXISTS idx_usuarios_rol CASCADE;
DROP INDEX IF EXISTS idx_eventos_organizador CASCADE;
DROP INDEX IF EXISTS idx_eventos_estado CASCADE;
DROP INDEX IF EXISTS idx_eventos_fecha_inicio CASCADE;
DROP INDEX IF EXISTS idx_categorias_evento CASCADE;
DROP INDEX IF EXISTS idx_boletos_evento CASCADE;
DROP INDEX IF EXISTS idx_boletos_usuario CASCADE;
DROP INDEX IF EXISTS idx_boletos_codigo_qr CASCADE;
DROP INDEX IF EXISTS idx_boletos_estado CASCADE;
DROP INDEX IF EXISTS idx_registro_boleto CASCADE;
DROP INDEX IF EXISTS idx_registro_evento CASCADE;
DROP INDEX IF EXISTS idx_registro_fecha CASCADE;

-- Eliminar tablas en orden (respetando dependencias)
DROP TABLE IF EXISTS public.registro_ingresos CASCADE;
DROP TABLE IF EXISTS public.boletos CASCADE;
DROP TABLE IF EXISTS public.categorias_entradas CASCADE;
DROP TABLE IF EXISTS public.eventos CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;

-- ============================================
-- PASO 2: HABILITAR EXTENSIONES
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PASO 3: CREAR TABLAS
-- ============================================

-- TABLA: usuarios
CREATE TABLE public.usuarios (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
	nombre VARCHAR(100) NOT NULL,
	apellido VARCHAR(100) NOT NULL,
	email VARCHAR(255) UNIQUE NOT NULL,
	telefono VARCHAR(20),
	rol VARCHAR(20) NOT NULL CHECK (rol IN ('administrador', 'organizador', 'taquilla', 'asistente')),
	activo BOOLEAN DEFAULT true,
	fecha_creacion TIMESTAMP DEFAULT NOW(),
	fecha_actualizacion TIMESTAMP DEFAULT NOW()
);

-- Índices para usuarios
CREATE INDEX idx_usuarios_auth_id ON public.usuarios(auth_id);
CREATE INDEX idx_usuarios_email ON public.usuarios(email);
CREATE INDEX idx_usuarios_rol ON public.usuarios(rol);

-- TABLA: eventos
CREATE TABLE public.eventos (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	organizador_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
	nombre VARCHAR(200) NOT NULL,
	descripcion TEXT,
	fecha_inicio TIMESTAMP NOT NULL,
	fecha_fin TIMESTAMP NOT NULL,
	ubicacion VARCHAR(300) NOT NULL,
	direccion TEXT,
	imagen_url TEXT,
	aforo_maximo INTEGER NOT NULL DEFAULT 0,
	aforo_actual INTEGER DEFAULT 0,
	estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'cancelado', 'finalizado', 'borrador')),
	fecha_creacion TIMESTAMP DEFAULT NOW(),
	fecha_actualizacion TIMESTAMP DEFAULT NOW(),
	CONSTRAINT fechas_validas CHECK (fecha_fin >= fecha_inicio),
	CONSTRAINT aforo_valido CHECK (aforo_actual >= 0 AND aforo_actual <= aforo_maximo)
);

-- Índices para eventos
CREATE INDEX idx_eventos_organizador ON public.eventos(organizador_id);
CREATE INDEX idx_eventos_estado ON public.eventos(estado);
CREATE INDEX idx_eventos_fecha_inicio ON public.eventos(fecha_inicio);

-- TABLA: categorias_entradas
CREATE TABLE public.categorias_entradas (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	evento_id UUID REFERENCES public.eventos(id) ON DELETE CASCADE,
	nombre VARCHAR(100) NOT NULL,
	descripcion TEXT,
	precio DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
	cantidad_disponible INTEGER NOT NULL DEFAULT 0,
	cantidad_vendida INTEGER DEFAULT 0,
	fecha_creacion TIMESTAMP DEFAULT NOW(),
	CONSTRAINT cantidad_valida CHECK (cantidad_vendida >= 0 AND cantidad_vendida <= cantidad_disponible),
	CONSTRAINT precio_valido CHECK (precio >= 0)
);

-- Índices para categorias_entradas
CREATE INDEX idx_categorias_evento ON public.categorias_entradas(evento_id);

-- TABLA: boletos
CREATE TABLE public.boletos (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	evento_id UUID REFERENCES public.eventos(id) ON DELETE CASCADE,
	usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
	categoria_id UUID REFERENCES public.categorias_entradas(id) ON DELETE CASCADE,
	codigo_qr VARCHAR(255) UNIQUE NOT NULL,
	precio_pagado DECIMAL(10, 2) NOT NULL,
	estado VARCHAR(20) DEFAULT 'valido' CHECK (estado IN ('valido', 'usado', 'cancelado')),
	fecha_compra TIMESTAMP DEFAULT NOW(),
	fecha_uso TIMESTAMP,
	CONSTRAINT precio_pagado_valido CHECK (precio_pagado >= 0)
);

-- Índices para boletos
CREATE INDEX idx_boletos_evento ON public.boletos(evento_id);
CREATE INDEX idx_boletos_usuario ON public.boletos(usuario_id);
CREATE INDEX idx_boletos_codigo_qr ON public.boletos(codigo_qr);
CREATE INDEX idx_boletos_estado ON public.boletos(estado);

-- TABLA: registro_ingresos
CREATE TABLE public.registro_ingresos (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	boleto_id UUID REFERENCES public.boletos(id) ON DELETE CASCADE,
	evento_id UUID REFERENCES public.eventos(id) ON DELETE CASCADE,
	usuario_taquilla_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
	fecha_ingreso TIMESTAMP DEFAULT NOW(),
	ubicacion_escaneo VARCHAR(200)
);

-- Índices para registro_ingresos
CREATE INDEX idx_registro_boleto ON public.registro_ingresos(boleto_id);
CREATE INDEX idx_registro_evento ON public.registro_ingresos(evento_id);
CREATE INDEX idx_registro_fecha ON public.registro_ingresos(fecha_ingreso);

-- ============================================
-- PASO 4: CREAR FUNCIONES
-- ============================================

-- Función para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
	NEW.fecha_actualizacion = NOW();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar aforo del evento
CREATE OR REPLACE FUNCTION actualizar_aforo_evento()
RETURNS TRIGGER AS $$
BEGIN
	IF (TG_OP = 'INSERT') THEN
		UPDATE public.eventos
		SET aforo_actual = aforo_actual + 1
		WHERE id = NEW.evento_id;
	ELSIF (TG_OP = 'DELETE') THEN
		UPDATE public.eventos
		SET aforo_actual = GREATEST(0, aforo_actual - 1)
		WHERE id = OLD.evento_id;
	END IF;
	RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar cantidad vendida de categorías
CREATE OR REPLACE FUNCTION actualizar_cantidad_vendida()
RETURNS TRIGGER AS $$
BEGIN
	IF (TG_OP = 'INSERT' AND NEW.estado = 'valido') THEN
		UPDATE public.categorias_entradas
		SET cantidad_vendida = cantidad_vendida + 1
		WHERE id = NEW.categoria_id;
	ELSIF (TG_OP = 'UPDATE' AND OLD.estado = 'valido' AND NEW.estado = 'cancelado') THEN
		UPDATE public.categorias_entradas
		SET cantidad_vendida = GREATEST(0, cantidad_vendida - 1)
		WHERE id = NEW.categoria_id;
	END IF;
	RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PASO 5: CREAR TRIGGERS
-- ============================================

-- Triggers para actualizar fecha_actualizacion
CREATE TRIGGER trigger_actualizar_usuarios
	BEFORE UPDATE ON public.usuarios
	FOR EACH ROW
	EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trigger_actualizar_eventos
	BEFORE UPDATE ON public.eventos
	FOR EACH ROW
	EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Trigger para actualizar aforo cuando se registra un ingreso
CREATE TRIGGER trigger_actualizar_aforo
	AFTER INSERT OR DELETE ON public.registro_ingresos
	FOR EACH ROW
	EXECUTE FUNCTION actualizar_aforo_evento();

-- Trigger para actualizar cantidad vendida
CREATE TRIGGER trigger_actualizar_cantidad_vendida
	AFTER INSERT OR UPDATE ON public.boletos
	FOR EACH ROW
	EXECUTE FUNCTION actualizar_cantidad_vendida();

-- ============================================
-- PASO 6: HABILITAR RLS
-- ============================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registro_ingresos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 7: CREAR POLÍTICAS RLS
-- ============================================

-- Políticas para usuarios
CREATE POLICY "Usuarios pueden ver su propio perfil"
	ON public.usuarios FOR SELECT
	USING (auth.uid() = auth_id);

CREATE POLICY "Administradores pueden ver todos los usuarios"
	ON public.usuarios FOR SELECT
	USING (
		EXISTS (
			SELECT 1 FROM public.usuarios
			WHERE auth_id = auth.uid() AND rol = 'administrador'
		)
	);

CREATE POLICY "Administradores pueden insertar usuarios"
	ON public.usuarios FOR INSERT
	WITH CHECK (
		EXISTS (
			SELECT 1 FROM public.usuarios
			WHERE auth_id = auth.uid() AND rol = 'administrador'
		)
	);

CREATE POLICY "Administradores pueden actualizar usuarios"
	ON public.usuarios FOR UPDATE
	USING (
		EXISTS (
			SELECT 1 FROM public.usuarios
			WHERE auth_id = auth.uid() AND rol = 'administrador'
		)
	);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
	ON public.usuarios FOR UPDATE
	USING (auth.uid() = auth_id)
	WITH CHECK (auth.uid() = auth_id);

-- Políticas para eventos
CREATE POLICY "Todos pueden ver eventos activos"
	ON public.eventos FOR SELECT
	USING (estado = 'activo' OR estado = 'finalizado');

CREATE POLICY "Organizadores pueden ver sus propios eventos"
	ON public.eventos FOR SELECT
	USING (
		EXISTS (
			SELECT 1 FROM public.usuarios
			WHERE auth_id = auth.uid() AND (
				id = eventos.organizador_id OR
				rol = 'administrador'
			)
		)
	);

CREATE POLICY "Organizadores y admins pueden crear eventos"
	ON public.eventos FOR INSERT
	WITH CHECK (
		EXISTS (
			SELECT 1 FROM public.usuarios
			WHERE auth_id = auth.uid() AND (rol = 'organizador' OR rol = 'administrador')
		)
	);

CREATE POLICY "Organizadores pueden actualizar sus eventos"
	ON public.eventos FOR UPDATE
	USING (
		EXISTS (
			SELECT 1 FROM public.usuarios
			WHERE auth_id = auth.uid() AND (
				(rol = 'organizador' AND id = eventos.organizador_id) OR
				rol = 'administrador'
			)
		)
	);

CREATE POLICY "Organizadores pueden eliminar sus eventos"
	ON public.eventos FOR DELETE
	USING (
		EXISTS (
			SELECT 1 FROM public.usuarios
			WHERE auth_id = auth.uid() AND (
				(rol = 'organizador' AND id = eventos.organizador_id) OR
				rol = 'administrador'
			)
		)
	);

-- Políticas para categorías de entradas
CREATE POLICY "Todos pueden ver categorías de eventos activos"
	ON public.categorias_entradas FOR SELECT
	USING (
		EXISTS (
			SELECT 1 FROM public.eventos
			WHERE id = categorias_entradas.evento_id AND (
				estado = 'activo' OR 
				EXISTS (
					SELECT 1 FROM public.usuarios
					WHERE auth_id = auth.uid() AND (
						id = eventos.organizador_id OR
						rol = 'administrador'
					)
				)
			)
		)
	);

CREATE POLICY "Organizadores pueden crear categorías en sus eventos"
	ON public.categorias_entradas FOR INSERT
	WITH CHECK (
		EXISTS (
			SELECT 1 FROM public.eventos e
			JOIN public.usuarios u ON u.id = e.organizador_id
			WHERE e.id = categorias_entradas.evento_id 
			AND u.auth_id = auth.uid()
		) OR
		EXISTS (
			SELECT 1 FROM public.usuarios
			WHERE auth_id = auth.uid() AND rol = 'administrador'
		)
	);

CREATE POLICY "Organizadores pueden actualizar categorías de sus eventos"
	ON public.categorias_entradas FOR UPDATE
	USING (
		EXISTS (
			SELECT 1 FROM public.eventos e
			JOIN public.usuarios u ON u.id = e.organizador_id
			WHERE e.id = categorias_entradas.evento_id 
			AND u.auth_id = auth.uid()
		) OR
		EXISTS (
			SELECT 1 FROM public.usuarios
			WHERE auth_id = auth.uid() AND rol = 'administrador'
		)
	);

CREATE POLICY "Organizadores pueden eliminar categorías de sus eventos"
	ON public.categorias_entradas FOR DELETE
	USING (
		EXISTS (
			SELECT 1 FROM public.eventos e
			JOIN public.usuarios u ON u.id = e.organizador_id
			WHERE e.id = categorias_entradas.evento_id 
			AND u.auth_id = auth.uid()
		) OR
		EXISTS (
			SELECT 1 FROM public.usuarios
			WHERE auth_id = auth.uid() AND rol = 'administrador'
		)
	);

-- Políticas para boletos
CREATE POLICY "Usuarios pueden ver sus propios boletos"
	ON public.boletos FOR SELECT
	USING (
		EXISTS (
			SELECT 1 FROM public.usuarios
			WHERE auth_id = auth.uid() AND id = boletos.usuario_id
		) OR
		EXISTS (
			SELECT 1 FROM public.eventos e
			JOIN public.usuarios u ON u.id = e.organizador_id
			WHERE e.id = boletos.evento_id AND u.auth_id = auth.uid()
		) OR
		EXISTS (
			SELECT 1 FROM public.usuarios
			WHERE auth_id = auth.uid() AND rol = 'administrador'
		)
	);

CREATE POLICY "Usuarios autenticados pueden comprar boletos"
	ON public.boletos FOR INSERT
	WITH CHECK (
		EXISTS (
			SELECT 1 FROM public.usuarios
			WHERE auth_id = auth.uid() AND id = boletos.usuario_id
		)
	);

CREATE POLICY "Usuarios pueden cancelar sus propios boletos"
	ON public.boletos FOR UPDATE
	USING (
		EXISTS (
			SELECT 1 FROM public.usuarios
			WHERE auth_id = auth.uid() AND id = boletos.usuario_id
		)
	);

CREATE POLICY "Taquilla puede actualizar estado de boletos"
	ON public.boletos FOR UPDATE
	USING (
		EXISTS (
			SELECT 1 FROM public.usuarios
			WHERE auth_id = auth.uid() AND (rol = 'taquilla' OR rol = 'administrador')
		)
	);

-- Políticas para registro de ingresos
CREATE POLICY "Taquilla puede ver registros de ingresos"
	ON public.registro_ingresos FOR SELECT
	USING (
		EXISTS (
			SELECT 1 FROM public.usuarios
			WHERE auth_id = auth.uid() AND (rol = 'taquilla' OR rol = 'administrador')
		) OR
		EXISTS (
			SELECT 1 FROM public.eventos e
			JOIN public.usuarios u ON u.id = e.organizador_id
			WHERE e.id = registro_ingresos.evento_id AND u.auth_id = auth.uid()
		)
	);

CREATE POLICY "Taquilla puede registrar ingresos"
	ON public.registro_ingresos FOR INSERT
	WITH CHECK (
		EXISTS (
			SELECT 1 FROM public.usuarios
			WHERE auth_id = auth.uid() AND (rol = 'taquilla' OR rol = 'administrador')
		)
	);

-- ============================================
-- PASO 8: CREAR VISTAS
-- ============================================

CREATE OR REPLACE VIEW vista_estadisticas_eventos AS
SELECT
	e.id,
	e.nombre,
	e.fecha_inicio,
	e.aforo_maximo,
	e.aforo_actual,
	COUNT(DISTINCT b.id) AS total_boletos_vendidos,
	COALESCE(SUM(b.precio_pagado), 0) AS ingresos_totales,
	COUNT(DISTINCT CASE WHEN b.estado = 'usado' THEN b.id END) AS boletos_usados,
	COUNT(DISTINCT ri.id) AS total_ingresos_registrados
FROM public.eventos e
LEFT JOIN public.boletos b ON e.id = b.evento_id
LEFT JOIN public.registro_ingresos ri ON e.id = ri.evento_id
GROUP BY e.id, e.nombre, e.fecha_inicio, e.aforo_maximo, e.aforo_actual;

-- ============================================
-- CONFIRMACIÓN
-- ============================================

-- Verificar que todas las tablas se crearon correctamente
DO $$
DECLARE
	tabla_count INTEGER;
BEGIN
	SELECT COUNT(*) INTO tabla_count
	FROM information_schema.tables
	WHERE table_schema = 'public'
	AND table_name IN ('usuarios', 'eventos', 'categorias_entradas', 'boletos', 'registro_ingresos');
	
	IF tabla_count = 5 THEN
		RAISE NOTICE '✅ BASE DE DATOS RECREADA EXITOSAMENTE';
		RAISE NOTICE '✅ 5 tablas creadas';
		RAISE NOTICE '✅ Triggers y funciones creadas';
		RAISE NOTICE '✅ Políticas RLS configuradas';
		RAISE NOTICE '';
		RAISE NOTICE '🔐 PRÓXIMOS PASOS:';
		RAISE NOTICE '1. Crear usuario en Authentication → Users';
		RAISE NOTICE '2. Insertar registro en tabla usuarios con rol "administrador"';
		RAISE NOTICE '3. Configurar archivo .env del backend';
		RAISE NOTICE '4. Iniciar el servidor backend';
	ELSE
		RAISE EXCEPTION '❌ ERROR: Solo se crearon % tablas de 5', tabla_count;
	END IF;
END $$;

