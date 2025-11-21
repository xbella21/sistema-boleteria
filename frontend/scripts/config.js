/**
 * Configuración global del frontend
 */

const CONFIG = {
	API_URL: 'http://localhost:3000/api',
	STORAGE_KEYS: {
		TOKEN: 'auth_token',
		USUARIO: 'usuario_data',
		SESION: 'sesion_data'
	},
	ROLES: {
		ADMINISTRADOR: 'administrador',
		ORGANIZADOR: 'organizador',
		TAQUILLA: 'taquilla',
		ASISTENTE: 'asistente'
	}
};

// Exportar configuración (para módulos)
if (typeof module !== 'undefined' && module.exports) {
	module.exports = CONFIG;
}

