/**
 * Servicio para gestionar categorías de entradas
 * Interactúa con la tabla 'categorias_entradas' de Supabase
 */

const { supabase } = require('../config/supabase');
const { CODIGOS_ERROR, MENSAJES_ERROR } = require('../config/constantes');

/**
 * Obtener todas las categorías de un evento
 * @param {string} eventoId - ID del evento
 * @returns {Promise<Array>} - Lista de categorías
 */
async function obtenerCategoriasPorEvento(eventoId) {
	try {
		const { data, error } = await supabase
			.from('categorias_entradas')
			.select('*')
			.eq('evento_id', eventoId)
			.order('precio', { ascending: true });

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error al obtener categorías:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Obtener una categoría por ID
 * @param {string} id - ID de la categoría
 * @returns {Promise<Object>} - Datos de la categoría
 */
async function obtenerCategoriaPorId(id) {
	try {
		const { data, error } = await supabase
			.from('categorias_entradas')
			.select('*')
			.eq('id', id)
			.single();

		if (error) throw error;
		if (!data) throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.RECURSO_NO_ENCONTRADO]);

		return data;
	} catch (error) {
		console.error('Error al obtener categoría:', error);
		throw error;
	}
}

/**
 * Crear una nueva categoría de entrada
 * @param {Object} datosCategoria - Datos de la categoría
 * @returns {Promise<Object>} - Categoría creada
 */
async function crearCategoria(datosCategoria) {
	try {
		const { data, error } = await supabase
			.from('categorias_entradas')
			.insert(datosCategoria)
			.select()
			.single();

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error al crear categoría:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Actualizar una categoría
 * @param {string} id - ID de la categoría
 * @param {Object} datosActualizados - Datos a actualizar
 * @returns {Promise<Object>} - Categoría actualizada
 */
async function actualizarCategoria(id, datosActualizados) {
	try {
		const { data, error } = await supabase
			.from('categorias_entradas')
			.update(datosActualizados)
			.eq('id', id)
			.select()
			.single();

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error al actualizar categoría:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Eliminar una categoría
 * @param {string} id - ID de la categoría
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
async function eliminarCategoria(id) {
	try {
		const { error } = await supabase
			.from('categorias_entradas')
			.delete()
			.eq('id', id);

		if (error) throw error;
		return true;
	} catch (error) {
		console.error('Error al eliminar categoría:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Verificar disponibilidad de entradas en una categoría
 * @param {string} categoriaId - ID de la categoría
 * @param {number} cantidadSolicitada - Cantidad solicitada
 * @returns {Promise<boolean>} - true si hay disponibilidad
 */
async function verificarDisponibilidad(categoriaId, cantidadSolicitada) {
	try {
		const categoria = await obtenerCategoriaPorId(categoriaId);
		const disponibles = categoria.cantidad_disponible - categoria.cantidad_vendida;
		return disponibles >= cantidadSolicitada;
	} catch (error) {
		console.error('Error al verificar disponibilidad:', error);
		throw error;
	}
}

/**
 * Obtener categorías con disponibilidad de un evento
 * @param {string} eventoId - ID del evento
 * @returns {Promise<Array>} - Lista de categorías con disponibilidad
 */
async function obtenerCategoriasDisponibles(eventoId) {
	try {
		const { data, error } = await supabase
			.from('categorias_entradas')
			.select('*')
			.eq('evento_id', eventoId)
			.filter('cantidad_vendida', 'lt', 'cantidad_disponible')
			.order('precio', { ascending: true });

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error al obtener categorías disponibles:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

module.exports = {
	obtenerCategoriasPorEvento,
	obtenerCategoriaPorId,
	crearCategoria,
	actualizarCategoria,
	eliminarCategoria,
	verificarDisponibilidad,
	obtenerCategoriasDisponibles
};

