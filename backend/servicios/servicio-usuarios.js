/**
 * Servicio para gestionar usuarios
 * Interactúa con la tabla 'usuarios' de Supabase
 */

const { supabase, supabaseAdmin } = require('../config/supabase');
const { CODIGOS_ERROR, MENSAJES_ERROR } = require('../config/constantes');

/**
 * Obtener todos los usuarios con paginación
 * @param {number} pagina - Número de página
 * @param {number} limite - Límite de resultados
 * @returns {Promise<Object>} - { usuarios, total, pagina, limite }
 */
async function obtenerUsuarios(pagina = 1, limite = 20) {
	try {
		const inicio = (pagina - 1) * limite;
		const fin = inicio + limite - 1;

		// Usar supabaseAdmin para obtener todos los usuarios (bypasea RLS)
		const clienteAdmin = supabaseAdmin || supabase;

		// Obtener total de usuarios
		const { count, error: errorCount } = await clienteAdmin
			.from('usuarios')
			.select('*', { count: 'exact', head: true });

		if (errorCount) throw errorCount;

		// Obtener usuarios paginados
		const { data, error } = await clienteAdmin
			.from('usuarios')
			.select('*')
			.order('fecha_creacion', { ascending: false })
			.range(inicio, fin);

		if (error) throw error;

		return {
			usuarios: data,
			total: count,
			pagina,
			limite
		};
	} catch (error) {
		console.error('Error al obtener usuarios:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Obtener un usuario por ID
 * @param {string} id - ID del usuario
 * @returns {Promise<Object>} - Datos del usuario
 */
async function obtenerUsuarioPorId(id, usarAdmin = false) {
	try {
		const cliente = (usarAdmin && supabaseAdmin) ? supabaseAdmin : supabase;

		const { data, error } = await cliente
			.from('usuarios')
			.select('*')
			.eq('id', id)
			.single();

		if (error) throw error;
		if (!data) throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.RECURSO_NO_ENCONTRADO]);

		return data;
	} catch (error) {
		console.error('Error al obtener usuario:', error);
		throw error;
	}
}

/**
 * Obtener usuario por auth_id (ID de autenticación de Supabase)
 * @param {string} authId - ID de autenticación
 * @param {boolean} usarAdmin - Si debe usar supabaseAdmin (bypasea RLS)
 * @returns {Promise<Object>} - Datos del usuario
 */
async function obtenerUsuarioPorAuthId(authId, usarAdmin = false) {
	try {
		// Usar supabaseAdmin si se solicita (útil para login y operaciones del sistema)
		const cliente = (usarAdmin && supabaseAdmin) ? supabaseAdmin : supabase;
		
		const { data, error } = await cliente
			.from('usuarios')
			.select('*')
			.eq('auth_id', authId)
			.single();

		// Si no se encuentra y no es error de "no encontrado", lanzar error
		if (error && error.code !== 'PGRST116') throw error;
		
		// Si no hay datos, lanzar error de recurso no encontrado
		if (!data) {
			throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.RECURSO_NO_ENCONTRADO]);
		}

		return data;
	} catch (error) {
		console.error('Error al obtener usuario por auth_id:', error);
		throw error;
	}
}

/**
 * Obtener usuario por email
 * @param {string} email - Email del usuario
 * @param {boolean} usarAdmin - Si debe usar supabaseAdmin (bypasea RLS)
 * @returns {Promise<Object>} - Datos del usuario
 */
async function obtenerUsuarioPorEmail(email, usarAdmin = false) {
	try {
		// Usar supabaseAdmin si se solicita (útil para registro y operaciones del sistema)
		const cliente = (usarAdmin && supabaseAdmin) ? supabaseAdmin : supabase;
		
		const { data, error } = await cliente
			.from('usuarios')
			.select('*')
			.eq('email', email)
			.single();

		if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no encontrado
		return data;
	} catch (error) {
		console.error('Error al obtener usuario por email:', error);
		throw error;
	}
}

/**
 * Crear un nuevo usuario
 * @param {Object} datosUsuario - Datos del usuario
 * @returns {Promise<Object>} - Usuario creado
 */
