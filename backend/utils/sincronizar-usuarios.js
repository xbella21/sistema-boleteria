/**
 * Script de utilidad para sincronizar usuarios de Supabase Auth con la tabla usuarios
 * 
 * Este script crea registros en la tabla usuarios para todos los usuarios
 * que existen en Supabase Auth pero no tienen registro en la tabla usuarios.
 * 
 * Uso: node backend/utils/sincronizar-usuarios.js [email]
 * Si se proporciona un email, solo sincroniza ese usuario.
 */

require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');
const servicioUsuarios = require('../servicios/servicio-usuarios');
const { ROLES } = require('../config/constantes');

/**
 * Obtener todos los usuarios de Supabase Auth
 * @returns {Promise<Array>} Lista de usuarios de Auth
 */
async function obtenerUsuariosAuth() {
	try {
		// Usar el admin client para listar usuarios
		const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
		
		if (error) {
			throw error;
		}
		
		return users;
	} catch (error) {
		console.error('Error al obtener usuarios de Auth:', error);
		throw error;
	}
}

/**
 * Confirmar un usuario en Supabase Auth
 * @param {string} userId - ID del usuario en Auth
 * @returns {Promise<boolean>} true si se confirmó exitosamente
 */
async function confirmarUsuarioAuth(userId) {
	try {
		const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
			email_confirm: true
		});
		
		if (error) {
			console.error(`Error al confirmar usuario ${userId}:`, error);
			return false;
		}
		
		return true;
	} catch (error) {
		console.error(`Error al confirmar usuario ${userId}:`, error);
		return false;
	}
}

/**
 * Sincronizar un usuario de Auth con la tabla usuarios
 * @param {Object} authUser - Usuario de Supabase Auth
 * @returns {Promise<Object|null>} Usuario creado o null si ya existe
 */
async function sincronizarUsuario(authUser) {
	try {
		const email = authUser.email;
		const authId = authUser.id;
		
		// Primero verificar si el usuario existe por auth_id
		let usuarioExistente = null;
		try {
			usuarioExistente = await servicioUsuarios.obtenerUsuarioPorAuthId(authId, true);
			if (usuarioExistente) {
				console.log(`✅ Usuario ${email} ya existe en la tabla usuarios (auth_id correcto)`);
				return { creado: false, actualizado: false, usuario: usuarioExistente };
			}
		} catch (error) {
			// Si el error es que no existe, continuar para verificar por email
			if (!error.message || !error.message.includes('no existe')) {
				throw error;
			}
		}
		
		// Si no existe por auth_id, verificar por email
		try {
			usuarioExistente = await servicioUsuarios.obtenerUsuarioPorEmail(email, true);
			if (usuarioExistente) {
				// El usuario existe pero con auth_id diferente o nulo, actualizarlo
				if (!usuarioExistente.auth_id || usuarioExistente.auth_id !== authId) {
					console.log(`🔄 Usuario ${email} existe pero con auth_id diferente/nulo. Actualizando...`);
					const usuarioActualizado = await servicioUsuarios.actualizarUsuario(
						usuarioExistente.id,
						{ auth_id: authId },
						true // Usar admin client
					);
					console.log(`✅ Usuario ${email} actualizado con auth_id correcto`);
					
					// Verificar si el usuario está confirmado en Auth, si no, confirmarlo
					if (!authUser.email_confirmed_at) {
						console.log(`🔄 Usuario ${email} no está confirmado. Confirmando...`);
						const confirmado = await confirmarUsuarioAuth(authId);
						if (confirmado) {
							console.log(`✅ Usuario ${email} confirmado en Supabase Auth`);
						}
					}
					
					return { creado: false, actualizado: true, usuario: usuarioActualizado };
				}
				// Si ya tiene el auth_id correcto (caso raro pero posible)
				console.log(`✅ Usuario ${email} ya existe en la tabla usuarios`);
				
				// Verificar si el usuario está confirmado en Auth, si no, confirmarlo
				if (!authUser.email_confirmed_at) {
					console.log(`🔄 Usuario ${email} no está confirmado. Confirmando...`);
					const confirmado = await confirmarUsuarioAuth(authId);
					if (confirmado) {
						console.log(`✅ Usuario ${email} confirmado en Supabase Auth`);
					}
				}
				
				return { creado: false, actualizado: false, usuario: usuarioExistente };
			}
		} catch (error) {
			// Si el error es que no existe (PGRST116), continuar para crearlo
			if (error.code !== 'PGRST116' && (!error.message || !error.message.includes('no existe'))) {
				throw error;
			}
		}
		
		// Verificar si el usuario está confirmado en Auth, si no, confirmarlo
		if (!authUser.email_confirmed_at) {
			console.log(`🔄 Usuario ${email} no está confirmado. Confirmando...`);
			const confirmado = await confirmarUsuarioAuth(authId);
			if (confirmado) {
				console.log(`✅ Usuario ${email} confirmado en Supabase Auth`);
			} else {
				console.log(`⚠️ No se pudo confirmar el usuario ${email} automáticamente`);
			}
		}
		
		// El usuario no existe, crearlo
		// Extraer nombre y apellido de los metadatos del usuario
		const metadata = authUser.user_metadata || {};
		const nombre = metadata.nombre || email.split('@')[0] || 'Usuario';
		const apellido = metadata.apellido || 'Sistema';
		
		// Determinar el rol (por defecto 'asistente', pero si el email contiene 'admin' usar 'administrador')
		let rol = ROLES.ASISTENTE;
		if (email.toLowerCase().includes('admin') || email.toLowerCase().includes('administrador')) {
			rol = ROLES.ADMINISTRADOR;
		}
		
		// Crear el usuario en la tabla usuarios
		const nuevoUsuario = await servicioUsuarios.crearUsuario({
			auth_id: authId,
			nombre,
			apellido,
			email,
			telefono: metadata.telefono || null,
			rol,
			activo: true
		});
		
		console.log(`✅ Usuario ${email} sincronizado exitosamente (rol: ${rol})`);
		return { creado: true, actualizado: false, usuario: nuevoUsuario };
		
	} catch (error) {
		// Si el error es de duplicado de email, intentar actualizar el auth_id
		if (error.code === '23505' && error.message.includes('email')) {
			try {
				console.log(`🔄 Usuario ${authUser.email} existe por email. Actualizando auth_id...`);
				const usuarioExistente = await servicioUsuarios.obtenerUsuarioPorEmail(authUser.email, true);
				if (usuarioExistente && (!usuarioExistente.auth_id || usuarioExistente.auth_id !== authUser.id)) {
					const usuarioActualizado = await servicioUsuarios.actualizarUsuario(
						usuarioExistente.id,
						{ auth_id: authUser.id },
						true
					);
					console.log(`✅ Usuario ${authUser.email} actualizado con auth_id correcto`);
					return { creado: false, actualizado: true, usuario: usuarioActualizado };
				}
			} catch (updateError) {
				console.error(`❌ Error al actualizar usuario ${authUser.email}:`, updateError.message);
				return { creado: false, actualizado: false, error: updateError.message };
			}
		}
		
		console.error(`❌ Error al sincronizar usuario ${authUser.email}:`, error.message);
		return { creado: false, actualizado: false, error: error.message };
	}
}

