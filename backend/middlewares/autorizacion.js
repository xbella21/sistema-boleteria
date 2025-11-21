/**
 * Middleware de autorización
 * Verifica que el usuario tenga los permisos necesarios
 */

const { CODIGOS_ERROR, MENSAJES_ERROR, ROLES } = require('../config/constantes');
const servicioEventos = require('../servicios/servicio-eventos');

/**
 * Middleware para verificar roles
 * @param {Array<string>} rolesPermitidos - Array de roles permitidos
 * @returns {Function} - Middleware function
 */
function autorizacion(rolesPermitidos) {
	return (req, res, next) => {
		try {
			const usuario = req.usuario;

			if (!usuario) {
				return res.status(401).json({
					error: true,
					codigo: CODIGOS_ERROR.NO_AUTENTICADO,
					mensaje: MENSAJES_ERROR[CODIGOS_ERROR.NO_AUTENTICADO]
				});
			}

			// Verificar si el rol del usuario está en los roles permitidos
			if (!rolesPermitidos.includes(usuario.rol)) {
				return res.status(403).json({
					error: true,
					codigo: CODIGOS_ERROR.NO_AUTORIZADO,
					mensaje: MENSAJES_ERROR[CODIGOS_ERROR.NO_AUTORIZADO]
				});
			}

			next();

		} catch (error) {
			console.error('Error en middleware de autorización:', error);
			return res.status(500).json({
				error: true,
				codigo: CODIGOS_ERROR.ERROR_INTERNO,
				mensaje: MENSAJES_ERROR[CODIGOS_ERROR.ERROR_INTERNO]
			});
		}
	};
}

/**
 * Middleware para verificar si el usuario es administrador
 */
function esAdministrador(req, res, next) {
	return autorizacion([ROLES.ADMINISTRADOR])(req, res, next);
}

/**
 * Middleware para verificar si el usuario es organizador o administrador
 */
function esOrganizadorOAdmin(req, res, next) {
	return autorizacion([ROLES.ADMINISTRADOR, ROLES.ORGANIZADOR])(req, res, next);
}

/**
 * Middleware para verificar si el usuario es taquilla o administrador
 */
function esTaquillaOAdmin(req, res, next) {
	return autorizacion([ROLES.ADMINISTRADOR, ROLES.TAQUILLA])(req, res, next);
}

/**
 * Middleware para verificar si el usuario es el propietario del evento o admin
 * Se debe usar después de obtener el evento en el controlador
 */
async function esPropietarioEventoOAdmin(req, res, next) {
	try {
		const usuario = req.usuario;
		const eventoId = req.params.id || req.params.eventoId || req.body.evento_id;

		if (!eventoId) {
			return res.status(400).json({
				error: true,
				codigo: CODIGOS_ERROR.VALIDACION_FALLIDA,
				mensaje: 'ID de evento no proporcionado'
			});
		}

		// Si es admin, permitir acceso
		if (usuario.rol === ROLES.ADMINISTRADOR) {
			return next();
		}

		// Verificar si es el organizador del evento
		const evento = await servicioEventos.obtenerEventoPorId(eventoId);
		
		if (evento.organizador_id !== usuario.id) {
			return res.status(403).json({
				error: true,
				codigo: CODIGOS_ERROR.NO_AUTORIZADO,
				mensaje: 'No tiene permisos para gestionar este evento'
			});
		}

		// Guardar evento en request para evitar consulta duplicada
		req.evento = evento;
		next();

	} catch (error) {
		console.error('Error al verificar propietario del evento:', error);
		return res.status(500).json({
			error: true,
			codigo: CODIGOS_ERROR.ERROR_INTERNO,
			mensaje: MENSAJES_ERROR[CODIGOS_ERROR.ERROR_INTERNO]
		});
	}
}

/**
 * Middleware para verificar si el usuario es propietario del recurso
 * Compara el usuario_id del recurso con el id del usuario autenticado
 */
function esPropietarioRecurso(campoUsuarioId = 'usuario_id') {
	return (req, res, next) => {
		try {
			const usuario = req.usuario;
			const usuarioIdRecurso = req.params[campoUsuarioId] || req.body[campoUsuarioId];

			// Si es admin, permitir acceso
			if (usuario.rol === ROLES.ADMINISTRADOR) {
				return next();
			}

			// Verificar si es el propietario del recurso
			if (usuarioIdRecurso !== usuario.id) {
				return res.status(403).json({
					error: true,
					codigo: CODIGOS_ERROR.NO_AUTORIZADO,
					mensaje: 'No tiene permisos para acceder a este recurso'
				});
			}

			next();

		} catch (error) {
			console.error('Error al verificar propietario del recurso:', error);
			return res.status(500).json({
				error: true,
				codigo: CODIGOS_ERROR.ERROR_INTERNO,
				mensaje: MENSAJES_ERROR[CODIGOS_ERROR.ERROR_INTERNO]
			});
		}
	};
}

module.exports = {
	autorizacion,
	esAdministrador,
	esOrganizadorOAdmin,
	esTaquillaOAdmin,
	esPropietarioEventoOAdmin,
	esPropietarioRecurso
};

