/**
 * Funciones de utilidad general
 */

/**
 * Mostrar toast/notificación
 */
function mostrarToast(mensaje, tipo = 'info', duracion = 5000) {
	// Crear contenedor de toasts si no existe
	let contenedor = document.getElementById('toast-contenedor');
	if (!contenedor) {
		contenedor = document.createElement('div');
		contenedor.id = 'toast-contenedor';
		contenedor.className = 'toast-contenedor';
		document.body.appendChild(contenedor);
	}

	// Crear toast
	const toast = document.createElement('div');
	toast.className = `toast ${tipo}`;

	const iconos = {
		exito: '✓',
		error: '✗',
		info: 'ℹ',
		advertencia: '⚠'
	};

	toast.innerHTML = `
		<div class="toast-icono">${iconos[tipo] || iconos.info}</div>
		<div class="toast-contenido">
			<div class="toast-mensaje">${mensaje}</div>
		</div>
	`;

	contenedor.appendChild(toast);

	// Auto-remover después de la duración
	setTimeout(() => {
		toast.style.opacity = '0';
		setTimeout(() => {
			contenedor.removeChild(toast);
		}, 300);
	}, duracion);
}

/**
 * Formatear fecha
 */
function formatearFecha(fecha, incluirHora = true) {
	const date = new Date(fecha);
	const opciones = {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	};

	if (incluirHora) {
		opciones.hour = '2-digit';
		opciones.minute = '2-digit';
	}

	return date.toLocaleDateString('es-ES', opciones);
}

/**
 * Formatear precio
 */
function formatearPrecio(precio) {
	return new Intl.NumberFormat('es-ES', {
		style: 'currency',
		currency: 'USD'
	}).format(precio);
}

/**
 * Mostrar loader
 */
function mostrarLoader(contenedor) {
	contenedor.innerHTML = '<div class="loader"></div>';
}

/**
 * Ocultar loader
 */
function ocultarLoader(contenedor) {
	const loader = contenedor.querySelector('.loader');
	if (loader) {
		loader.remove();
	}
}

/**
 * Validar email
 */
function validarEmail(email) {
	const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return regex.test(email);
}

/**
 * Validar formulario
 */
function validarFormulario(formulario) {
	const campos = formulario.querySelectorAll('[required]');
	let valido = true;

	campos.forEach(campo => {
		if (!campo.value.trim()) {
			campo.classList.add('error');
			valido = false;
		} else {
			campo.classList.remove('error');
		}
	});

	return valido;
}

/**
 * Debounce - Limitar ejecuciones de función
 */
function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

/**
 * Copiar al portapapeles
 */
async function copiarAlPortapapeles(texto) {
	try {
		await navigator.clipboard.writeText(texto);
		mostrarToast('Copiado al portapapeles', 'exito');
	} catch (error) {
		console.error('Error al copiar:', error);
		mostrarToast('Error al copiar', 'error');
	}
}

/**
 * Obtener parámetros de URL
 */
function obtenerParametrosURL() {
	const params = new URLSearchParams(window.location.search);
	const obj = {};
	for (const [key, value] of params) {
		obj[key] = value;
	}
	return obj;
}

/**
 * Scroll suave a elemento
 */
function scrollSuave(elementoId) {
	const elemento = document.getElementById(elementoId);
	if (elemento) {
		elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
}

/**
 * Confirmar acción
 */
function confirmarAccion(mensaje) {
	return confirm(mensaje);
}

/**
 * Truncar texto
 */
function truncarTexto(texto, longitud = 100) {
	if (texto.length <= longitud) return texto;
	return texto.substring(0, longitud) + '...';
}

/**
 * Calcular porcentaje
 */
function calcularPorcentaje(valor, total) {
	if (total === 0) return 0;
	return ((valor / total) * 100).toFixed(2);
}

