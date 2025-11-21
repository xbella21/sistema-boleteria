/**
 * Middleware de autenticación
 * Verifica que el usuario esté autenticado mediante token de Supabase
 */

const { supabase } = require('../config/supabase');
const { CODIGOS_ERROR, MENSAJES_ERROR } = require('../config/constantes');
const servicioUsuarios = require('../servicios/servicio-usuarios');

/**
 * Middleware para verificar autenticación
 * Extrae el token del header Authorization y valida con Supabase
 */
async function autenticacion(req, res, next) {
	try {
		// Extraer token del header Authorization
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({
				error: true,
				codigo: CODIGOS_ERROR.NO_AUTENTICADO,
				mensaje: MENSAJES_ERROR[CODIGOS_ERROR.NO_AUTENTICADO]
			});
		}

		const token = authHeader.substring(7); // Remover "Bearer "

		// Verificar token con Supabase
		const { data: { user }, error } = await supabase.auth.getUser(token);

		if (error || !user) {
			return res.status(401).json({
				error: true,
				codigo: CODIGOS_ERROR.NO_AUTENTICADO,
				mensaje: 'Token inválido o expirado'
			});
		}

		// Obtener información completa del usuario desde la tabla usuarios
		// Usar admin client para bypasear RLS (el usuario ya está autenticado con token válido)
		try {
			const usuarioCompleto = await servicioUsuarios.obtenerUsuarioPorAuthId(user.id, true);
			
			// Verificar que el usuario esté activo
			if (!usuarioCompleto.activo) {
				return res.status(403).json({
					error: true,
					codigo: CODIGOS_ERROR.NO_AUTORIZADO,
					mensaje: 'Usuario inactivo'
				});
			}

			// Agregar usuario al request para uso posterior
			req.usuario = usuarioCompleto;
			req.authId = user.id;

		} catch (error) {
			// Si el usuario no existe en la tabla usuarios
			return res.status(401).json({
				error: true,
				codigo: CODIGOS_ERROR.NO_AUTENTICADO,
				mensaje: 'Usuario no encontrado en el sistema'
			});
		}

		next();

	} catch (error) {
		console.error('Error en middleware de autenticación:', error);
		return res.status(500).json({
			error: true,
			codigo: CODIGOS_ERROR.ERROR_INTERNO,
			mensaje: MENSAJES_ERROR[CODIGOS_ERROR.ERROR_INTERNO]
		});
	}
}

/**
 * Middleware opcional de autenticación
 * Si hay token, lo valida, pero no requiere autenticación
 */
async function autenticacionOpcional(req, res, next) {
	try {
		const authHeader = req.headers.authorization;

		if (authHeader && authHeader.startsWith('Bearer ')) {
			const token = authHeader.substring(7);
			const { data: { user }, error } = await supabase.auth.getUser(token);

			if (!error && user) {
				try {
					const usuarioCompleto = await servicioUsuarios.obtenerUsuarioPorAuthId(user.id, true);
					if (usuarioCompleto.activo) {
						req.usuario = usuarioCompleto;
						req.authId = user.id;
					}
				} catch (error) {
					// Ignorar error, continuar sin usuario
				}
			}
		}

		next();

	} catch (error) {
		console.error('Error en middleware de autenticación opcional:', error);
		next();
	}
}

module.exports = {
	autenticacion,
	autenticacionOpcional
};

