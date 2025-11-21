/**
 * Script para gestionar el header dinámicamente
 */

;(function() {
	function calcularRutaRelativa(targetFile) {
		const currentPath = window.location.pathname;
		const index = currentPath.indexOf('/paginas/');
		if (index === -1) {
			return targetFile;
		}
		const pagePath = currentPath.substring(index);
		const depth = (pagePath.match(/\//g) || []).length - 2;

		let prefix = '';
		if (depth > 0) {
			prefix = '../'.repeat(depth);
		} else if (depth === 0) {
			prefix = './';
		}

		return prefix + targetFile;
	}

	function configurarEnlaces() {
		document.querySelectorAll('[data-link]').forEach(link => {
			const targetFile = link.getAttribute('data-link');
			link.href = calcularRutaRelativa(targetFile);
		});
	}

	function actualizarHeader() {
		const usuario = typeof Auth !== 'undefined' ? Auth.obtenerUsuario() : null;

		const usuarioNoAuth = document.getElementById('usuarioNoAutenticado');
		const usuarioAuth = document.getElementById('usuarioAutenticado');
		const navUsuarioAuth = document.getElementById('navUsuarioAutenticado');
		const navOrganizador = document.getElementById('navOrganizador');
		const navAdministrador = document.getElementById('navAdministrador');
		const navTaquilla = document.getElementById('navTaquilla');
		const nombreUsuario = document.getElementById('nombreUsuario');
		const btnCerrarSesion = document.getElementById('btnCerrarSesion');

		configurarEnlaces();

		if (usuario) {
			if (usuarioNoAuth) usuarioNoAuth.classList.add('oculto');
			if (usuarioAuth) usuarioAuth.classList.remove('oculto');
			if (navUsuarioAuth) navUsuarioAuth.classList.remove('oculto');
			if (nombreUsuario) nombreUsuario.textContent = `${usuario.nombre} ${usuario.apellido}`;

			if (usuario.rol === CONFIG.ROLES.ADMINISTRADOR) {
				if (navAdministrador) navAdministrador.classList.remove('oculto');
				if (navOrganizador) navOrganizador.classList.remove('oculto');
			} else if (usuario.rol === CONFIG.ROLES.ORGANIZADOR) {
				if (navOrganizador) navOrganizador.classList.remove('oculto');
			} else if (usuario.rol === CONFIG.ROLES.TAQUILLA) {
				if (navTaquilla) navTaquilla.classList.remove('oculto');
			}

			if (btnCerrarSesion) {
				btnCerrarSesion.onclick = () => {
					if (confirm('¿Estás seguro de cerrar sesión?')) {
						Auth.cerrarSesion();
					}
				};
			}
		} else {
			if (usuarioNoAuth) usuarioNoAuth.classList.remove('oculto');
			if (usuarioAuth) usuarioAuth.classList.add('oculto');
			if (navUsuarioAuth) navUsuarioAuth.classList.add('oculto');
			if (navOrganizador) navOrganizador.classList.add('oculto');
			if (navAdministrador) navAdministrador.classList.add('oculto');
			if (navTaquilla) navTaquilla.classList.add('oculto');
		}

		const menuToggle = document.getElementById('menuToggle');
		const headerNav = document.getElementById('headerNav');
		if (menuToggle && headerNav) {
			menuToggle.onclick = () => {
				headerNav.classList.toggle('oculto');
			};
		}
	}

	function initHeader() {
		const header = document.getElementById('header');
		if (!header || header.dataset.initialized) return;
		header.dataset.initialized = 'true';
		actualizarHeader();
	}

	window.Header = window.Header || {};
	window.Header.init = initHeader;

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initHeader);
	} else {
		initHeader();
	}

	const observer = new MutationObserver(() => initHeader());
	observer.observe(document.body, { childList: true, subtree: true });
})();

