-- ============================================
-- SISTEMA DE GESTIÓN DE EVENTOS
-- Base de Datos Supabase
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: usuarios
-- Gestión de usuarios del sistema con roles
-- ============================================
CREATE TABLE IF NOT EXISTS public.usuarios (
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

-- Índices para optimización
CREATE INDEX idx_usuarios_auth_id ON public.usuarios(auth_id);
CREATE INDEX idx_usuarios_email ON public.usuarios(email);
CREATE INDEX idx_usuarios_rol ON public.usuarios(rol);

-- ============================================
-- TABLA: eventos
-- Almacena información de eventos
-- ============================================
CREATE TABLE IF NOT EXISTS public.eventos (
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

-- Índices
CREATE INDEX idx_eventos_organizador ON public.eventos(organizador_id);
CREATE INDEX idx_eventos_estado ON public.eventos(estado);
CREATE INDEX idx_eventos_fecha_inicio ON public.eventos(fecha_inicio);

-- ============================================
-- TABLA: categorias_entradas
-- Tipos de entradas por evento (VIP, General, etc)
-- ============================================
CREATE TABLE IF NOT EXISTS public.categorias_entradas (
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

-- Índices
CREATE INDEX idx_categorias_evento ON public.categorias_entradas(evento_id);

-- ============================================
-- TABLA: boletos
-- Boletos comprados por usuarios
-- ============================================
CREATE TABLE IF NOT EXISTS public.boletos (
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

-- Índices
CREATE INDEX idx_boletos_evento ON public.boletos(evento_id);
CREATE INDEX idx_boletos_usuario ON public.boletos(usuario_id);
CREATE INDEX idx_boletos_codigo_qr ON public.boletos(codigo_qr);
CREATE INDEX idx_boletos_estado ON public.boletos(estado);

-- ============================================
-- TABLA: registro_ingresos
-- Registra cada ingreso al evento mediante escaneo
-- ============================================
CREATE TABLE IF NOT EXISTS public.registro_ingresos (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	boleto_id UUID REFERENCES public.boletos(id) ON DELETE CASCADE,
	evento_id UUID REFERENCES public.eventos(id) ON DELETE CASCADE,
	usuario_taquilla_id UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
	fecha_ingreso TIMESTAMP DEFAULT NOW(),
	ubicacion_escaneo VARCHAR(200)
);

-- Índices
CREATE INDEX idx_registro_boleto ON public.registro_ingresos(boleto_id);
CREATE INDEX idx_registro_evento ON public.registro_ingresos(evento_id);
CREATE INDEX idx_registro_fecha ON public.registro_ingresos(fecha_ingreso);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
	NEW.fecha_actualizacion = NOW();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar fecha_actualizacion
CREATE TRIGGER trigger_actualizar_usuarios
	BEFORE UPDATE ON public.usuarios
	FOR EACH ROW
	EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trigger_actualizar_eventos
	BEFORE UPDATE ON public.eventos
	FOR EACH ROW
	EXECUTE FUNCTION actualizar_fecha_modificacion();

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

-- Trigger para actualizar aforo cuando se registra un ingreso
CREATE TRIGGER trigger_actualizar_aforo
	AFTER INSERT OR DELETE ON public.registro_ingresos
	FOR EACH ROW
	EXECUTE FUNCTION actualizar_aforo_evento();

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

-- Trigger para actualizar cantidad vendida
CREATE TRIGGER trigger_actualizar_cantidad_vendida
	AFTER INSERT OR UPDATE ON public.boletos
	FOR EACH ROW
	EXECUTE FUNCTION actualizar_cantidad_vendida();

-- ============================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_entradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registro_ingresos ENABLE ROW LEVEL SECURITY;

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

-- Políticas para eventos
CREATE POLICY "Todos pueden ver eventos activos"
	ON public.eventos FOR SELECT
	USING (estado = 'activo' OR estado = 'finalizado');

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

-- Políticas para categorías de entradas
CREATE POLICY "Todos pueden ver categorías de eventos activos"
	ON public.categorias_entradas FOR SELECT
	USING (
		EXISTS (
			SELECT 1 FROM public.eventos
			WHERE id = categorias_entradas.evento_id AND estado = 'activo'
		)
	);

-- Políticas para boletos
CREATE POLICY "Usuarios pueden ver sus propios boletos"
	ON public.boletos FOR SELECT
	USING (
		EXISTS (
			SELECT 1 FROM public.usuarios
			WHERE auth_id = auth.uid() AND id = boletos.usuario_id
		)
	);

CREATE POLICY "Usuarios autenticados pueden comprar boletos"
	ON public.boletos FOR INSERT
	WITH CHECK (
		EXISTS (
			SELECT 1 FROM public.usuarios
			WHERE auth_id = auth.uid()
		)
	);

-- Políticas para registro de ingresos
CREATE POLICY "Taquilla puede registrar ingresos"
	ON public.registro_ingresos FOR INSERT
	WITH CHECK (
		EXISTS (
			SELECT 1 FROM public.usuarios
			WHERE auth_id = auth.uid() AND (rol = 'taquilla' OR rol = 'administrador')
		)
	);

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista de estadísticas de eventos
CREATE OR REPLACE VIEW vista_estadisticas_eventos AS
SELECT
	e.id,
	e.nombre,
	e.fecha_inicio,
	e.aforo_maximo,
	e.aforo_actual,
	COUNT(DISTINCT b.id) AS total_boletos_vendidos,
	SUM(b.precio_pagado) AS ingresos_totales,
	COUNT(DISTINCT CASE WHEN b.estado = 'usado' THEN b.id END) AS boletos_usados,
	COUNT(DISTINCT ri.id) AS total_ingresos_registrados
FROM public.eventos e
LEFT JOIN public.boletos b ON e.id = b.evento_id
LEFT JOIN public.registro_ingresos ri ON e.id = ri.evento_id
GROUP BY e.id, e.nombre, e.fecha_inicio, e.aforo_maximo, e.aforo_actual;

-- ============================================
-- DATOS INICIALES (OPCIONAL)
-- ============================================

-- Nota: El usuario administrador inicial debe crearse desde Supabase Auth
-- Luego se debe insertar en la tabla usuarios manualmente con rol 'administrador'

-- Ejemplo de inserción de usuario administrador (ajustar auth_id):
-- INSERT INTO public.usuarios (auth_id, nombre, apellido, email, rol)
-- VALUES ('UUID-DEL-AUTH-USER', 'Admin', 'Sistema', 'admin@eventos.com', 'administrador');

