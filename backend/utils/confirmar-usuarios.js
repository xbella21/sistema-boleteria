/**
 * Script de utilidad para confirmar usuarios en Supabase Auth
 * 
 * Este script confirma automáticamente todos los usuarios que no estén confirmados
 * en Supabase Auth, lo cual es necesario para que puedan iniciar sesión.
 * 
 * Uso: node backend/utils/confirmar-usuarios.js [email]
 * Si se proporciona un email, solo confirma ese usuario.
 */

require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');

/**
 * Confirmar un usuario en Supabase Auth
 * @param {string} userId - ID del usuario en Auth
 * @param {string} email - Email del usuario (para logging)
 * @returns {Promise<boolean>} true si se confirmó exitosamente
 */
async function confirmarUsuario(userId, email) {
	try {
		const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
			email_confirm: true
		});
		
		if (error) {
			console.error(`❌ Error al confirmar usuario ${email} (${userId}):`, error.message);
			return false;
		}
		
		console.log(`✅ Usuario ${email} confirmado exitosamente`);
		return true;
	} catch (error) {
		console.error(`❌ Error al confirmar usuario ${email}:`, error.message);
		return false;
	}
}

/**
 * Confirmar todos los usuarios no confirmados
 * @param {string|null} emailFiltro - Email específico para confirmar (opcional)
 */
async function confirmarTodosLosUsuarios(emailFiltro = null) {
	try {
		console.log('🔄 Verificando usuarios no confirmados...\n');
		
		// Obtener todos los usuarios de Auth
		const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
		
		if (error) {
			throw error;
		}
		
		if (!users || users.length === 0) {
			console.log('⚠️ No se encontraron usuarios en Supabase Auth');
			return;
		}
		
		console.log(`📋 Se encontraron ${users.length} usuario(s) en Supabase Auth\n`);
		
		// Filtrar usuarios no confirmados
		let usuariosNoConfirmados = users.filter(u => !u.email_confirmed_at);
		
		// Filtrar por email si se proporciona
		if (emailFiltro) {
			usuariosNoConfirmados = usuariosNoConfirmados.filter(u => u.email === emailFiltro);
			if (usuariosNoConfirmados.length === 0) {
				const usuario = users.find(u => u.email === emailFiltro);
				if (usuario) {
					if (usuario.email_confirmed_at) {
						console.log(`✅ El usuario ${emailFiltro} ya está confirmado`);
					} else {
						console.log(`⚠️ El usuario ${emailFiltro} no está confirmado pero no se encontró en la lista`);
					}
				} else {
					console.log(`⚠️ No se encontró ningún usuario con el email: ${emailFiltro}`);
				}
				return;
			}
		}
		
		if (usuariosNoConfirmados.length === 0) {
			console.log('✅ Todos los usuarios ya están confirmados');
			return;
		}
		
		console.log(`📝 Se encontraron ${usuariosNoConfirmados.length} usuario(s) no confirmado(s)\n`);
		
		// Confirmar cada usuario
		let confirmados = 0;
		let errores = 0;
		
		for (const usuario of usuariosNoConfirmados) {
			const confirmado = await confirmarUsuario(usuario.id, usuario.email);
			if (confirmado) {
				confirmados++;
			} else {
				errores++;
			}
		}
		
		// Resumen
		console.log('\n' + '='.repeat(50));
		console.log('📊 RESUMEN DE CONFIRMACIÓN');
		console.log('='.repeat(50));
		console.log(`✅ Usuarios confirmados: ${confirmados}`);
		console.log(`❌ Errores: ${errores}`);
		console.log('='.repeat(50));
		
	} catch (error) {
		console.error('❌ Error fatal durante la confirmación:', error);
		process.exit(1);
	}
}

// Ejecutar el script si se llama directamente
if (require.main === module) {
	const emailFiltro = process.argv[2] || null;
	
	if (emailFiltro) {
		console.log(`🎯 Confirmando usuario específico: ${emailFiltro}\n`);
	} else {
		console.log('🔄 Confirmando todos los usuarios no confirmados...\n');
	}
	
	confirmarTodosLosUsuarios(emailFiltro)
		.then(() => {
			console.log('\n✅ Proceso completado');
			process.exit(0);
		})
		.catch((error) => {
			console.error('\n❌ Error durante la confirmación:', error);
			process.exit(1);
		});
}

module.exports = {
	confirmarTodosLosUsuarios,
	confirmarUsuario
};