/**
 * Sincronizar todos los usuarios de Auth con la tabla usuarios
 * @param {string|null} emailFiltro - Email específico para sincronizar (opcional)
 */
async function sincronizarTodosLosUsuarios(emailFiltro = null) {
	try {
		console.log('🔄 Iniciando sincronización de usuarios...\n');
		
		// Obtener todos los usuarios de Auth
		const usuariosAuth = await obtenerUsuariosAuth();
		
		if (!usuariosAuth || usuariosAuth.length === 0) {
			console.log('⚠️ No se encontraron usuarios en Supabase Auth');
			return;
		}
		
		console.log(`📋 Se encontraron ${usuariosAuth.length} usuario(s) en Supabase Auth\n`);
		
		// Filtrar por email si se proporciona
		const usuariosParaSincronizar = emailFiltro
			? usuariosAuth.filter(u => u.email === emailFiltro)
			: usuariosAuth;
		
		if (emailFiltro && usuariosParaSincronizar.length === 0) {
			console.log(`⚠️ No se encontró ningún usuario con el email: ${emailFiltro}`);
			return;
		}
		
		// Sincronizar cada usuario
		let sincronizados = 0;
		let actualizados = 0;
		let yaExistentes = 0;
		let errores = 0;
		
		for (const authUser of usuariosParaSincronizar) {
			const resultado = await sincronizarUsuario(authUser);
			if (resultado.creado) {
				sincronizados++;
			} else if (resultado.actualizado) {
				actualizados++;
			} else if (resultado.usuario && !resultado.creado && !resultado.actualizado) {
				yaExistentes++;
			} else {
				errores++;
			}
		}
		
		// Resumen
		console.log('\n' + '='.repeat(50));
		console.log('📊 RESUMEN DE SINCRONIZACIÓN');
		console.log('='.repeat(50));
		console.log(`✅ Usuarios creados: ${sincronizados}`);
		console.log(`🔄 Usuarios actualizados: ${actualizados}`);
		console.log(`ℹ️  Usuarios ya existentes: ${yaExistentes}`);
		console.log(`❌ Errores: ${errores}`);
		console.log('='.repeat(50));
		
	} catch (error) {
		console.error('❌ Error fatal durante la sincronización:', error);
		process.exit(1);
	}
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
	const emailFiltro = process.argv[2] || null;
	
	if (emailFiltro) {
		console.log(`🎯 Sincronizando usuario específico: ${emailFiltro}\n`);
	} else {
		console.log('🔄 Sincronizando todos los usuarios...\n');
	}
	
	sincronizarTodosLosUsuarios(emailFiltro)
		.then(() => {
			console.log('\n✅ Sincronización completada');
			process.exit(0);
		})
		.catch((error) => {
			console.error('\n❌ Error durante la sincronización:', error);
			process.exit(1);
		});
}

module.exports = {
	sincronizarTodosLosUsuarios,
	sincronizarUsuario,
	obtenerUsuariosAuth,
	confirmarUsuarioAuth
};

