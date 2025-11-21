/**
 * Archivo principal de rutas
 * Agrupa todas las rutas del API
 */

const express = require('express');
const router = express.Router();

// Importar rutas
const rutasAuth = require('./rutas-auth');
const rutasUsuarios = require('./rutas-usuarios');
const rutasEventos = require('./rutas-eventos');
const rutasCategorias = require('./rutas-categorias');
const rutasBoletos = require('./rutas-boletos');
const rutasTaquilla = require('./rutas-taquilla');
const rutasReportes = require('./rutas-reportes');

// Ruta raíz del API
router.get('/', (req, res) => {
	res.json({
		exito: true,
		nombre: 'Sistema de Gestión de Eventos - API',
		version: '1.0.0',
		descripcion: 'API RESTful para gestión de eventos y venta de boletos',
		endpoints: {
			auth: '/api/auth',
			usuarios: '/api/usuarios',
			eventos: '/api/eventos',
			categorias: '/api/categorias',
			boletos: '/api/boletos',
			taquilla: '/api/taquilla',
			reportes: '/api/reportes',
			health: '/api/health'
		},
		timestamp: new Date().toISOString()
	});
});

// Registrar rutas
router.use('/auth', rutasAuth);
router.use('/usuarios', rutasUsuarios);
router.use('/eventos', rutasEventos);
router.use('/categorias', rutasCategorias);
router.use('/boletos', rutasBoletos);
router.use('/taquilla', rutasTaquilla);
router.use('/reportes', rutasReportes);

// Ruta de prueba
router.get('/health', (req, res) => {
	res.json({
		exito: true,
		mensaje: 'API funcionando correctamente',
		timestamp: new Date().toISOString()
	});
});

module.exports = router;

