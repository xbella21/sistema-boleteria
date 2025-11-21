/**
 * Servicio para gestionar eventos
 * Interactúa con la tabla 'eventos' de Supabase
 */

const { supabase } = require('../config/supabase');
const { CODIGOS_ERROR, MENSAJES_ERROR, ESTADOS_EVENTO } = require('../config/constantes');

/**
 * Obtener todos los eventos con filtros opcionales
 * @param {Object} filtros - { estado, organizadorId, pagina, limite }
 * @returns {Promise<Object>} - { eventos, total, pagina, limite }
 */
async function obtenerEventos(filtros = {}) {
	try {
		await actualizarEstadosEventosAutomatico();

		const { estado, organizadorId, pagina = 1, limite = 20 } = filtros;
		const inicio = (pagina - 1) * limite;
		const fin = inicio + limite - 1;

		let query = supabase.from('eventos').select('*, usuarios!eventos_organizador_id_fkey(nombre, apellido, email)', { count: 'exact' });

		// Aplicar filtros
		if (estado) {
			query = query.eq('estado', estado);
		}
		if (organizadorId) {
			query = query.eq('organizador_id', organizadorId);
		}

		// Ordenar y paginar
		query = query
			.order('fecha_inicio', { ascending: true })
			.range(inicio, fin);

		const { data, error, count } = await query;

		if (error) throw error;

		const eventosConEstadisticas = await adjuntarEstadisticasEventos(data || []);

		return {
			eventos: eventosConEstadisticas,
			total: count,
			pagina,
			limite
		};
	} catch (error) {
		console.error('Error al obtener eventos:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Obtener eventos activos (públicos)
 * @param {number} pagina - Número de página
 * @param {number} limite - Límite de resultados
 * @returns {Promise<Object>} - { eventos, total, pagina, limite }
 */
async function obtenerEventosActivos(pagina = 1, limite = 20) {
	return obtenerEventos({ estado: ESTADOS_EVENTO.ACTIVO, pagina, limite });
}

/**
 * Obtener un evento por ID
 * @param {string} id - ID del evento
 * @returns {Promise<Object>} - Datos del evento
 */
async function obtenerEventoPorId(id) {
	try {
		const { data, error } = await supabase
			.from('eventos')
			.select('*, usuarios!eventos_organizador_id_fkey(nombre, apellido, email)')
			.eq('id', id)
			.single();

		if (error) throw error;
		if (!data) throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.RECURSO_NO_ENCONTRADO]);

		return data;
	} catch (error) {
		console.error('Error al obtener evento:', error);
		throw error;
	}
}

/**
 * Crear un nuevo evento
 * @param {Object} datosEvento - Datos del evento
 * @returns {Promise<Object>} - Evento creado
 */
async function crearEvento(datosEvento) {
	try {
		const { data, error } = await supabase
			.from('eventos')
			.insert(datosEvento)
			.select()
			.single();

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error al crear evento:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Actualizar un evento
 * @param {string} id - ID del evento
 * @param {Object} datosActualizados - Datos a actualizar
 * @returns {Promise<Object>} - Evento actualizado
 */
async function actualizarEvento(id, datosActualizados) {
	try {
		const { data, error } = await supabase
			.from('eventos')
			.update(datosActualizados)
			.eq('id', id)
			.select()
			.single();

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error al actualizar evento:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Eliminar un evento
 * @param {string} id - ID del evento
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
async function eliminarEvento(id) {
	try {
		const { error } = await supabase
			.from('eventos')
			.delete()
			.eq('id', id);

		if (error) throw error;
		return true;
	} catch (error) {
		console.error('Error al eliminar evento:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Cambiar estado de un evento
 * @param {string} id - ID del evento
 * @param {string} nuevoEstado - Nuevo estado
 * @returns {Promise<Object>} - Evento actualizado
 */
async function cambiarEstadoEvento(id, nuevoEstado) {
	try {
		const { data, error } = await supabase
			.from('eventos')
			.update({ estado: nuevoEstado })
			.eq('id', id)
			.select()
			.single();

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error al cambiar estado del evento:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Obtener estadísticas de un evento
 * @param {string} eventoId - ID del evento
 * @returns {Promise<Object>} - Estadísticas del evento
 */
async function obtenerEstadisticasEvento(eventoId) {
	try {
		const { data, error } = await supabase
			.from('vista_estadisticas_eventos')
			.select('*')
			.eq('id', eventoId)
			.single();

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error al obtener estadísticas:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Buscar eventos por nombre o ubicación
 * @param {string} termino - Término de búsqueda
 * @returns {Promise<Array>} - Lista de eventos
 */
async function buscarEventos(termino) {
	try {
		const { data, error } = await supabase
			.from('eventos')
			.select('*, usuarios!eventos_organizador_id_fkey(nombre, apellido)')
			.eq('estado', ESTADOS_EVENTO.ACTIVO)
			.or(`nombre.ilike.%${termino}%,ubicacion.ilike.%${termino}%`)
			.order('fecha_inicio', { ascending: true });

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error al buscar eventos:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Obtener eventos próximos (dentro de los próximos 30 días)
 * @param {number} limite - Límite de resultados
 * @returns {Promise<Array>} - Lista de eventos próximos
 */
async function obtenerEventosProximos(limite = 10) {
	try {
		const ahora = new Date();

		const { data, error } = await supabase
			.from('eventos')
			.select('*, usuarios!eventos_organizador_id_fkey(nombre, apellido)')
			.eq('estado', ESTADOS_EVENTO.ACTIVO)
			.gte('fecha_inicio', ahora.toISOString())
			.order('fecha_inicio', { ascending: true })
			.limit(limite);

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error al obtener eventos próximos:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Actualizar aforo de un evento (incrementar o decrementar)
 * @param {string} eventoId - ID del evento
 * @param {number} cantidad - Cantidad a incrementar (positivo) o decrementar (negativo)
 * @returns {Promise<Object>} - Evento actualizado
 */
async function actualizarAforoEvento(eventoId, cantidad) {
	try {
		const { supabaseAdmin } = require('../config/supabase');
		const clienteAdmin = supabaseAdmin || supabase;

		// Obtener el evento actual
		const evento = await obtenerEventoPorId(eventoId);
		const nuevoAforo = Math.max(0, Math.min(evento.aforo_maximo, evento.aforo_actual + cantidad));

		const { data, error } = await clienteAdmin
			.from('eventos')
			.update({ aforo_actual: nuevoAforo })
			.eq('id', eventoId)
			.select()
			.single();

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error al actualizar aforo del evento:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

async function actualizarEstadosEventosAutomatico() {
	try {
		const ahora = new Date().toISOString();

		const actualizaciones = [
			supabase
				.from('eventos')
				.update({ estado: ESTADOS_EVENTO.FINALIZADO })
				.lt('fecha_fin', ahora)
				.neq('estado', ESTADOS_EVENTO.FINALIZADO)
				.neq('estado', ESTADOS_EVENTO.CANCELADO),
			supabase
				.from('eventos')
				.update({ estado: ESTADOS_EVENTO.FINALIZADO })
				.is('fecha_fin', null)
				.lt('fecha_inicio', ahora)
				.neq('estado', ESTADOS_EVENTO.FINALIZADO)
				.neq('estado', ESTADOS_EVENTO.CANCELADO)
		];

		for (const consulta of actualizaciones) {
			const { error } = await consulta;
			if (error) throw error;
		}
	} catch (error) {
		console.error('Error al actualizar estados automáticos de eventos:', error);
	}
}

async function adjuntarEstadisticasEventos(eventos) {
	try {
		if (!eventos.length) {
			return eventos;
		}

		const ids = eventos.map(evento => evento.id);
		const { data, error } = await supabase
			.from('vista_estadisticas_eventos')
			.select('id,total_boletos_vendidos,ingresos_totales,total_ingresos_registrados')
			.in('id', ids);

		if (error) throw error;

		const mapa = {};
		(data || []).forEach(item => {
			mapa[item.id] = item;
		});

		return eventos.map(evento => ({
			...evento,
			total_boletos_vendidos: mapa[evento.id]?.total_boletos_vendidos || 0,
			ingresos_totales: mapa[evento.id]?.ingresos_totales || 0,
			aforo_registrado: mapa[evento.id]?.total_ingresos_registrados || 0
		}));
	} catch (error) {
		console.error('Error al adjuntar estadísticas a eventos:', error);
		return eventos;
	}
}

module.exports = {
	obtenerEventos,
	obtenerEventosActivos,
	obtenerEventoPorId,
	crearEvento,
	actualizarEvento,
	eliminarEvento,
	cambiarEstadoEvento,
	obtenerEstadisticasEvento,
	buscarEventos,
	obtenerEventosProximos,
	actualizarAforoEvento
};

