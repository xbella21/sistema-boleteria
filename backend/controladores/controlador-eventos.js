/**
 * Controlador de eventos
 * Maneja CRUD y operaciones relacionadas con eventos
 */

const servicioEventos = require('../servicios/servicio-eventos');
const servicioCategorias = require('../servicios/servicio-categorias');
const { ErrorValidacion, ErrorNoEncontrado } = require('../middlewares/manejo-errores');
const { validarPaginacion } = require('../utils/validaciones');

/**
 * Obtener todos los eventos (con filtros)
 * GET /api/eventos
 */
async function obtenerEventos(req, res) {
	try {
		const { estado, pagina, limite } = req.query;
		const usuario = req.usuario;

		const paginacionValida = validarPaginacion(pagina, limite);

		const filtros = {
			pagina: paginacionValida.pagina,
			limite: paginacionValida.limite
		};

		// Si el usuario es organizador, solo ver sus eventos
		if (usuario && usuario.rol === 'organizador') {
			filtros.organizadorId = usuario.id;
		}

		// Filtrar por estado si se proporciona
		if (estado) {
			filtros.estado = estado;
		}

		const resultado = await servicioEventos.obtenerEventos(filtros);

		return res.json({
			exito: true,
			datos: resultado
		});

	} catch (error) {
		console.error('Error al obtener eventos:', error);
		throw error;
	}
}

/**
 * Obtener eventos activos (público)
 * GET /api/eventos/activos
 */
async function obtenerEventosActivos(req, res) {
	try {
		const { pagina, limite } = req.query;
		const paginacionValida = validarPaginacion(pagina, limite);

		const resultado = await servicioEventos.obtenerEventosActivos(
			paginacionValida.pagina,
			paginacionValida.limite
		);

		return res.json({
			exito: true,
			datos: resultado
		});

	} catch (error) {
		console.error('Error al obtener eventos activos:', error);
		throw error;
	}
}

/**
 * Obtener eventos próximos
 * GET /api/eventos/proximos
 */
async function obtenerEventosProximos(req, res) {
	try {
		const { limite = 10 } = req.query;
		const eventos = await servicioEventos.obtenerEventosProximos(parseInt(limite));

		return res.json({
			exito: true,
			datos: eventos
		});

	} catch (error) {
		console.error('Error al obtener eventos próximos:', error);
		throw error;
	}
}

/**
 * Obtener un evento por ID
 * GET /api/eventos/:id
 */
async function obtenerEventoPorId(req, res) {
	try {
		const { id } = req.params;
		const evento = await servicioEventos.obtenerEventoPorId(id);

		if (!evento) {
			throw new ErrorNoEncontrado('Evento no encontrado');
		}

		// Obtener categorías del evento
		const categorias = await servicioCategorias.obtenerCategoriasPorEvento(id);

		return res.json({
			exito: true,
			datos: {
				...evento,
				categorias
			}
		});

	} catch (error) {
		console.error('Error al obtener evento:', error);
		throw error;
	}
}

/**
 * Crear un nuevo evento
 * POST /api/eventos
 */
async function crearEvento(req, res) {
	try {
		const usuario = req.usuario;
		const {
			nombre,
			descripcion,
			fecha_inicio,
			fecha_fin,
			ubicacion,
			direccion,
			imagen_url,
			aforo_maximo,
			estado
		} = req.body;

		// Validar fechas
		if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
			throw new ErrorValidacion('La fecha de fin debe ser posterior a la fecha de inicio');
		}

		const datosEvento = {
			organizador_id: usuario.id,
			nombre,
			descripcion: descripcion || null,
			fecha_inicio,
			fecha_fin,
			ubicacion,
			direccion: direccion || null,
			imagen_url: imagen_url || null,
			aforo_maximo,
			aforo_actual: 0,
			estado: estado || 'borrador'
		};

		const nuevoEvento = await servicioEventos.crearEvento(datosEvento);

		return res.status(201).json({
			exito: true,
			mensaje: 'Evento creado exitosamente',
			datos: nuevoEvento
		});

	} catch (error) {
		console.error('Error al crear evento:', error);
		throw error;
	}
}

/**
 * Actualizar un evento
 * PUT /api/eventos/:id
 */
async function actualizarEvento(req, res) {
	try {
		const { id } = req.params;
		const datosActualizados = req.body;

		// Validar que el evento existe (ya validado por middleware)
		const evento = req.evento || await servicioEventos.obtenerEventoPorId(id);

		// Validar fechas si se actualizan
		if (datosActualizados.fecha_inicio && datosActualizados.fecha_fin) {
			if (new Date(datosActualizados.fecha_fin) <= new Date(datosActualizados.fecha_inicio)) {
				throw new ErrorValidacion('La fecha de fin debe ser posterior a la fecha de inicio');
			}
		}

		const eventoActualizado = await servicioEventos.actualizarEvento(id, datosActualizados);

		return res.json({
			exito: true,
			mensaje: 'Evento actualizado exitosamente',
			datos: eventoActualizado
		});

	} catch (error) {
		console.error('Error al actualizar evento:', error);
		throw error;
	}
}

/**
 * Eliminar un evento
 * DELETE /api/eventos/:id
 */
async function eliminarEvento(req, res) {
	try {
		const { id } = req.params;

		await servicioEventos.eliminarEvento(id);

		return res.json({
			exito: true,
			mensaje: 'Evento eliminado exitosamente'
		});

	} catch (error) {
		console.error('Error al eliminar evento:', error);
		throw error;
	}
}

/**
 * Cambiar estado de un evento
 * PATCH /api/eventos/:id/estado
 */
async function cambiarEstadoEvento(req, res) {
	try {
		const { id } = req.params;
		const { estado } = req.body;

		const eventoActualizado = await servicioEventos.cambiarEstadoEvento(id, estado);

		return res.json({
			exito: true,
			mensaje: 'Estado del evento actualizado',
			datos: eventoActualizado
		});

	} catch (error) {
		console.error('Error al cambiar estado del evento:', error);
		throw error;
	}
}

/**
 * Obtener estadísticas de un evento
 * GET /api/eventos/:id/estadisticas
 */
async function obtenerEstadisticas(req, res) {
	try {
		const { id } = req.params;

		const estadisticas = await servicioEventos.obtenerEstadisticasEvento(id);

		return res.json({
			exito: true,
			datos: estadisticas
		});

	} catch (error) {
		console.error('Error al obtener estadísticas:', error);
		throw error;
	}
}

/**
 * Buscar eventos
 * GET /api/eventos/buscar
 */
async function buscarEventos(req, res) {
	try {
		const { termino } = req.query;

		if (!termino || termino.trim().length === 0) {
			throw new ErrorValidacion('Debe proporcionar un término de búsqueda');
		}

		const eventos = await servicioEventos.buscarEventos(termino);

		return res.json({
			exito: true,
			datos: eventos
		});

	} catch (error) {
		console.error('Error al buscar eventos:', error);
		throw error;
	}
}

module.exports = {
	obtenerEventos,
	obtenerEventosActivos,
	obtenerEventosProximos,
	obtenerEventoPorId,
	crearEvento,
	actualizarEvento,
	eliminarEvento,
	cambiarEstadoEvento,
	obtenerEstadisticas,
	buscarEventos
};

