/**
 * Middleware de validación usando express-validator
 * Define reglas de validación para diferentes endpoints
 */

const { body, param, query, validationResult } = require('express-validator');
const { ROLES, ESTADOS_EVENTO, ESTADOS_BOLETO } = require('../config/constantes');

/**
 * Middleware para manejar errores de validación
 */
function manejarErroresValidacion(req, res, next) {
	const errores = validationResult(req);
	
	if (!errores.isEmpty()) {
		return res.status(400).json({
			error: true,
			codigo: 'VALIDACION_FALLIDA',
			mensaje: 'Errores de validación',
			errores: errores.array().map(err => ({
				campo: err.param,
				mensaje: err.msg
			}))
		});
	}
	
	next();
}

/**
 * Validaciones para usuarios
 */
const validacionesUsuario = {
	crear: [
		body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
		body('apellido').trim().notEmpty().withMessage('El apellido es requerido'),
		body('email').isEmail().withMessage('Email inválido'),
		body('telefono').optional().isMobilePhone('any').withMessage('Teléfono inválido'),
		body('rol').isIn(Object.values(ROLES)).withMessage('Rol inválido'),
		manejarErroresValidacion
	],
	actualizar: [
		param('id').isUUID().withMessage('ID de usuario inválido'),
		body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
		body('apellido').optional().trim().notEmpty().withMessage('El apellido no puede estar vacío'),
		body('email').optional().isEmail().withMessage('Email inválido'),
		body('telefono').optional().isMobilePhone('any').withMessage('Teléfono inválido'),
		body('rol').optional().isIn(Object.values(ROLES)).withMessage('Rol inválido'),
		manejarErroresValidacion
	]
};

/**
 * Validaciones para eventos
 */
const validacionesEvento = {
	crear: [
		body('nombre').trim().notEmpty().withMessage('El nombre del evento es requerido'),
		body('descripcion').optional().trim(),
		body('fecha_inicio').isISO8601().withMessage('Fecha de inicio inválida'),
		body('fecha_fin').isISO8601().withMessage('Fecha de fin inválida'),
		body('ubicacion').trim().notEmpty().withMessage('La ubicación es requerida'),
		body('direccion').optional().trim(),
		body('aforo_maximo').isInt({ min: 1 }).withMessage('El aforo máximo debe ser mayor a 0'),
		body('estado').optional().isIn(Object.values(ESTADOS_EVENTO)).withMessage('Estado inválido'),
		manejarErroresValidacion
	],
	actualizar: [
		param('id').isUUID().withMessage('ID de evento inválido'),
		body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
		body('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio inválida'),
		body('fecha_fin').optional().isISO8601().withMessage('Fecha de fin inválida'),
		body('ubicacion').optional().trim().notEmpty().withMessage('La ubicación no puede estar vacía'),
		body('aforo_maximo').optional().isInt({ min: 1 }).withMessage('El aforo máximo debe ser mayor a 0'),
		body('estado').optional().isIn(Object.values(ESTADOS_EVENTO)).withMessage('Estado inválido'),
		manejarErroresValidacion
	],
	buscar: [
		query('termino').optional().trim().isLength({ min: 1 }).withMessage('Término de búsqueda inválido'),
		manejarErroresValidacion
	]
};

/**
 * Validaciones para categorías de entradas
 */
const validacionesCategoria = {
	crear: [
		body('evento_id').isUUID().withMessage('ID de evento inválido'),
		body('nombre').trim().notEmpty().withMessage('El nombre de la categoría es requerido'),
		body('descripcion').optional().trim(),
		body('precio').isFloat({ min: 0 }).withMessage('El precio debe ser mayor o igual a 0'),
		body('cantidad_disponible').isInt({ min: 0 }).withMessage('La cantidad debe ser mayor o igual a 0'),
		manejarErroresValidacion
	],
	actualizar: [
		param('id').isUUID().withMessage('ID de categoría inválido'),
		body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
		body('precio').optional().isFloat({ min: 0 }).withMessage('El precio debe ser mayor o igual a 0'),
		body('cantidad_disponible').optional().isInt({ min: 0 }).withMessage('La cantidad debe ser mayor o igual a 0'),
		manejarErroresValidacion
	]
};

/**
 * Validaciones para boletos
 */
const validacionesBoleto = {
	crear: [
		body('evento_id').isUUID().withMessage('ID de evento inválido'),
		body('categoria_id').isUUID().withMessage('ID de categoría inválido'),
		body('cantidad').isInt({ min: 1, max: 10 }).withMessage('La cantidad debe estar entre 1 y 10'),
		manejarErroresValidacion
	],
	validar: [
		body('codigo_qr').trim().notEmpty().withMessage('El código QR es requerido'),
		manejarErroresValidacion
	]
};

/**
 * Validaciones para paginación
 */
const validacionesPaginacion = [
	query('pagina').optional().isInt({ min: 1 }).withMessage('Página inválida'),
	query('limite').optional().isInt({ min: 1, max: 100 }).withMessage('Límite inválido'),
	manejarErroresValidacion
];

/**
 * Generador de validaciones UUID para un parámetro específico
 */
function validacionUUIDParam(nombre = 'id') {
	return [
		param(nombre).isUUID().withMessage('ID inválido'),
		manejarErroresValidacion
	];
}

/**
 * Validación por defecto (parametro id)
 */
const validacionUUID = validacionUUIDParam();

module.exports = {
	manejarErroresValidacion,
	validacionesUsuario,
	validacionesEvento,
	validacionesCategoria,
	validacionesBoleto,
	validacionesPaginacion,
	validacionUUID,
	validacionUUIDParam
};

