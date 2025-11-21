/**
 * Servicio para gestionar registros de ingresos
 * Interactúa con la tabla 'registro_ingresos' de Supabase
 */

const { supabase, supabaseAdmin } = require('../config/supabase');
const { CODIGOS_ERROR, MENSAJES_ERROR } = require('../config/constantes');

/**
 * Registrar un ingreso al evento
 * @param {Object} datosIngreso - Datos del ingreso
 * @returns {Promise<Object>} - Registro creado
 */
async function registrarIngreso(datosIngreso) {
	try {
		const clienteAdmin = supabaseAdmin || supabase;

		const { data, error } = await clienteAdmin
			.from('registro_ingresos')
			.insert(datosIngreso)
			.select()
			.single();

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error al registrar ingreso:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Obtener todos los ingresos de un evento
 * @param {string} eventoId - ID del evento
 * @returns {Promise<Array>} - Lista de ingresos
 */
async function obtenerIngresosPorEvento(eventoId) {
	try {
		const { data, error } = await supabase
			.from('registro_ingresos')
			.select(`
				*,
				boletos(codigo_qr, categorias_entradas(nombre)),
				usuarios!registro_ingresos_usuario_taquilla_id_fkey(nombre, apellido)
			`)
			.eq('evento_id', eventoId)
			.order('fecha_ingreso', { ascending: false });

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error al obtener ingresos del evento:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Obtener ingresos de un evento en tiempo real (últimos N)
 * @param {string} eventoId - ID del evento
 * @param {number} limite - Límite de resultados
 * @returns {Promise<Array>} - Lista de ingresos recientes
 */
async function obtenerIngresosRecientes(eventoId, limite = 50) {
	try {
		const { data, error } = await supabase
			.from('registro_ingresos')
			.select(`
				*,
				boletos(codigo_qr)
			`)
			.eq('evento_id', eventoId)
			.order('fecha_ingreso', { ascending: false })
			.limit(limite);

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error al obtener ingresos recientes:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Verificar si un boleto ya tiene ingreso registrado
 * @param {string} boletoId - ID del boleto
 * @returns {Promise<boolean>} - true si ya tiene ingreso
 */
async function verificarIngresoExistente(boletoId) {
	try {
		const { data, error } = await supabase
			.from('registro_ingresos')
			.select('id')
			.eq('boleto_id', boletoId)
			.single();

		if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no encontrado
		return !!data;
	} catch (error) {
		console.error('Error al verificar ingreso existente:', error);
		return false;
	}
}

/**
 * Obtener cantidad de ingresos de un evento (aforo actual)
 * @param {string} eventoId - ID del evento
 * @returns {Promise<number>} - Cantidad de ingresos
 */
async function obtenerCantidadIngresos(eventoId) {
	try {
		const { count, error } = await supabase
			.from('registro_ingresos')
			.select('*', { count: 'exact', head: true })
			.eq('evento_id', eventoId);

		if (error) throw error;
		return count || 0;
	} catch (error) {
		console.error('Error al obtener cantidad de ingresos:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Obtener estadísticas de ingresos por categoría
 * @param {string} eventoId - ID del evento
 * @returns {Promise<Array>} - Estadísticas por categoría
 */
async function obtenerEstadisticasIngresosPorCategoria(eventoId) {
	try {
		const { data, error } = await supabase
			.from('registro_ingresos')
			.select(`
				boletos(categorias_entradas(id, nombre))
			`)
			.eq('evento_id', eventoId);

		if (error) throw error;

		// Agrupar por categoría
		const agrupado = data.reduce((acc, registro) => {
			const categoria = registro.boletos?.categorias_entradas;
			if (categoria) {
				const key = categoria.id;
				if (!acc[key]) {
					acc[key] = {
						categoria_id: categoria.id,
						categoria_nombre: categoria.nombre,
						cantidad: 0
					};
				}
				acc[key].cantidad++;
			}
			return acc;
		}, {});

		return Object.values(agrupado);
	} catch (error) {
		console.error('Error al obtener estadísticas de ingresos:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Suscribirse a cambios en tiempo real de ingresos de un evento
 * @param {string} eventoId - ID del evento
 * @param {Function} callback - Función a ejecutar cuando hay un nuevo ingreso
 * @returns {Object} - Suscripción (para poder cancelarla después)
 */
function suscribirseAIngresos(eventoId, callback) {
	const suscripcion = supabase
		.channel(`ingresos-${eventoId}`)
		.on(
			'postgres_changes',
			{
				event: 'INSERT',
				schema: 'public',
				table: 'registro_ingresos',
				filter: `evento_id=eq.${eventoId}`
			},
			(payload) => {
				callback(payload.new);
			}
		)
		.subscribe();

	return suscripcion;
}

module.exports = {
	registrarIngreso,
	obtenerIngresosPorEvento,
	obtenerIngresosRecientes,
	verificarIngresoExistente,
	obtenerCantidadIngresos,
	obtenerEstadisticasIngresosPorCategoria,
	suscribirseAIngresos
};

