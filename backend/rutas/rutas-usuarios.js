/**
 * Rutas de usuarios
 */

const express = require('express');
const router = express.Router();
const controladorUsuarios = require('../controladores/controlador-usuarios');
const { autenticacion } = require('../middlewares/autenticacion');
const { esAdministrador } = require('../middlewares/autorizacion');
const { asyncHandler } = require('../middlewares/manejo-errores');
const { validacionesUsuario, validacionUUID, validacionesPaginacion } = require('../middlewares/validacion');

/**
 * GET /api/usuarios
 * Obtener todos los usuarios
 */
router.get('/', autenticacion, esAdministrador, validacionesPaginacion, asyncHandler(controladorUsuarios.obtenerUsuarios));

/**
 * GET /api/usuarios/rol/:rol
 * Obtener usuarios por rol
 */
router.get('/rol/:rol', autenticacion, esAdministrador, asyncHandler(controladorUsuarios.obtenerUsuariosPorRol));

/**
 * GET /api/usuarios/:id
 * Obtener un usuario por ID
 */
router.get('/:id', autenticacion, esAdministrador, validacionUUID, asyncHandler(controladorUsuarios.obtenerUsuarioPorId));

/**
 * POST /api/usuarios
 * Crear un nuevo usuario
 */
router.post('/', autenticacion, esAdministrador, validacionesUsuario.crear, asyncHandler(controladorUsuarios.crearUsuario));

/**
 * PUT /api/usuarios/:id
 * Actualizar un usuario
 */
router.put('/:id', autenticacion, esAdministrador, validacionesUsuario.actualizar, asyncHandler(controladorUsuarios.actualizarUsuario));

/**
 * DELETE /api/usuarios/:id
 * Eliminar un usuario
 */
router.delete('/:id', autenticacion, esAdministrador, validacionUUID, asyncHandler(controladorUsuarios.eliminarUsuario));

/**
 * PATCH /api/usuarios/:id/estado
 * Cambiar estado de un usuario
 */
router.patch('/:id/estado', autenticacion, esAdministrador, validacionUUID, asyncHandler(controladorUsuarios.cambiarEstadoUsuario));

module.exports = router;

