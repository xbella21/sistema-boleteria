/**
 * Constantes y configuraciones del sistema
 */

// Roles del sistema
const ROLES = {
	ADMINISTRADOR: 'administrador',
	ORGANIZADOR: 'organizador',
	TAQUILLA: 'taquilla',
	ASISTENTE: 'asistente'
};

// Estados de eventos
const ESTADOS_EVENTO = {
	ACTIVO: 'activo',
	CANCELADO: 'cancelado',
	FINALIZADO: 'finalizado',
	BORRADOR: 'borrador'
};

// Estados de boletos
const ESTADOS_BOLETO = {
	VALIDO: 'valido',
	USADO: 'usado',
	CANCELADO: 'cancelado'
};

// Códigos de error personalizados
const CODIGOS_ERROR = {
	NO_AUTENTICADO: 'NO_AUTENTICADO',
	NO_AUTORIZADO: 'NO_AUTORIZADO',
	RECURSO_NO_ENCONTRADO: 'RECURSO_NO_ENCONTRADO',
	VALIDACION_FALLIDA: 'VALIDACION_FALLIDA',
	ERROR_BASE_DATOS: 'ERROR_BASE_DATOS',
	BOLETO_INVALIDO: 'BOLETO_INVALIDO',
	BOLETO_YA_USADO: 'BOLETO_YA_USADO',
	AFORO_COMPLETO: 'AFORO_COMPLETO',
	ENTRADAS_AGOTADAS: 'ENTRADAS_AGOTADAS',
	ERROR_INTERNO: 'ERROR_INTERNO'
};

// Mensajes de error
const MENSAJES_ERROR = {
	[CODIGOS_ERROR.NO_AUTENTICADO]: 'Debe iniciar sesión para acceder a este recurso',
	[CODIGOS_ERROR.NO_AUTORIZADO]: 'No tiene permisos para realizar esta acción',
	[CODIGOS_ERROR.RECURSO_NO_ENCONTRADO]: 'El recurso solicitado no existe',
	[CODIGOS_ERROR.VALIDACION_FALLIDA]: 'Los datos proporcionados no son válidos',
	[CODIGOS_ERROR.ERROR_BASE_DATOS]: 'Error al acceder a la base de datos',
	[CODIGOS_ERROR.BOLETO_INVALIDO]: 'El código QR del boleto no es válido',
	[CODIGOS_ERROR.BOLETO_YA_USADO]: 'Este boleto ya fue utilizado',
	[CODIGOS_ERROR.AFORO_COMPLETO]: 'El evento ha alcanzado su capacidad máxima',
	[CODIGOS_ERROR.ENTRADAS_AGOTADAS]: 'No hay entradas disponibles para esta categoría',
	[CODIGOS_ERROR.ERROR_INTERNO]: 'Error interno del servidor'
};

// Configuración de paginación
const PAGINACION = {
	LIMITE_DEFAULT: 20,
	LIMITE_MAXIMO: 100
};

// Configuración de archivos
const ARCHIVOS = {
	TAMANO_MAXIMO_IMAGEN: 5 * 1024 * 1024, // 5MB
	TIPOS_IMAGEN_PERMITIDOS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
	CARPETA_EVENTOS: 'eventos-imagenes',
	CARPETA_AVATARES: 'usuarios-avatares'
};

// Configuración de QR
const QR_CONFIG = {
	ERROR_CORRECTION: 'M',
	TYPE: 'image/png',
	QUALITY: 0.92,
	MARGIN: 1,
	WIDTH: 300
};

// Configuración de PDF
const PDF_CONFIG = {
	TAMANO_PAGINA: 'A4',
	MARGENES: {
		top: 50,
		bottom: 50,
		left: 50,
		right: 50
	}
};

// Tiempo de expiración de tokens (en segundos)
const EXPIRACION_TOKEN = {
	ACCESO: 3600, // 1 hora
	REFRESH: 604800 // 7 días
};

// Configuración CORS
const CORS_CONFIG = {
	origin: (origin, callback) => {
		// Orígenes permitidos
		const allowedOrigins = [
			'http://localhost:5500',
			'http://127.0.0.1:5500'
		];
		
		// Agregar el origen configurado en variables de entorno si existe
		if (process.env.FRONTEND_URL) {
			allowedOrigins.push(process.env.FRONTEND_URL);
		}
		
		// Permitir si el origen está en la lista o si no hay origen (peticiones del mismo origen)
		if (!origin || allowedOrigins.includes(origin)) {
			callback(null, true);
		} else {
			callback(new Error('No permitido por CORS'));
		}
	},
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
	allowedHeaders: ['Content-Type', 'Authorization']
};

// Límites de rate limiting
const RATE_LIMIT = {
	VENTANA_MS: 15 * 60 * 1000, // 15 minutos
	MAX_REQUESTS: 100
};

module.exports = {
	ROLES,
	ESTADOS_EVENTO,
	ESTADOS_BOLETO,
	CODIGOS_ERROR,
	MENSAJES_ERROR,
	PAGINACION,
	ARCHIVOS,
	QR_CONFIG,
	PDF_CONFIG,
	EXPIRACION_TOKEN,
	CORS_CONFIG,
	RATE_LIMIT
};

