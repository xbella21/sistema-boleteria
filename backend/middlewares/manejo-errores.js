/**
 * Middleware global de manejo de errores
 * Captura y formatea todos los errores de la aplicación
 */

const { CODIGOS_ERROR, MENSAJES_ERROR } = require('../config/constantes');

/**
 * Clase base para errores personalizados de la aplicación
 */
class ErrorAplicacion extends Error {
	constructor(mensaje, codigo = CODIGOS_ERROR.ERROR_INTERNO, statusHTTP = 500) {
		super(mensaje);
		this.nombre = 'ErrorAplicacion';
		this.codigo = codigo;
		this.statusHTTP = statusHTTP;
		Error.captureStackTrace(this, this.constructor);
	}
}

/**
 * Error de autenticación
 */
class ErrorAutenticacion extends ErrorAplicacion {
	constructor(mensaje = MENSAJES_ERROR[CODIGOS_ERROR.NO_AUTENTICADO]) {
		super(mensaje, CODIGOS_ERROR.NO_AUTENTICADO, 401);
		this.nombre = 'ErrorAutenticacion';
	}
}

/**
 * Error de autorización
 */
class ErrorAutorizacion extends ErrorAplicacion {
	constructor(mensaje = MENSAJES_ERROR[CODIGOS_ERROR.NO_AUTORIZADO]) {
		super(mensaje, CODIGOS_ERROR.NO_AUTORIZADO, 403);
		this.nombre = 'ErrorAutorizacion';
	}
}

/**
 * Error de validación
 */
class ErrorValidacion extends ErrorAplicacion {
	constructor(mensaje = MENSAJES_ERROR[CODIGOS_ERROR.VALIDACION_FALLIDA], detalles = null) {
		super(mensaje, CODIGOS_ERROR.VALIDACION_FALLIDA, 400);
		this.nombre = 'ErrorValidacion';
		this.detalles = detalles;
	}
}

/**
 * Error de recurso no encontrado
 */
class ErrorNoEncontrado extends ErrorAplicacion {
	constructor(mensaje = MENSAJES_ERROR[CODIGOS_ERROR.RECURSO_NO_ENCONTRADO]) {
		super(mensaje, CODIGOS_ERROR.RECURSO_NO_ENCONTRADO, 404);
		this.nombre = 'ErrorNoEncontrado';
	}
}

/**
 * Error de base de datos
 */
class ErrorBaseDatos extends ErrorAplicacion {
	constructor(mensaje = MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]) {
		super(mensaje, CODIGOS_ERROR.ERROR_BASE_DATOS, 500);
		this.nombre = 'ErrorBaseDatos';
	}
}

/**
 * Middleware para manejar errores 404 (rutas no encontradas)
 */
function manejarRutaNoEncontrada(req, res, next) {
	return res.status(404).json({
		error: true,
		codigo: CODIGOS_ERROR.RECURSO_NO_ENCONTRADO,
		mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
	});
}

/**
 * Middleware global de manejo de errores
 * Debe ser el último middleware registrado
 */
function manejarErrores(error, req, res, next) {
	// Log del error en consola (en producción usar un logger apropiado)
	console.error('Error capturado:', {
		nombre: error.nombre || error.name,
		mensaje: error.message,
		codigo: error.codigo,
		stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
	});

	// Si ya se envió la respuesta, pasar al siguiente manejador
	if (res.headersSent) {
		return next(error);
	}

	// Determinar código de status HTTP
	const statusHTTP = error.statusHTTP || 500;

	// Construir respuesta de error
	const respuesta = {
		error: true,
		codigo: error.codigo || CODIGOS_ERROR.ERROR_INTERNO,
		mensaje: error.message || MENSAJES_ERROR[CODIGOS_ERROR.ERROR_INTERNO]
	};

	// Agregar detalles adicionales si existen
	if (error.detalles) {
		respuesta.detalles = error.detalles;
	}

	// En desarrollo, incluir stack trace
	if (process.env.NODE_ENV === 'development') {
		respuesta.stack = error.stack;
	}

	return res.status(statusHTTP).json(respuesta);
}

/**
 * Wrapper para funciones async en rutas
 * Captura errores de funciones async y los pasa al manejador de errores
 */
function asyncHandler(fn) {
	return (req, res, next) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}

module.exports = {
	ErrorAplicacion,
	ErrorAutenticacion,
	ErrorAutorizacion,
	ErrorValidacion,
	ErrorNoEncontrado,
	ErrorBaseDatos,
	manejarRutaNoEncontrada,
	manejarErrores,
	asyncHandler
};

