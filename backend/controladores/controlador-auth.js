/**
 * Controlador de autenticación
 * Maneja registro, login y operaciones de autenticación
 */

const { supabase, supabaseAdmin } = require('../config/supabase');
const servicioUsuarios = require('../servicios/servicio-usuarios');
const { ErrorValidacion, ErrorAutenticacion } = require('../middlewares/manejo-errores');
const { CODIGOS_ERROR, MENSAJES_ERROR } = require('../config/constantes');

/**
 * Registrar un nuevo usuario
 * POST /api/auth/registro
 */
async function registro(req, res) {
	try {
		const { email, password, nombre, apellido, telefono, rol } = req.body;

		// Validar que el email no esté ya registrado
		// Usar admin client para bypasear RLS durante el registro
		const usuarioExistente = await servicioUsuarios.obtenerUsuarioPorEmail(email, true);
		if (usuarioExistente) {
			throw new ErrorValidacion('El email ya está registrado');
		}

		// Validar y asignar rol
		// Los roles válidos según la base de datos son: 'administrador', 'organizador', 'taquilla', 'asistente'
		const rolesValidos = ['administrador', 'organizador', 'taquilla', 'asistente'];
		const rolFinal = rol && rolesValidos.includes(rol) ? rol : 'asistente';
		
		if (rol && !rolesValidos.includes(rol)) {
			throw new ErrorValidacion(`Rol no válido. Los roles válidos son: ${rolesValidos.join(', ')}`);
		}

		// Verificar que supabaseAdmin esté configurado
		if (!supabaseAdmin) {
			throw new ErrorAutenticacion('Configuración de servidor incorrecta. Contacte al administrador.');
		}

		// Crear usuario en Supabase Auth usando admin client
		// Esto asegura que el usuario se cree correctamente y esté confirmado
		const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
			email,
			password,
			email_confirm: true, // Confirmar email automáticamente
			user_metadata: {
				nombre,
				apellido
			}
		});

		if (authError) {
			console.error('Error al crear usuario en Supabase Auth:', authError);
			throw new ErrorAutenticacion(authError.message || 'Error al crear usuario');
		}

		// Verificar que el usuario se creó correctamente
		if (!authData || !authData.user || !authData.user.id) {
			throw new ErrorAutenticacion('Error al crear usuario. No se recibió información del usuario creado.');
		}

		// Crear usuario en la tabla usuarios
		const nuevoUsuario = await servicioUsuarios.crearUsuario({
			auth_id: authData.user.id,
			nombre,
			apellido,
			email,
			telefono: telefono || null,
			rol: rolFinal, 
			activo: true
		});

		// Crear sesión iniciando sesión con las credenciales del usuario
		// Esto es necesario porque createUser() no devuelve una sesión automáticamente
		let sesion = null;
		try {
			const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (signInError) {
				console.warn('Advertencia: No se pudo iniciar sesión automáticamente después del registro:', signInError.message);
			} else if (signInData && signInData.session) {
				sesion = signInData.session;
			}
		} catch (signInError) {
			console.warn('Advertencia: Error al iniciar sesión automáticamente después del registro:', signInError.message);
		}

		return res.status(201).json({
			exito: true,
			mensaje: 'Usuario registrado exitosamente',
			datos: {
				usuario: {
					id: nuevoUsuario.id,
					nombre: nuevoUsuario.nombre,
					apellido: nuevoUsuario.apellido,
					email: nuevoUsuario.email,
					rol: nuevoUsuario.rol
				},
				sesion: sesion
			}
		});

	} catch (error) {
		console.error('Error en registro:', error);
		throw error;
	}
}

/**
 * Iniciar sesión
 * POST /api/auth/login
 */
