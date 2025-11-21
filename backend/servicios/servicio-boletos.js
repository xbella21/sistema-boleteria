/**
 * Servicio para gestionar boletos
 * Interactúa con la tabla 'boletos' de Supabase
 */

const { supabase, supabaseAdmin } = require('../config/supabase');
const { CODIGOS_ERROR, MENSAJES_ERROR, ESTADOS_BOLETO } = require('../config/constantes');
const { generarCodigoUnico } = require('../utils/generador-qr');

/**
 * Obtener todos los boletos de un usuario
 * @param {string} usuarioId - ID del usuario
 * @returns {Promise<Array>} - Lista de boletos
 */
async function obtenerBoletosPorUsuario(usuarioId) {
	try {
		// Usar supabaseAdmin para bypass de RLS si es necesario
		const { supabaseAdmin } = require('../config/supabase');
		const clienteAdmin = supabaseAdmin || supabase;

		const { data, error } = await clienteAdmin
			.from('boletos')
			.select(`
				*,
				eventos(nombre, fecha_inicio, ubicacion, imagen_url),
				categorias_entradas(nombre, descripcion)
			`)
			.eq('usuario_id', usuarioId)
			.order('fecha_compra', { ascending: false });

		if (error) throw error;
		return data || [];
	} catch (error) {
		console.error('Error al obtener boletos del usuario:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Obtener todos los boletos de un evento
 * @param {string} eventoId - ID del evento
 * @returns {Promise<Array>} - Lista de boletos
 */
async function obtenerBoletosPorEvento(eventoId) {
	try {
		const clienteAdmin = supabaseAdmin || supabase;

		const { data, error } = await clienteAdmin
			.from('boletos')
			.select(`
				*,
				usuarios(nombre, apellido, email),
				categorias_entradas(nombre)
			`)
			.eq('evento_id', eventoId)
			.order('fecha_compra', { ascending: false });

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error al obtener boletos del evento:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Obtener un boleto por ID
 * @param {string} id - ID del boleto
 * @returns {Promise<Object>} - Datos del boleto
 */
async function obtenerBoletoPorId(id) {
	try {
		const { data, error } = await supabase
			.from('boletos')
			.select(`
				*,
				eventos(nombre, fecha_inicio, ubicacion, imagen_url),
				usuarios(nombre, apellido, email),
				categorias_entradas(nombre, descripcion)
			`)
			.eq('id', id)
			.single();

		if (error) throw error;
		if (!data) throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.RECURSO_NO_ENCONTRADO]);

		return data;
	} catch (error) {
		console.error('Error al obtener boleto:', error);
		throw error;
	}
}

/**
 * Obtener boleto por código QR
 * @param {string} codigoQR - Código QR del boleto
 * @returns {Promise<Object>} - Datos del boleto
 */
async function obtenerBoletoPorCodigoQR(codigoQR) {
	try {
		console.log('Buscando boleto por código QR:', codigoQR);
		const { supabaseAdmin } = require('../config/supabase');
		const clienteAdmin = supabaseAdmin || supabase;

		const { data, error } = await clienteAdmin
			.from('boletos')
			.select(`
				*,
				eventos(nombre, fecha_inicio, ubicacion, imagen_url, aforo_maximo, aforo_actual),
				usuarios(nombre, apellido, email),
				categorias_entradas(nombre, descripcion)
			`)
			.eq('codigo_qr', codigoQR)
			.single();

		if (error) throw error;
		if (!data) throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.BOLETO_INVALIDO]);

		return data;
	} catch (error) {
		console.error('Error al obtener boleto por código QR:', error);
		throw error;
	}
}

/**
 * Crear un nuevo boleto
 * @param {Object} datosBoleto - Datos del boleto
 * @returns {Promise<Object>} - Boleto creado
 */
async function crearBoleto(datosBoleto) {
	try {
		// Generar código QR único
		const codigoUnico = generarCodigoUnico(
			datosBoleto.usuario_id || 'temp',
			datosBoleto.evento_id
		);

		const boletoCompleto = {
			...datosBoleto,
			codigo_qr: codigoUnico,
			estado: ESTADOS_BOLETO.VALIDO
		};

		const { data, error } = await supabase
			.from('boletos')
			.insert(boletoCompleto)
			.select()
			.single();

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error al crear boleto:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Crear múltiples boletos (compra en lote)
 * @param {Array} boletos - Array de boletos a crear
 * @returns {Promise<Array>} - Boletos creados
 */
async function crearBoletos(boletos) {
	try {
		// Validar que boletos sea un array y no esté vacío
		if (!Array.isArray(boletos) || boletos.length === 0) {
			throw new Error('Debe proporcionar al menos un boleto para crear');
		}

		// Validar que cada boleto tenga los campos requeridos
		for (const boleto of boletos) {
			if (!boleto.evento_id || !boleto.usuario_id || !boleto.categoria_id) {
				throw new Error('Cada boleto debe tener evento_id, usuario_id y categoria_id');
			}
		}

		// Generar códigos QR únicos para cada boleto
		const boletosConCodigo = boletos.map((boleto, index) => {
			// Agregar un índice único para evitar colisiones en la misma transacción
			const identificadorUnico = `${boleto.usuario_id}-${Date.now()}-${index}`;
			return {
				...boleto,
				codigo_qr: generarCodigoUnico(
					identificadorUnico,
					boleto.evento_id
				),
				estado: ESTADOS_BOLETO.VALIDO
			};
		});

		console.log('Intentando crear boletos:', boletosConCodigo.length);
		console.log('Primer boleto:', JSON.stringify(boletosConCodigo[0], null, 2));

		// Usar supabaseAdmin para bypass de RLS en operaciones del backend
		const clienteAdmin = supabaseAdmin || supabase;
		const { data, error } = await clienteAdmin
			.from('boletos')
			.insert(boletosConCodigo)
			.select();

		if (error) {
			console.error('Error de Supabase al insertar boletos:', error);
			console.error('Detalles del error:', JSON.stringify(error, null, 2));
			throw error;
		}

		console.log('Boletos creados exitosamente:', data.length);
		return data;
	} catch (error) {
		console.error('Error al crear boletos:', error);
		console.error('Stack trace:', error.stack);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Actualizar estado de un boleto
 * @param {string} id - ID del boleto
 * @param {string} nuevoEstado - Nuevo estado
 * @returns {Promise<Object>} - Boleto actualizado
 */
async function actualizarEstadoBoleto(id, nuevoEstado) {
	try {
		const datosActualizacion = {
			estado: nuevoEstado
		};

		// Si el estado es 'usado', registrar la fecha
		if (nuevoEstado === ESTADOS_BOLETO.USADO) {
			datosActualizacion.fecha_uso = new Date().toISOString();
		}

		const clienteAdmin = supabaseAdmin || supabase;

		const { data, error } = await clienteAdmin
			.from('boletos')
			.update(datosActualizacion)
			.eq('id', id)
			.select()
			.single();

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error al actualizar estado del boleto:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Cancelar un boleto
 * @param {string} id - ID del boleto
 * @returns {Promise<Object>} - Boleto cancelado
 */
async function cancelarBoleto(id) {
	return actualizarEstadoBoleto(id, ESTADOS_BOLETO.CANCELADO);
}

/**
 * Marcar boleto como usado
 * @param {string} id - ID del boleto
 * @returns {Promise<Object>} - Boleto actualizado
 */
async function marcarBoletoUsado(id) {
	return actualizarEstadoBoleto(id, ESTADOS_BOLETO.USADO);
}

/**
 * Obtener estadísticas de boletos por evento
 * @param {string} eventoId - ID del evento
 * @returns {Promise<Object>} - Estadísticas
 */
async function obtenerEstadisticasBoletos(eventoId) {
	try {
		const { data, error } = await supabase
			.from('boletos')
			.select('estado, precio_pagado')
			.eq('evento_id', eventoId);

		if (error) throw error;

		const estadisticas = {
			total: data.length,
			validos: data.filter(b => b.estado === ESTADOS_BOLETO.VALIDO).length,
			usados: data.filter(b => b.estado === ESTADOS_BOLETO.USADO).length,
			cancelados: data.filter(b => b.estado === ESTADOS_BOLETO.CANCELADO).length,
			ingresos_totales: data.reduce((sum, b) => sum + parseFloat(b.precio_pagado), 0)
		};

		return estadisticas;
	} catch (error) {
		console.error('Error al obtener estadísticas de boletos:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

module.exports = {
	obtenerBoletosPorUsuario,
	obtenerBoletosPorEvento,
	obtenerBoletoPorId,
	obtenerBoletoPorCodigoQR,
	crearBoleto,
	crearBoletos,
	actualizarEstadoBoleto,
	cancelarBoleto,
	marcarBoletoUsado,
	obtenerEstadisticasBoletos
};

