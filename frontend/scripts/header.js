/**
 * Script para gestionar el header dinámicamente
 */

(function() {
	// Calcular ruta relativa basada en la ubicación actual
	function calcularRutaRelativa(targetFile) {
		const currentPath = window.location.pathname;
		const pagePath = currentPath.substring(currentPath.indexOf('/paginas/'));
		const depth = (pagePath.match(/\//g) || []).length - 2; // -2 porque /paginas/ cuenta como 2
		
		let prefix = '';
		if (depth > 0) {
			prefix = '../'.repeat(depth);
		} else if (depth === 0) {
			prefix = './';
		}
		
		return prefix + targetFile;
	}

	// Configurar enlaces con rutas relativas
	function configurarEnlaces() {
		document.querySelectorAll('[data-link]').forEach(link => {
			const targetFile = link.getAttribute('data-link');
			link.href = calcularRutaRelativa(targetFile);
		});
	}

	// Actualizar navegación según estado de autenticación
	function actualizarHeader() {
		const usuario = Auth.obtenerUsuario();
		
		// Elementos
		const usuarioNoAuth = document.getElementById('usuarioNoAutenticado');
		const usuarioAuth = document.getElementById('usuarioAutenticado');
		const navUsuarioAuth = document.getElementById('navUsuarioAutenticado');
		const navOrganizador = document.getElementById('navOrganizador');
		const navAdministrador = document.getElementById('navAdministrador');
		const navTaquilla = document.getElementById('navTaquilla');
		const nombreUsuario = document.getElementById('nombreUsuario');
		const btnCerrarSesion = document.getElementById('btnCerrarSesion');

		// Configurar rutas relativas
		configurarEnlaces();

		if (usuario) {
			// Usuario autenticado
			if (usuarioNoAuth) usuarioNoAuth.classList.add('oculto');
			if (usuarioAuth) usuarioAuth.classList.remove('oculto');
			if (navUsuarioAuth) navUsuarioAuth.classList.remove('oculto');
			if (nombreUsuario) nombreUsuario.textContent = `${usuario.nombre} ${usuario.apellido}`;

			// Mostrar navegación según rol
			if (usuario.rol === CONFIG.ROLES.ADMINISTRADOR) {
				if (navAdministrador) navAdministrador.classList.remove('oculto');
				if (navOrganizador) navOrganizador.classList.remove('oculto');
			} else if (usuario.rol === CONFIG.ROLES.ORGANIZADOR) {
				if (navOrganizador) navOrganizador.classList.remove('oculto');
			} else if (usuario.rol === CONFIG.ROLES.TAQUILLA) {
				if (navTaquilla) navTaquilla.classList.remove('oculto');
			}

			// Evento cerrar sesión
			if (btnCerrarSesion) {
				btnCerrarSesion.onclick = () => {
					if (confirm('¿Estás seguro de cerrar sesión?')) {
						Auth.cerrarSesion();
					}
				};
			}
		} else {
			// Usuario no autenticado
			if (usuarioNoAuth) usuarioNoAuth.classList.remove('oculto');
			if (usuarioAuth) usuarioAuth.classList.add('oculto');
			if (navUsuarioAuth) navUsuarioAuth.classList.add('oculto');
			if (navOrganizador) navOrganizador.classList.add('oculto');
			if (navAdministrador) navAdministrador.classList.add('oculto');
			if (navTaquilla) navTaquilla.classList.add('oculto');
		}

		// Menu toggle para móviles
		const menuToggle = document.getElementById('menuToggle');
		const headerNav = document.getElementById('headerNav');
		if (menuToggle && headerNav) {
			menuToggle.onclick = () => {
				headerNav.classList.toggle('oculto');
			};
		}
	}

	// Ejecutar cuando el DOM esté listo
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			setTimeout(actualizarHeader, 100);
		});
	} else {
		setTimeout(actualizarHeader, 100);
	}
})();

