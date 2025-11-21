/**
 * Rutas de boletos
 */

const express = require('express');
const router = express.Router();
const controladorBoletos = require('../controladores/controlador-boletos');
const { autenticacion } = require('../middlewares/autenticacion');
const { esPropietarioEventoOAdmin } = require('../middlewares/autorizacion');
const { asyncHandler } = require('../middlewares/manejo-errores');
const { validacionesBoleto, validacionUUID } = require('../middlewares/validacion');

/**
 * GET /api/boletos/mis-boletos
 * Obtener boletos del usuario autenticado
 */
router.get('/mis-boletos', autenticacion, asyncHandler(controladorBoletos.obtenerMisBoletos));

/**
 * GET /api/boletos/evento/:eventoId
 * Obtener boletos de un evento
 */
router.get('/evento/:eventoId', autenticacion, esPropietarioEventoOAdmin, asyncHandler(controladorBoletos.obtenerBoletosPorEvento));

/**
 * GET /api/boletos/evento/:eventoId/estadisticas
 * Obtener estadísticas de boletos de un evento
 */
router.get('/evento/:eventoId/estadisticas', autenticacion, esPropietarioEventoOAdmin, asyncHandler(controladorBoletos.obtenerEstadisticasBoletos));

/**
 * GET /api/boletos/:id
 * Obtener un boleto por ID
 */
router.get('/:id', autenticacion, validacionUUID, asyncHandler(controladorBoletos.obtenerBoletoPorId));

/**
 * POST /api/boletos/comprar
 * Comprar boletos
 */
router.post('/comprar', autenticacion, validacionesBoleto.crear, asyncHandler(controladorBoletos.comprarBoletos));

/**
 * GET /api/boletos/:id/descargar
 * Descargar boleto en PDF
 */
router.get('/:id/descargar', autenticacion, validacionUUID, asyncHandler(controladorBoletos.descargarBoletoPDF));

/**
 * PATCH /api/boletos/:id/cancelar
 * Cancelar un boleto
 */
router.patch('/:id/cancelar', autenticacion, validacionUUID, asyncHandler(controladorBoletos.cancelarBoleto));

module.exports = router;

