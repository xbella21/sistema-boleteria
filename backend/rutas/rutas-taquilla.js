/**
 * Rutas de taquilla
 */

const express = require('express');
const router = express.Router();
const controladorTaquilla = require('../controladores/controlador-taquilla');
const { autenticacion } = require('../middlewares/autenticacion');
const { esTaquillaOAdmin, esPropietarioEventoOAdmin } = require('../middlewares/autorizacion');
const { asyncHandler } = require('../middlewares/manejo-errores');
const { validacionesBoleto, validacionUUID } = require('../middlewares/validacion');

/**
 * POST /api/taquilla/validar
 * Validar código QR de boleto
 */
router.post('/validar', autenticacion, esTaquillaOAdmin, validacionesBoleto.validar, asyncHandler(controladorTaquilla.validarBoleto));

/**
 * POST /api/taquilla/registrar-ingreso
 * Registrar ingreso al evento
 */
router.post('/registrar-ingreso', autenticacion, esTaquillaOAdmin, validacionesBoleto.validar, asyncHandler(controladorTaquilla.registrarIngreso));

/**
 * GET /api/taquilla/ingresos/:eventoId
 * Obtener ingresos de un evento
 */
router.get('/ingresos/:eventoId', autenticacion, esPropietarioEventoOAdmin, validacionUUID, asyncHandler(controladorTaquilla.obtenerIngresosPorEvento));

/**
 * GET /api/taquilla/ingresos-recientes/:eventoId
 * Obtener ingresos recientes de un evento
 */
router.get('/ingresos-recientes/:eventoId', autenticacion, validacionUUID, asyncHandler(controladorTaquilla.obtenerIngresosRecientes));

/**
 * GET /api/taquilla/aforo/:eventoId
 * Obtener aforo actual de un evento
 */
router.get('/aforo/:eventoId', autenticacion, validacionUUID, asyncHandler(controladorTaquilla.obtenerAforoActual));

/**
 * GET /api/taquilla/estadisticas-ingresos/:eventoId
 * Obtener estadísticas de ingresos por categoría
 */
router.get('/estadisticas-ingresos/:eventoId', autenticacion, esPropietarioEventoOAdmin, validacionUUID, asyncHandler(controladorTaquilla.obtenerEstadisticasIngresos));

module.exports = router;

