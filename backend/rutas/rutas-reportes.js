/**
 * Rutas de reportes
 */

const express = require('express');
const router = express.Router();
const controladorReportes = require('../controladores/controlador-reportes');
const { autenticacion } = require('../middlewares/autenticacion');
const { esAdministrador, esPropietarioEventoOAdmin } = require('../middlewares/autorizacion');
const { asyncHandler } = require('../middlewares/manejo-errores');
const { validacionUUID, validacionUUIDParam } = require('../middlewares/validacion');

/**
 * GET /api/reportes/dashboard
 * Obtener dashboard con métricas generales
 */
router.get('/dashboard', autenticacion, esAdministrador, asyncHandler(controladorReportes.obtenerDashboard));

/**
 * GET /api/reportes/ventas/:eventoId/pdf
 * Generar reporte de ventas en PDF
 */
router.get('/ventas/:eventoId/pdf', autenticacion, esPropietarioEventoOAdmin, validacionUUIDParam('eventoId'), asyncHandler(controladorReportes.generarReporteVentasPDFController));

/**
 * GET /api/reportes/ventas/:eventoId/excel
 * Generar reporte de ventas en Excel
 */
router.get('/ventas/:eventoId/excel', autenticacion, esPropietarioEventoOAdmin, validacionUUIDParam('eventoId'), asyncHandler(controladorReportes.generarReporteVentasExcelController));

/**
 * GET /api/reportes/asistentes/:eventoId/excel
 * Generar reporte de asistentes en Excel
 */
router.get('/asistentes/:eventoId/excel', autenticacion, esPropietarioEventoOAdmin, validacionUUIDParam('eventoId'), asyncHandler(controladorReportes.generarReporteAsistentesExcelController));

/**
 * GET /api/reportes/general/pdf
 * Reporte general para administradores
 */
router.get('/general/pdf', autenticacion, esAdministrador, asyncHandler(controladorReportes.generarReporteGeneralPDFController));

module.exports = router;

