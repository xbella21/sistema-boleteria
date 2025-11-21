/**
 * Controlador de categorías de entradas
 * Maneja CRUD de categorías por evento
 */

const servicioCategorias = require('../servicios/servicio-categorias');
const { ErrorValidacion, ErrorNoEncontrado } = require('../middlewares/manejo-errores');

/**
 * Obtener categorías de un evento
 * GET /api/categorias/evento/:eventoId
 */
async function obtenerCategoriasPorEvento(req, res) {
	try {
		const { eventoId } = req.params;
		const categorias = await servicioCategorias.obtenerCategoriasPorEvento(eventoId);

		return res.json({
			exito: true,
			datos: categorias
		});

	} catch (error) {
		console.error('Error al obtener categorías:', error);
		throw error;
	}
}

/**
 * Obtener categorías disponibles de un evento
 * GET /api/categorias/evento/:eventoId/disponibles
 */
async function obtenerCategoriasDisponibles(req, res) {
	try {
		const { eventoId } = req.params;
		const categorias = await servicioCategorias.obtenerCategoriasDisponibles(eventoId);

		return res.json({
			exito: true,
			datos: categorias
		});

	} catch (error) {
		console.error('Error al obtener categorías disponibles:', error);
		throw error;
	}
}

/**
 * Obtener una categoría por ID
 * GET /api/categorias/:id
 */
async function obtenerCategoriaPorId(req, res) {
	try {
		const { id } = req.params;
		const categoria = await servicioCategorias.obtenerCategoriaPorId(id);

		if (!categoria) {
			throw new ErrorNoEncontrado('Categoría no encontrada');
		}

		return res.json({
			exito: true,
			datos: categoria
		});

	} catch (error) {
		console.error('Error al obtener categoría:', error);
		throw error;
	}
}

/**
 * Crear una nueva categoría
 * POST /api/categorias
 */
async function crearCategoria(req, res) {
	try {
		const {
			evento_id,
			nombre,
			descripcion,
			precio,
			cantidad_disponible
		} = req.body;

		const datosCategoria = {
			evento_id,
			nombre,
			descripcion: descripcion || null,
			precio,
			cantidad_disponible,
			cantidad_vendida: 0
		};

		const nuevaCategoria = await servicioCategorias.crearCategoria(datosCategoria);

		return res.status(201).json({
			exito: true,
			mensaje: 'Categoría creada exitosamente',
			datos: nuevaCategoria
		});

	} catch (error) {
		console.error('Error al crear categoría:', error);
		throw error;
	}
}

/**
 * Actualizar una categoría
 * PUT /api/categorias/:id
 */
async function actualizarCategoria(req, res) {
	try {
		const { id } = req.params;
		const datosActualizados = req.body;

		// Verificar que la categoría existe
		const categoria = await servicioCategorias.obtenerCategoriaPorId(id);
		if (!categoria) {
			throw new ErrorNoEncontrado('Categoría no encontrada');
		}

		// Validar que cantidad_disponible no sea menor que cantidad_vendida
		if (datosActualizados.cantidad_disponible !== undefined) {
			if (datosActualizados.cantidad_disponible < categoria.cantidad_vendida) {
				throw new ErrorValidacion(
					`La cantidad disponible no puede ser menor que la cantidad vendida (${categoria.cantidad_vendida})`
				);
			}
		}

		const categoriaActualizada = await servicioCategorias.actualizarCategoria(id, datosActualizados);

		return res.json({
			exito: true,
			mensaje: 'Categoría actualizada exitosamente',
			datos: categoriaActualizada
		});

	} catch (error) {
		console.error('Error al actualizar categoría:', error);
		throw error;
	}
}

/**
 * Eliminar una categoría
 * DELETE /api/categorias/:id
 */
async function eliminarCategoria(req, res) {
	try {
		const { id } = req.params;

		// Verificar que la categoría existe
		const categoria = await servicioCategorias.obtenerCategoriaPorId(id);
		if (!categoria) {
			throw new ErrorNoEncontrado('Categoría no encontrada');
		}

		// Verificar que no tenga boletos vendidos
		if (categoria.cantidad_vendida > 0) {
			throw new ErrorValidacion(
				'No se puede eliminar una categoría con boletos vendidos'
			);
		}

		await servicioCategorias.eliminarCategoria(id);

		return res.json({
			exito: true,
			mensaje: 'Categoría eliminada exitosamente'
		});

	} catch (error) {
		console.error('Error al eliminar categoría:', error);
		throw error;
	}
}

/**
 * Verificar disponibilidad de una categoría
 * GET /api/categorias/:id/disponibilidad
 */
async function verificarDisponibilidad(req, res) {
	try {
		const { id } = req.params;
		const { cantidad = 1 } = req.query;

		const hayDisponibilidad = await servicioCategorias.verificarDisponibilidad(
			id,
			parseInt(cantidad)
		);

		const categoria = await servicioCategorias.obtenerCategoriaPorId(id);
		const disponibles = categoria.cantidad_disponible - categoria.cantidad_vendida;

		return res.json({
			exito: true,
			datos: {
				hay_disponibilidad: hayDisponibilidad,
				cantidad_disponible: disponibles,
				cantidad_solicitada: parseInt(cantidad)
			}
		});

	} catch (error) {
		console.error('Error al verificar disponibilidad:', error);
		throw error;
	}
}

module.exports = {
	obtenerCategoriasPorEvento,
	obtenerCategoriasDisponibles,
	obtenerCategoriaPorId,
	crearCategoria,
	actualizarCategoria,
	eliminarCategoria,
	verificarDisponibilidad
};

