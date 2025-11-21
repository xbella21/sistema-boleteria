/**
 * Rutas de eventos
 */

const express = require('express');
const router = express.Router();
const controladorEventos = require('../controladores/controlador-eventos');
const { autenticacion, autenticacionOpcional } = require('../middlewares/autenticacion');
const { esOrganizadorOAdmin, esPropietarioEventoOAdmin } = require('../middlewares/autorizacion');
const { asyncHandler } = require('../middlewares/manejo-errores');
const { validacionesEvento, validacionUUID, validacionesPaginacion } = require('../middlewares/validacion');

/**
 * GET /api/eventos
 * Obtener todos los eventos (con filtros)
 */
router.get('/', autenticacionOpcional, validacionesPaginacion, asyncHandler(controladorEventos.obtenerEventos));

/**
 * GET /api/eventos/activos
 * Obtener eventos activos (público)
 */
router.get('/activos', validacionesPaginacion, asyncHandler(controladorEventos.obtenerEventosActivos));

/**
 * GET /api/eventos/proximos
 * Obtener eventos próximos
 */
router.get('/proximos', asyncHandler(controladorEventos.obtenerEventosProximos));

/**
 * GET /api/eventos/buscar
 * Buscar eventos
 */
router.get('/buscar', validacionesEvento.buscar, asyncHandler(controladorEventos.buscarEventos));

/**
 * GET /api/eventos/:id
 * Obtener un evento por ID
 */
router.get('/:id', validacionUUID, asyncHandler(controladorEventos.obtenerEventoPorId));

/**
 * POST /api/eventos
 * Crear un nuevo evento
 */
router.post('/', autenticacion, esOrganizadorOAdmin, validacionesEvento.crear, asyncHandler(controladorEventos.crearEvento));

/**
 * PUT /api/eventos/:id
 * Actualizar un evento
 */
router.put('/:id', autenticacion, esPropietarioEventoOAdmin, validacionesEvento.actualizar, asyncHandler(controladorEventos.actualizarEvento));

/**
 * DELETE /api/eventos/:id
 * Eliminar un evento
 */
router.delete('/:id', autenticacion, esPropietarioEventoOAdmin, validacionUUID, asyncHandler(controladorEventos.eliminarEvento));

/**
 * PATCH /api/eventos/:id/estado
 * Cambiar estado de un evento
 */
router.patch('/:id/estado', autenticacion, esPropietarioEventoOAdmin, validacionUUID, asyncHandler(controladorEventos.cambiarEstadoEvento));

/**
 * GET /api/eventos/:id/estadisticas
 * Obtener estadísticas de un evento
 */
router.get('/:id/estadisticas', autenticacion, esPropietarioEventoOAdmin, validacionUUID, asyncHandler(controladorEventos.obtenerEstadisticas));

module.exports = router;

