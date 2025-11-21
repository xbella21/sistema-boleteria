/**
 * Rutas de categorías de entradas
 */

const express = require('express');
const router = express.Router();
const controladorCategorias = require('../controladores/controlador-categorias');
const { autenticacion, autenticacionOpcional } = require('../middlewares/autenticacion');
const { esPropietarioEventoOAdmin } = require('../middlewares/autorizacion');
const { asyncHandler } = require('../middlewares/manejo-errores');
const { validacionesCategoria, validacionUUID } = require('../middlewares/validacion');

/**
 * GET /api/categorias/evento/:eventoId
 * Obtener categorías de un evento
 */
router.get('/evento/:eventoId', asyncHandler(controladorCategorias.obtenerCategoriasPorEvento));

/**
 * GET /api/categorias/evento/:eventoId/disponibles
 * Obtener categorías disponibles de un evento
 */
router.get('/evento/:eventoId/disponibles', asyncHandler(controladorCategorias.obtenerCategoriasDisponibles));

/**
 * GET /api/categorias/:id
 * Obtener una categoría por ID
 */
router.get('/:id', validacionUUID, asyncHandler(controladorCategorias.obtenerCategoriaPorId));

/**
 * GET /api/categorias/:id/disponibilidad
 * Verificar disponibilidad de una categoría
 */
router.get('/:id/disponibilidad', validacionUUID, asyncHandler(controladorCategorias.verificarDisponibilidad));

/**
 * POST /api/categorias
 * Crear una nueva categoría
 */
router.post('/', autenticacion, validacionesCategoria.crear, asyncHandler(controladorCategorias.crearCategoria));

/**
 * PUT /api/categorias/:id
 * Actualizar una categoría
 */
router.put('/:id', autenticacion, validacionesCategoria.actualizar, asyncHandler(controladorCategorias.actualizarCategoria));

/**
 * DELETE /api/categorias/:id
 * Eliminar una categoría
 */
router.delete('/:id', autenticacion, validacionUUID, asyncHandler(controladorCategorias.eliminarCategoria));

module.exports = router;