async function login(req, res) {
	try {
		const { email, password } = req.body;

		// Autenticar con Supabase
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			// Log completo del error para diagnóstico
			console.error('Error completo de autenticación en Supabase:', {
				message: error.message,
				status: error.status,
				code: error.code,
				error: error
			});
			
			// Detectar si el error es de email no confirmado
			// Verificar tanto el mensaje como el código de error de Supabase
			const mensajeErrorLower = error.message ? error.message.toLowerCase() : '';
			const esEmailNoConfirmado = 
				mensajeErrorLower.includes('email not confirmed') ||
				mensajeErrorLower.includes('email not verified') ||
				(mensajeErrorLower.includes('email') && mensajeErrorLower.includes('not confirmed')) ||
				(mensajeErrorLower.includes('email') && mensajeErrorLower.includes('not verified')) ||
				(mensajeErrorLower.includes('email') && (mensajeErrorLower.includes('confirm') || mensajeErrorLower.includes('verified'))) ||
				error.message === 'Email not confirmed' || // Caso exacto
				error.message === 'Email not verified' ||
				(error.status === 401 && mensajeErrorLower.includes('email'));
			
			console.log('🔍 Verificando error de email no confirmado:', {
				mensaje: error.message,
				mensajeLower: mensajeErrorLower,
				status: error.status,
				code: error.code,
				esEmailNoConfirmado
			});
			
			// Si el error es de email no confirmado, intentar confirmarlo automáticamente
			if (esEmailNoConfirmado) {
				console.log(`Detectado error de email no confirmado para ${email}, intentando confirmar automáticamente...`);
				if (supabaseAdmin) {
					try {
						// Obtener el usuario por email para confirmarlo
						const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
						if (!listError && users) {
							const usuarioNoConfirmado = users.find(u => u.email === email && !u.email_confirmed_at);
							if (usuarioNoConfirmado) {
								console.log(`Usuario encontrado: ${usuarioNoConfirmado.id}, confirmando email...`);
								// Confirmar el usuario automáticamente
								const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
									usuarioNoConfirmado.id,
									{ email_confirm: true }
								);
								if (!confirmError) {
									console.log(`Email confirmado automáticamente para ${email}`);
									// Reintentar el login después de confirmar
									const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
										email,
										password
									});
									if (!retryError && retryData) {
										console.log(`Login exitoso después de confirmar email para ${email}`);
										// Si el reintento fue exitoso, continuar con el flujo normal
										const usuario = await servicioUsuarios.obtenerUsuarioPorAuthId(retryData.user.id, true);
										if (!usuario.activo) {
											throw new ErrorAutenticacion('Usuario inactivo. Contacte al administrador.');
										}
										return res.json({
											exito: true,
											mensaje: 'Inicio de sesión exitoso',
											datos: {
												usuario: {
													id: usuario.id,
													nombre: usuario.nombre,
													apellido: usuario.apellido,
													email: usuario.email,
													rol: usuario.rol
												},
												sesion: retryData.session
											}
										});
									} else {
										console.error('Error al reintentar login después de confirmar:', retryError);
									}
								} else {
									console.error('Error al confirmar email:', confirmError);
								}
							} else {
								console.log(` Usuario ${email} no encontrado o ya está confirmado`);
							}
						} else {
							console.error('Error al listar usuarios:', listError);
						}
					} catch (confirmError) {
						console.error('Error al intentar confirmar automáticamente el email:', confirmError);
					}
				} else {
					console.warn('supabaseAdmin no está disponible para confirmar email automáticamente');
				}
				// Si no se pudo confirmar automáticamente, mostrar mensaje al usuario
				throw new ErrorAutenticacion('Por favor, confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
			}
			
			// Proporcionar mensajes de error más descriptivos para otros errores
			let mensajeError = 'Credenciales inválidas';
			
			if (error.message) {
				if (error.message.includes('Invalid login credentials') || error.message.includes('invalid')) {
					mensajeError = 'Email o contraseña incorrectos. Verifica tus credenciales.';
				} else if (error.message.includes('User not found')) {
					mensajeError = 'Usuario no encontrado. Verifica tu email.';
				} else {
					// Usar el mensaje de error de Supabase si es descriptivo
					mensajeError = error.message;
				}
			}
			
			throw new ErrorAutenticacion(mensajeError);
		}

		// Obtener información completa del usuario usando admin client (bypasea RLS)
		// Esto es necesario porque el usuario aún no está autenticado en el contexto de la app
		let usuario;
		try {
			usuario = await servicioUsuarios.obtenerUsuarioPorAuthId(data.user.id, true);
		} catch (error) {
			// Si el usuario no existe en la tabla usuarios, dar un mensaje claro
			if (error.message === MENSAJES_ERROR[CODIGOS_ERROR.RECURSO_NO_ENCONTRADO]) {
				throw new ErrorAutenticacion('Usuario no encontrado en el sistema. Contacte al administrador.');
			}
			throw error;
		}

		// Verificar que el usuario esté activo
		if (!usuario.activo) {
			throw new ErrorAutenticacion('Usuario inactivo. Contacte al administrador.');
		}

		return res.json({
			exito: true,
			mensaje: 'Inicio de sesión exitoso',
			datos: {
				usuario: {
					id: usuario.id,
					nombre: usuario.nombre,
					apellido: usuario.apellido,
					email: usuario.email,
					rol: usuario.rol
				},
				sesion: data.session
			}
		});

	} catch (error) {
		console.error('Error en login:', error);
		throw error;
	}
}

