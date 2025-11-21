/**
 * Servidor principal del backend
 * Sistema de Gestión de Eventos
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { verificarConexion } = require('./config/supabase');
const { CORS_CONFIG, RATE_LIMIT } = require('./config/constantes');
const { manejarRutaNoEncontrada, manejarErrores } = require('./middlewares/manejo-errores');
const rutas = require('./rutas/index');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES GLOBALES
// ============================================

// Seguridad HTTP headers
app.use(helmet());

// CORS
app.use(cors(CORS_CONFIG));

// Parser de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger de requests (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
	app.use(morgan('dev'));
} else {
	app.use(morgan('combined'));
}

// Rate limiting (limitar número de requests)
const limiter = rateLimit({
	windowMs: RATE_LIMIT.VENTANA_MS,
	max: RATE_LIMIT.MAX_REQUESTS,
	message: {
		error: true,
		mensaje: 'Demasiadas solicitudes desde esta IP, intente nuevamente más tarde'
	},
	standardHeaders: true,
	legacyHeaders: false
});

app.use('/api', limiter);

// ============================================
// RUTAS
// ============================================

// Ruta de bienvenida
app.get('/', (req, res) => {
	res.json({
		nombre: 'Sistema de Gestión de Eventos - API',
		version: '1.0.0',
		descripcion: 'API RESTful para gestión de eventos y venta de boletos',
		documentacion: '/api/health',
		estado: 'operativo'
	});
});

// Montar rutas del API
app.use('/api', rutas);

// ============================================
// MANEJO DE ERRORES
// ============================================

// Ruta no encontrada (404)
app.use(manejarRutaNoEncontrada);

// Manejador global de errores
app.use(manejarErrores);

// ============================================
// INICIAR SERVIDOR
// ============================================

async function iniciarServidor() {
	try {
		// Verificar conexión con Supabase
		console.log('🔄 Verificando conexión con Supabase...');
		const conexionOk = await verificarConexion();

		if (!conexionOk) {
			console.error('❌ No se pudo conectar con Supabase');
			console.error('Verifica las variables de entorno SUPABASE_URL y SUPABASE_KEY');
			process.exit(1);
		}

		// Iniciar servidor HTTP
		app.listen(PORT, () => {
			console.log('');
			console.log('╔════════════════════════════════════════════╗');
			console.log('║  Sistema de Gestión de Eventos - Backend  ║');
			console.log('╚════════════════════════════════════════════╝');
			console.log('');
			console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
			console.log(`🌐 URL: http://localhost:${PORT}`);
			console.log(`📚 API: http://localhost:${PORT}/api`);
			console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
			console.log('');
			console.log(`⚙️  Entorno: ${process.env.NODE_ENV || 'development'}`);
			console.log('');
			console.log('✅ Servidor listo para recibir peticiones');
			console.log('');
		});

	} catch (error) {
		console.error('❌ Error al iniciar el servidor:', error);
		process.exit(1);
	}
}

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
	console.error('❌ Promesa rechazada no manejada:', error);
	process.exit(1);
});

process.on('uncaughtException', (error) => {
	console.error('❌ Excepción no capturada:', error);
	process.exit(1);
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
	console.log('⚠️  Señal SIGTERM recibida. Cerrando servidor...');
	process.exit(0);
});

process.on('SIGINT', () => {
	console.log('⚠️  Señal SIGINT recibida. Cerrando servidor...');
	process.exit(0);
});

// Iniciar el servidor
iniciarServidor();

module.exports = app;