async function crearUsuario(datosUsuario) {
	try {
		// Usar supabaseAdmin para crear usuarios (bypasea RLS)
		// Esto es necesario durante el registro porque el usuario aún no está completamente autenticado
		if (!supabaseAdmin) {
			console.error(' SUPABASE_SERVICE_KEY no configurada. El registro puede fallar por RLS.');
		}
		
		const clienteAdmin = supabaseAdmin || supabase;
		
		const { data, error } = await clienteAdmin
			.from('usuarios')
			.insert(datosUsuario)
			.select()
			.single();

		if (error) {
			console.error('Error detallado al crear usuario:', error);
			// Si es un error de RLS y no tenemos admin, dar un mensaje más claro
			if (error.code === '42501' && !supabaseAdmin) {
				throw new Error('Error de permisos. Verifica que SUPABASE_SERVICE_KEY esté configurada en .env');
			}
			throw error;
		}
		return data;
	} catch (error) {
		console.error('Error al crear usuario:', error);
		// Si el error ya tiene un mensaje específico, mantenerlo
		if (error.message && error.message !== MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]) {
			throw error;
		}
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Actualizar un usuario
 * @param {string} id - ID del usuario
 * @param {Object} datosActualizados - Datos a actualizar
 * @param {boolean} esOperacionAdmin - Si es operación administrativa (usa admin client)
 * @returns {Promise<Object>} - Usuario actualizado
 */
async function actualizarUsuario(id, datosActualizados, esOperacionAdmin = false) {
	try {
		const cliente = (esOperacionAdmin && supabaseAdmin) ? supabaseAdmin : supabase;

		const { error } = await cliente
			.from('usuarios')
			.update(datosActualizados)
			.eq('id', id);

		if (error) throw error;
		return true;
	} catch (error) {
		console.error('Error al actualizar usuario:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Eliminar un usuario
 * @param {string} id - ID del usuario
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
async function eliminarUsuario(id) {
	try {
		// Usar supabaseAdmin para eliminaciones (solo admins pueden eliminar)
		const clienteAdmin = supabaseAdmin || supabase;

		const { error } = await clienteAdmin
			.from('usuarios')
			.delete()
			.eq('id', id);

		if (error) throw error;
		return true;
	} catch (error) {
		console.error('Error al eliminar usuario:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Obtener usuarios por rol
 * @param {string} rol - Rol a filtrar
 * @returns {Promise<Array>} - Lista de usuarios
 */
async function obtenerUsuariosPorRol(rol) {
	try {
		// Usar supabaseAdmin para obtener usuarios por rol (bypasea RLS)
		const clienteAdmin = supabaseAdmin || supabase;

		const { data, error } = await clienteAdmin
			.from('usuarios')
			.select('*')
			.eq('rol', rol)
			.eq('activo', true)
			.order('fecha_creacion', { ascending: false });

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error al obtener usuarios por rol:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Obtener total de usuarios
 * @returns {Promise<number>} - Total de usuarios
 */
async function obtenerTotalUsuarios() {
	try {
		const clienteAdmin = supabaseAdmin || supabase;
		console.log('obtenerTotalUsuarios - clienteAdmin:', clienteAdmin ? 'existe' : 'no existe');
		
		const { count, error, data } = await clienteAdmin
			.from('usuarios')
			.select('*', { count: 'exact', head: true });

		console.log('obtenerTotalUsuarios - count:', count);
		console.log('obtenerTotalUsuarios - error:', error);
		console.log('obtenerTotalUsuarios - data:', data);

		if (error) {
			console.error('Error en consulta obtenerTotalUsuarios:', error);
			throw error;
		}
		
		const total = count !== null && count !== undefined ? count : 0;
		console.log('obtenerTotalUsuarios - total final:', total);
		return total;
	} catch (error) {
		console.error('Error al obtener total de usuarios:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

/**
 * Cambiar estado activo/inactivo de un usuario
 * @param {string} id - ID del usuario
 * @param {boolean} activo - Estado activo
 * @returns {Promise<Object>} - Usuario actualizado
 */
async function cambiarEstadoUsuario(id, activo) {
	try {
		// Usar supabaseAdmin para cambios de estado (solo admins)
		const clienteAdmin = supabaseAdmin || supabase;

		const { data, error } = await clienteAdmin
			.from('usuarios')
			.update({ activo })
			.eq('id', id)
			.select()
			.single();

		if (error) throw error;
		return data;
	} catch (error) {
		console.error('Error al cambiar estado del usuario:', error);
		throw new Error(MENSAJES_ERROR[CODIGOS_ERROR.ERROR_BASE_DATOS]);
	}
}

module.exports = {
	obtenerUsuarios,
	obtenerUsuarioPorId,
	obtenerUsuarioPorAuthId,
	obtenerUsuarioPorEmail,
	crearUsuario,
	actualizarUsuario,
	eliminarUsuario,
	obtenerUsuariosPorRol,
	cambiarEstadoUsuario,
	obtenerTotalUsuarios
};

