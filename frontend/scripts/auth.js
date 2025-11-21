/**
 * Gestión de autenticación
 */

const Auth = {
	/**
	 * Verificar si el usuario está autenticado
	 */
	estaAutenticado() {
		const sesion = localStorage.getItem(CONFIG.STORAGE_KEYS.SESION);
		const usuario = localStorage.getItem(CONFIG.STORAGE_KEYS.USUARIO);
		return sesion && usuario;
	},

	/**
	 * Obtener usuario actual
	 */
	obtenerUsuario() {
		const usuario = localStorage.getItem(CONFIG.STORAGE_KEYS.USUARIO);
		if (usuario) {
			try {
				return JSON.parse(usuario);
			} catch (error) {
				return null;
			}
		}
		return null;
	},

	/**
	 * Guardar sesión
	 */
	guardarSesion(sesion, usuario) {
		try {
			if (!sesion) {
				console.warn('⚠️ Intento de guardar sesión nula');
				return;
			}
			if (!usuario) {
				console.warn('⚠️ Intento de guardar usuario nulo');
				return;
			}

			const sesionJson = JSON.stringify(sesion);
			const usuarioJson = JSON.stringify(usuario);

			localStorage.setItem(CONFIG.STORAGE_KEYS.SESION, sesionJson);
			localStorage.setItem(CONFIG.STORAGE_KEYS.USUARIO, usuarioJson);

			console.log('💾 Sesión guardada en localStorage');
			console.log('   Clave:', CONFIG.STORAGE_KEYS.SESION);
			console.log('   Tamaño:', sesionJson.length, 'caracteres');
		} catch (error) {
			console.error('❌ Error al guardar sesión:', error);
			throw error;
		}
	},

	/**
	 * Cerrar sesión
	 */
	async cerrarSesion() {
		try {
			await apiCliente.post('/auth/logout');
		} catch (error) {
			console.error('Error al cerrar sesión:', error);
		} finally {
			localStorage.removeItem(CONFIG.STORAGE_KEYS.SESION);
			localStorage.removeItem(CONFIG.STORAGE_KEYS.USUARIO);
			// Redirigir a index usando ruta relativa
			const currentPath = window.location.pathname;
			if (currentPath.includes('/paginas/')) {
				const depth = (currentPath.split('/paginas/')[1].match(/\//g) || []).length;
				const prefix = depth > 0 ? '../'.repeat(depth) : './';
				window.location.href = prefix + 'index.html';
			} else {
				window.location.href = './paginas/index.html';
			}
		}
	},

	/**
	 * Verificar rol del usuario
	 */
	tieneRol(roles) {
		const usuario = this.obtenerUsuario();
		if (!usuario) return false;
		
		if (Array.isArray(roles)) {
			return roles.includes(usuario.rol);
		}
		return usuario.rol === roles;
	},

	/**
	 * Redirigir si no está autenticado
	 */
	requiereAutenticacion() {
		if (!this.estaAutenticado()) {
			const currentPath = window.location.pathname;
			if (currentPath.includes('/paginas/')) {
				const depth = (currentPath.split('/paginas/')[1].match(/\//g) || []).length;
				const prefix = depth > 0 ? '../'.repeat(depth) : './';
				window.location.href = prefix + 'login.html';
			} else {
				window.location.href = './paginas/login.html';
			}
			return false;
		}
		return true;
	},

	/**
	 * Redirigir si no tiene el rol requerido
	 */
	requiereRol(roles) {
		if (!this.requiereAutenticacion()) return false;
		
		if (!this.tieneRol(roles)) {
			mostrarToast('No tienes permisos para acceder a esta página', 'error');
			const currentPath = window.location.pathname;
			if (currentPath.includes('/paginas/')) {
				const depth = (currentPath.split('/paginas/')[1].match(/\//g) || []).length;
				const prefix = depth > 0 ? '../'.repeat(depth) : './';
				window.location.href = prefix + 'index.html';
			} else {
				window.location.href = './paginas/index.html';
			}
			return false;
		}
		return true;
	},

	/**
	 * Registrar nuevo usuario
	 */
	async registrar(datos) {
		try {
			const response = await apiCliente.post('/auth/registro', datos);
			
			if (response.exito && response.datos) {
				this.guardarSesion(response.datos.sesion, response.datos.usuario);
				return response;
			}
			
			throw new Error(response.mensaje || 'Error al registrar usuario');
		} catch (error) {
			console.error('Error en registro:', error);
			throw error;
		}
	},

	/**
	 * Iniciar sesión
	 */
	async login(email, password) {
		try {
			console.log('Iniciando login para:', email);
			const response = await apiCliente.post('/auth/login', { email, password });
			
			console.log('Respuesta del servidor:', response);
			
			if (response.exito && response.datos) {
				console.log('Login exitoso, guardando sesión...');
				console.log('Datos de sesión:', response.datos.sesion);
				console.log('Datos de usuario:', response.datos.usuario);
				
				this.guardarSesion(response.datos.sesion, response.datos.usuario);
				
				// Verificar que se guardó correctamente
				const sesionGuardada = this.obtenerSesion();
				const usuarioGuardado = this.obtenerUsuario();
				console.log('Sesión guardada:', sesionGuardada ? 'Sí' : 'No');
				console.log('Usuario guardado:', usuarioGuardado ? 'Sí' : 'No');
				
				return response;
			}
			
			console.error('Respuesta sin éxito o sin datos:', response);
			throw new Error(response.mensaje || 'Error al iniciar sesión');
		} catch (error) {
			console.error('Error en login:', error);
			throw error;
		}
	},

	/**
	 * Actualizar datos del usuario en localStorage
	 */
	actualizarUsuario(usuario) {
		localStorage.setItem(CONFIG.STORAGE_KEYS.USUARIO, JSON.stringify(usuario));
	},

	/**
	 * Obtener token de autenticación
	 */
	obtenerToken() {
		const sesion = localStorage.getItem(CONFIG.STORAGE_KEYS.SESION);
		if (sesion) {
			try {
				const sesionData = JSON.parse(sesion);
				return sesionData.access_token;
			} catch (error) {
				return null;
			}
		}
		return null;
	},

	/**
	 * Obtener información completa de la sesión
	 */
	obtenerSesion() {
		const sesion = localStorage.getItem(CONFIG.STORAGE_KEYS.SESION);
		if (sesion) {
			try {
				return JSON.parse(sesion);
			} catch (error) {
				return null;
			}
		}
		return null;
	},

	/**
	 * Mostrar información del usuario que inicia sesión
	 */
	mostrarInfoEnConsola() {
		const token = this.obtenerToken();
		const sesion = this.obtenerSesion();
		const usuario = this.obtenerUsuario();
	

		console.log('=== INFORMACIÓN DE AUTENTICACIÓN ===');
		console.log('Token:', token);
		console.log('Sesión completa:', sesion);
		console.log('Usuario:', usuario);
		console.log('Está autenticado:', this.estaAutenticado());

		return {
			token,
			sesion,
			usuario,
			estaAutenticado: this.estaAutenticado(),
			
		};
	}
};