/**
 * Cerrar sesión
 * POST /api/auth/logout
 */
async function logout(req, res) {
	try {
		const { error } = await supabase.auth.signOut();

		if (error) {
			throw new ErrorAutenticacion('Error al cerrar sesión');
		}

		return res.json({
			exito: true,
			mensaje: 'Sesión cerrada exitosamente'
		});

	} catch (error) {
		console.error('Error en logout:', error);
		throw error;
	}
}

/**
 * Obtener usuario actual
 * GET /api/auth/me
 */
async function obtenerUsuarioActual(req, res) {
	try {
		const usuario = req.usuario;

		return res.json({
			exito: true,
			datos: {
				id: usuario.id,
				nombre: usuario.nombre,
				apellido: usuario.apellido,
				email: usuario.email,
				telefono: usuario.telefono,
				rol: usuario.rol,
				activo: usuario.activo,
				fecha_creacion: usuario.fecha_creacion
			}
		});

	} catch (error) {
		console.error('Error al obtener usuario actual:', error);
		throw error;
	}
}

/**
 * Actualizar perfil del usuario actual
 * PUT /api/auth/perfil
 */
async function actualizarPerfil(req, res) {
	try {
		const usuario = req.usuario;
		const { nombre, apellido, telefono } = req.body;

		const datosActualizados = {};
		if (nombre) datosActualizados.nombre = nombre;
		if (apellido) datosActualizados.apellido = apellido;
		if (telefono !== undefined) datosActualizados.telefono = telefono;

		const usuarioActualizado = await servicioUsuarios.actualizarUsuario(
			usuario.id,
			datosActualizados,
			false // No es operación admin, el usuario actualiza su propio perfil
		);

		return res.json({
			exito: true,
			mensaje: 'Perfil actualizado exitosamente',
			datos: usuarioActualizado
		});

	} catch (error) {
		console.error('Error al actualizar perfil:', error);
		throw error;
	}
}

/**
 * Recuperar contraseña
 * POST /api/auth/recuperar-password
 */
async function recuperarPassword(req, res) {
	try {
		const { email } = req.body;

		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${process.env.FRONTEND_URL}/restablecer-password`
		});

		if (error) {
			throw new ErrorAutenticacion(error.message);
		}

		return res.json({
			exito: true,
			mensaje: 'Se ha enviado un correo de recuperación de contraseña'
		});

	} catch (error) {
		console.error('Error al recuperar contraseña:', error);
		throw error;
	}
}

/**
 * Cambiar contraseña
 * POST /api/auth/cambiar-password
 */
async function cambiarPassword(req, res) {
	try {
		const { passwordActual, passwordNuevo } = req.body;
		const usuario = req.usuario;

		// Verificar contraseña actual
		const { error: errorVerificacion } = await supabase.auth.signInWithPassword({
			email: usuario.email,
			password: passwordActual
		});

		if (errorVerificacion) {
			throw new ErrorAutenticacion('Contraseña actual incorrecta');
		}

		// Actualizar contraseña
		const { error } = await supabase.auth.updateUser({
			password: passwordNuevo
		});

		if (error) {
			throw new ErrorAutenticacion(error.message);
		}

		return res.json({
			exito: true,
			mensaje: 'Contraseña actualizada exitosamente'
		});

	} catch (error) {
		console.error('Error al cambiar contraseña:', error);
		throw error;
	}
}

module.exports = {
	registro,
	login,
	logout,
	obtenerUsuarioActual,
	actualizarPerfil,
	recuperarPassword,
	cambiarPassword
};

