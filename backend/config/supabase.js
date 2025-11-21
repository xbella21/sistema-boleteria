/**
 * Configuración de conexión a Supabase
 * Maneja la inicialización del cliente de Supabase
 */

const { createClient } = require('@supabase/supabase-js');

// Variables de entorno
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Validar que las variables de entorno estén configuradas
if (!SUPABASE_URL || !SUPABASE_KEY) {
	throw new Error('Las variables de entorno SUPABASE_URL y SUPABASE_KEY son requeridas');
}

/**
 * Cliente de Supabase para operaciones normales
 * Usa la clave anónima/pública
 */
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
	auth: {
		autoRefreshToken: true,
		persistSession: false
	}
});

/**
 * Cliente de Supabase con privilegios de servicio
 * Usa la clave de servicio para operaciones administrativas
 * PRECAUCIÓN: Solo usar en backend, nunca exponer al cliente
 */
const supabaseAdmin = SUPABASE_SERVICE_KEY
	? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	})
	: null;

/**
 * Verifica la conexión con Supabase
 * @returns {Promise<boolean>} - true si la conexión es exitosa
 */
async function verificarConexion() {
	try {
		const { error } = await supabase.from('usuarios').select('count').limit(1);
		if (error) {
			console.error('Error al verificar conexión con Supabase:', error.message);
			return false;
		}
		console.log('✅ Conexión con Supabase establecida correctamente');
		return true;
	} catch (error) {
		console.error('❌ Error al conectar con Supabase:', error.message);
		return false;
	}
}

module.exports = {
	supabase,
	supabaseAdmin,
	verificarConexion
};

