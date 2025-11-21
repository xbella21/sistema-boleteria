/**
 * Controlador de usuarios
 * Maneja CRUD de usuarios (solo administradores)
 */

const servicioUsuarios = require('../servicios/servicio-usuarios');
const { supabaseAdmin } = require('../config/supabase');
const { ErrorValidacion, ErrorNoEncontrado } = require('../middlewares/manejo-errores');
const { validarPaginacion } = require('../utils/validaciones');

/**
 * Obtener todos los usuarios
 * GET /api/usuarios
 */
async function obtenerUsuarios(req, res) {
	try {
		const { pagina, limite } = req.query;
		const paginacionValida = validarPaginacion(pagina, limite);

		const resultado = await servicioUsuarios.obtenerUsuarios(
			paginacionValida.pagina,
			paginacionValida.limite
		);

		return res.json({
			exito: true,
			datos: resultado
		});

	} catch (error) {
		console.error('Error al obtener usuarios:', error);
		throw error;
	}
}

/**
 * Obtener un usuario por ID
 * GET /api/usuarios/:id
 */
async function obtenerUsuarioPorId(req, res) {
	try {
		const { id } = req.params;
		const usuario = await servicioUsuarios.obtenerUsuarioPorId(id);

		if (!usuario) {
			throw new ErrorNoEncontrado('Usuario no encontrado');
		}

		return res.json({
			exito: true,
			datos: usuario
		});

	} catch (error) {
		console.error('Error al obtener usuario:', error);
		throw error;
	}
}

/**
 * Obtener usuarios por rol
 * GET /api/usuarios/rol/:rol
 */
async function obtenerUsuariosPorRol(req, res) {
	try {
		const { rol } = req.params;
		const usuarios = await servicioUsuarios.obtenerUsuariosPorRol(rol);

		return res.json({
			exito: true,
			datos: usuarios
		});

	} catch (error) {
		console.error('Error al obtener usuarios por rol:', error);
		throw error;
	}
}

/**
 * Crear un nuevo usuario (solo admin)
 * POST /api/usuarios
 */
async function crearUsuario(req, res) {
	try {
		const { email, password, nombre, apellido, telefono, rol } = req.body;

		// Verificar que el email no esté registrado
		// Usar admin client para bypasear RLS
		const usuarioExistente = await servicioUsuarios.obtenerUsuarioPorEmail(email, true);
		if (usuarioExistente) {
			throw new ErrorValidacion('El email ya está registrado');
		}

		// Crear usuario en Supabase Auth usando supabaseAdmin
		if (!supabaseAdmin) {
			throw new Error('Supabase Admin no configurado. Se requiere SUPABASE_SERVICE_KEY');
		}

		const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
			email,
			password,
			email_confirm: true,
			user_metadata: {
				nombre,
				apellido
			}
		});

		if (authError) {
			throw new ErrorValidacion(authError.message);
		}

		// Crear usuario en la tabla usuarios
		const nuevoUsuario = await servicioUsuarios.crearUsuario({
			auth_id: authData.user.id,
			nombre,
			apellido,
			email,
			telefono: telefono || null,
			rol,
			activo: true
		});

		return res.status(201).json({
			exito: true,
			mensaje: 'Usuario creado exitosamente',
			datos: nuevoUsuario
		});

	} catch (error) {
		console.error('Error al crear usuario:', error);
		throw error;
	}
}

/**
 * Actualizar un usuario
 * PUT /api/usuarios/:id
 */
async function actualizarUsuario(req, res) {
	try {
		const { id } = req.params;
		const datosActualizados = req.body;

		// Verificar que el usuario existe
		const usuario = await servicioUsuarios.obtenerUsuarioPorId(id);
		if (!usuario) {
			throw new ErrorNoEncontrado('Usuario no encontrado');
		}

		// Si se actualiza el email, verificar que no esté en uso
		if (datosActualizados.email && datosActualizados.email !== usuario.email) {
			// Usar admin client para bypasear RLS
			const emailEnUso = await servicioUsuarios.obtenerUsuarioPorEmail(datosActualizados.email, true);
			if (emailEnUso) {
				throw new ErrorValidacion('El email ya está en uso por otro usuario');
			}

			// Actualizar email en Supabase Auth
			if (supabaseAdmin) {
				await supabaseAdmin.auth.admin.updateUserById(usuario.auth_id, {
					email: datosActualizados.email
				});
			}
		}

		const usuarioActualizado = await servicioUsuarios.actualizarUsuario(id, datosActualizados, true);

		return res.json({
			exito: true,
			mensaje: 'Usuario actualizado exitosamente',
			datos: usuarioActualizado
		});

	} catch (error) {
		console.error('Error al actualizar usuario:', error);
		throw error;
	}
}

/**
 * Eliminar un usuario
 * DELETE /api/usuarios/:id
 */
async function eliminarUsuario(req, res) {
	try {
		const { id } = req.params;

		// Verificar que el usuario existe
		const usuario = await servicioUsuarios.obtenerUsuarioPorId(id);
		if (!usuario) {
			throw new ErrorNoEncontrado('Usuario no encontrado');
		}

		// Eliminar usuario de Supabase Auth
		if (supabaseAdmin) {
			await supabaseAdmin.auth.admin.deleteUser(usuario.auth_id);
		}

		// Eliminar usuario de la tabla (se hace automáticamente por CASCADE)
		await servicioUsuarios.eliminarUsuario(id);

		return res.json({
			exito: true,
			mensaje: 'Usuario eliminado exitosamente'
		});

	} catch (error) {
		console.error('Error al eliminar usuario:', error);
		throw error;
	}
}

/**
 * Cambiar estado de un usuario (activar/desactivar)
 * PATCH /api/usuarios/:id/estado
 */
async function cambiarEstadoUsuario(req, res) {
	try {
		const { id } = req.params;
		const { activo } = req.body;

		const usuarioActualizado = await servicioUsuarios.cambiarEstadoUsuario(id, activo);

		return res.json({
			exito: true,
			mensaje: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`,
			datos: usuarioActualizado
		});

	} catch (error) {
		console.error('Error al cambiar estado del usuario:', error);
		throw error;
	}
}

module.exports = {
	obtenerUsuarios,
	obtenerUsuarioPorId,
	obtenerUsuariosPorRol,
	crearUsuario,
	actualizarUsuario,
	eliminarUsuario,
	cambiarEstadoUsuario
};

