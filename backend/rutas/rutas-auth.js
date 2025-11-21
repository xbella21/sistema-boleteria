/**
 * Rutas de autenticación
 */

const express = require('express');
const router = express.Router();
const controladorAuth = require('../controladores/controlador-auth');
const { autenticacion } = require('../middlewares/autenticacion');
const { asyncHandler } = require('../middlewares/manejo-errores');
const { body } = require('express-validator');
const { manejarErroresValidacion } = require('../middlewares/validacion');

/**
 * POST /api/auth/registro
 * Registrar un nuevo usuario
 */
router.post('/registro', [
	body('email').isEmail().withMessage('Email inválido'),
	body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
	body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
	body('apellido').trim().notEmpty().withMessage('El apellido es requerido'),
	manejarErroresValidacion
], asyncHandler(controladorAuth.registro));

/**
 * POST /api/auth/login
 * Iniciar sesión
 */
router.post('/login', [
	body('email').isEmail().withMessage('Email inválido'),
	body('password').notEmpty().withMessage('La contraseña es requerida'),
	manejarErroresValidacion
], asyncHandler(controladorAuth.login));

/**
 * POST /api/auth/logout
 * Cerrar sesión
 */
router.post('/logout', autenticacion, asyncHandler(controladorAuth.logout));

/**
 * GET /api/auth/me
 * Obtener usuario actual
 */
router.get('/me', autenticacion, asyncHandler(controladorAuth.obtenerUsuarioActual));

/**
 * PUT /api/auth/perfil
 * Actualizar perfil del usuario
 */
router.put('/perfil', autenticacion, asyncHandler(controladorAuth.actualizarPerfil));

/**
 * POST /api/auth/recuperar-password
 * Recuperar contraseña
 */
router.post('/recuperar-password', [
	body('email').isEmail().withMessage('Email inválido'),
	manejarErroresValidacion
], asyncHandler(controladorAuth.recuperarPassword));

/**
 * POST /api/auth/cambiar-password
 * Cambiar contraseña
 */
router.post('/cambiar-password', autenticacion, [
	body('passwordActual').notEmpty().withMessage('La contraseña actual es requerida'),
	body('passwordNuevo').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
	manejarErroresValidacion
], asyncHandler(controladorAuth.cambiarPassword));

module.exports = router;

